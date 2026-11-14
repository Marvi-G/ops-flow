import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/index.js';
import { getDatabase } from '../src/infrastructure/database/index.js';

const stamp = Date.now();
const PASSWORD = 'password123';

describe('Organization settings and member management', () => {
  const db = getDatabase();
  let owner: string;
  let admin: string;
  let member: string;
  let viewer: string;
  let organizationId: string;
  let ownerId: string;
  let otherOrgId = '';

  // Throwaway people, so the seeded ones are never touched
  const tmp = {
    member: { id: '', email: `tmp-member-${stamp}@example.test`, role: 'member' },
    admin: { id: '', email: `tmp-admin-${stamp}@example.test`, role: 'admin' },
    gone: { id: '', email: `tmp-gone-${stamp}@example.test`, role: 'member' },
  };

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.headers['set-cookie'][0] as string;
  };

  beforeAll(async () => {
    owner = await login('john@northstarlabs.io', PASSWORD);
    admin = await login('admin@northstarlabs.io', 'admin');
    member = await login('alex@northstarlabs.io', PASSWORD);
    viewer = await login('david@northstarlabs.io', PASSWORD);

    const current = await request(app).get('/api/organizations/current').set('Cookie', owner);
    organizationId = current.body.data.id;
    const me = await request(app).get('/api/auth/me').set('Cookie', owner);
    ownerId = me.body.data.user.id;

    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    for (const person of Object.values(tmp)) {
      const user = await db.user.create({
        data: {
          email: person.email,
          name: `Temp ${person.role}`,
          passwordHash,
          memberships: { create: { organizationId, role: person.role } },
        },
      });
      person.id = user.id;
    }

    // Another organization that owns a slug
    const other = await db.organization.create({ data: { name: 'Temp org', slug: `temp-org-${stamp}` } });
    otherOrgId = other.id;
  });

  afterAll(async () => {
    // Users cascade to their memberships, team memberships and sessions
    await db.user.deleteMany({ where: { email: { in: Object.values(tmp).map((p) => p.email) } } });
    if (otherOrgId) await db.organization.delete({ where: { id: otherOrgId } });
  });

  describe('PATCH /api/organizations/current', () => {
    it('trims the name and returns the organization with its member count', async () => {
      const current = await request(app).get('/api/organizations/current').set('Cookie', admin);
      const { name, slug } = current.body.data;

      // Same values (once trimmed), so the demo organization is left as it was
      const res = await request(app)
        .patch('/api/organizations/current')
        .set('Cookie', admin)
        .send({ name: `  ${name}  `, slug });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(name);
      expect(res.body.data._count.members).toBeGreaterThan(0);
    });

    it('rejects a slug that is not lowercase letters, numbers and hyphens', async () => {
      for (const slug of ['Has Caps', 'under_score', '-leading', 'trailing-', 'a']) {
        const res = await request(app).patch('/api/organizations/current').set('Cookie', admin).send({ slug });
        expect(res.status).toBe(422);
        expect(res.body.error.details.slug).toBeDefined();
      }
    });

    it('rejects a slug another organization already uses', async () => {
      const res = await request(app)
        .patch('/api/organizations/current')
        .set('Cookie', admin)
        .send({ slug: `temp-org-${stamp}` });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_SLUG');
    });

    it('is only for admins and owners', async () => {
      const asMember = await request(app).patch('/api/organizations/current').set('Cookie', member).send({ name: 'x' });
      const asViewer = await request(app).patch('/api/organizations/current').set('Cookie', viewer).send({ name: 'x' });

      expect([asMember.status, asViewer.status]).toEqual([403, 403]);
    });
  });

  describe('PATCH /api/organizations/current/members/:userId', () => {
    const patch = (cookie: string, userId: string, role: string) =>
      request(app).patch(`/api/organizations/current/members/${userId}`).set('Cookie', cookie).send({ role });

    it('lets an admin change a member to viewer and back', async () => {
      const toViewer = await patch(admin, tmp.member.id, 'viewer');
      const back = await patch(admin, tmp.member.id, 'member');

      expect(toViewer.status).toBe(200);
      expect(toViewer.body.data.role).toBe('viewer');
      expect(toViewer.body.data.email).toBe(tmp.member.email);
      expect(back.body.data.role).toBe('member');
    });

    it('does not let an admin hand out admin or owner, or touch an admin or owner', async () => {
      const giveAdmin = await patch(admin, tmp.member.id, 'admin');
      const giveOwner = await patch(admin, tmp.member.id, 'owner');
      const touchAdmin = await patch(admin, tmp.admin.id, 'viewer');
      const touchOwner = await patch(admin, ownerId, 'viewer');

      expect([giveAdmin.status, giveOwner.status, touchAdmin.status, touchOwner.status]).toEqual([403, 403, 403, 403]);
      expect(giveAdmin.body.error.code).toBe('INSUFFICIENT_ROLE');
    });

    it('lets an owner promote to admin and demote again', async () => {
      const up = await patch(owner, tmp.member.id, 'admin');
      const down = await patch(owner, tmp.member.id, 'member');

      expect(up.body.data.role).toBe('admin');
      expect(down.body.data.role).toBe('member');
    });

    it('never lets anyone change their own role, so the last owner cannot be demoted', async () => {
      const res = await patch(owner, ownerId, 'viewer');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CANNOT_MODIFY_SELF');
    });

    it('takes effect on the next request', async () => {
      const cookie = await login(tmp.member.email, PASSWORD);
      const before = await request(app).post('/api/projects').set('Cookie', cookie).send({ name: `Role probe ${stamp}` });
      expect(before.status).toBe(201);
      await request(app).delete(`/api/projects/${before.body.data.id}`).set('Cookie', admin);

      await patch(admin, tmp.member.id, 'viewer');
      const after = await request(app).post('/api/projects').set('Cookie', cookie).send({ name: `Role probe 2 ${stamp}` });
      expect(after.status).toBe(403);

      await patch(admin, tmp.member.id, 'member');
    });

    it('needs the members.manage permission, a real member and a valid role', async () => {
      const asMember = await patch(member, tmp.member.id, 'viewer');
      const unknown = await patch(owner, '11111111-1111-4111-8111-111111111111', 'viewer');
      const badRole = await patch(owner, tmp.member.id, 'boss');
      const badId = await request(app).patch('/api/organizations/current/members/nope').set('Cookie', owner).send({ role: 'viewer' });

      expect([asMember.status, unknown.status, badRole.status, badId.status]).toEqual([403, 404, 422, 422]);
    });
  });

  describe('DELETE /api/organizations/current/members/:userId', () => {
    const remove = (cookie: string, userId: string) =>
      request(app).delete(`/api/organizations/current/members/${userId}`).set('Cookie', cookie);

    it('does not let an admin remove an admin or an owner, nor anyone remove themselves', async () => {
      const adminTarget = await remove(admin, tmp.admin.id);
      const ownerTarget = await remove(admin, ownerId);
      const self = await remove(owner, ownerId);

      expect([adminTarget.status, ownerTarget.status, self.status]).toEqual([403, 403, 403]);
      expect(self.body.error.code).toBe('CANNOT_MODIFY_SELF');
    });

    it('is not available to members or viewers', async () => {
      const asMember = await remove(member, tmp.gone.id);
      const asViewer = await remove(viewer, tmp.gone.id);

      expect([asMember.status, asViewer.status]).toEqual([403, 403]);
    });

    it('removes the person and everything that pointed at them in this organization', async () => {
      const goneCookie = await login(tmp.gone.email, PASSWORD);

      const teams = await request(app).get('/api/teams').set('Cookie', admin);
      const teamId = teams.body.data[0].id;
      await request(app).post(`/api/teams/${teamId}/members`).set('Cookie', admin).send({ userId: tmp.gone.id });

      const incident = await request(app)
        .post('/api/incidents')
        .set('Cookie', admin)
        .send({ title: `Assigned to a leaver ${stamp}`, severity: 'low', assigneeId: tmp.gone.id });
      expect(incident.body.data.assigneeId).toBe(tmp.gone.id);

      const res = await remove(admin, tmp.gone.id);
      expect(res.status).toBe(204);

      const members = await request(app).get('/api/users').set('Cookie', admin);
      expect(members.body.data.some((u: any) => u.id === tmp.gone.id)).toBe(false);

      const team = await request(app).get(`/api/teams/${teamId}`).set('Cookie', admin);
      expect(team.body.data.members.some((m: any) => m.user.id === tmp.gone.id)).toBe(false);

      const after = await request(app).get(`/api/incidents/${incident.body.data.id}`).set('Cookie', admin);
      expect(after.body.data.assigneeId).toBeNull();

      // Their old session no longer works
      const stale = await request(app).get('/api/incidents').set('Cookie', goneCookie);
      expect(stale.status).toBe(401);

      const again = await remove(admin, tmp.gone.id);
      expect(again.status).toBe(404);
    });

    it('lets an owner remove an admin', async () => {
      const res = await remove(owner, tmp.admin.id);

      expect(res.status).toBe(204);
    });
  });
});
