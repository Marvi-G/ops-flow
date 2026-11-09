import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Projects', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@northstarlabs.io', password: 'admin' });
    sessionCookie = res.headers['set-cookie'][0];
  });

  describe('GET /api/projects', () => {
    it('should list projects with incident stats', async () => {
      const res = await request(app).get('/api/projects').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const project of res.body.data) {
        expect(typeof project.activeIncidentCount).toBe('number');
        expect(project._count.services).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(new Date(project.lastActivity).getTime())).toBe(false);
      }
    });

    it('should count each active incident once per project', async () => {
      const projects = await request(app).get('/api/projects').set('Cookie', sessionCookie);
      const incidents = await request(app)
        .get('/api/incidents?pageSize=100')
        .set('Cookie', sessionCookie);

      const active = incidents.body.data.filter(
        (i: any) => i.status !== 'resolved' && i.status !== 'postmortem'
      );
      const totalActiveCount = projects.body.data.reduce(
        (sum: number, p: any) => sum + p.activeIncidentCount,
        0
      );

      // An incident can touch several projects, so the sum is at least the number of
      // active incidents that have services, and never more than active x projects.
      expect(totalActiveCount).toBeGreaterThanOrEqual(
        active.filter((i: any) => i.services.length > 0).length
      );
      expect(totalActiveCount).toBeLessThanOrEqual(active.length * projects.body.data.length);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/projects');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a project with incident stats', async () => {
      const list = await request(app).get('/api/projects').set('Cookie', sessionCookie);
      const target = list.body.data[0];

      const res = await request(app)
        .get(`/api/projects/${target.id}`)
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(target.id);
      expect(res.body.data.activeIncidentCount).toBe(target.activeIncidentCount);
      expect(res.body.data.services).toBeInstanceOf(Array);
    });

    it('should return 404 for a project in no organization of the user', async () => {
      const res = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(404);
    });
  });
});

describe('Project write path', () => {
  let admin: string;
  let member: string;
  let viewer: string;
  let projectId: string;
  const name = `Write test ${Date.now()}`;

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.headers['set-cookie'][0] as string;
  };

  beforeAll(async () => {
    admin = await login('admin@northstarlabs.io', 'admin');
    member = await login('alex@northstarlabs.io', 'password123');
    viewer = await login('david@northstarlabs.io', 'password123');
  });

  it('creates a project and returns it with counts, ready for the list', async () => {
    const teams = await request(app).get('/api/teams').set('Cookie', admin);
    const teamId = teams.body.data[0].id;

    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', admin)
      .send({ name: `  ${name}  `, description: 'Created by a test', teamId });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.team.id).toBe(teamId);
    expect(res.body.data._count.services).toBe(0);
    expect(res.body.data.activeIncidentCount).toBe(0);
    projectId = res.body.data.id;
  });

  it('refuses a second project with the same name', async () => {
    const res = await request(app).post('/api/projects').set('Cookie', admin).send({ name });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_NAME');
  });

  it('refuses a team that is not in the organization', async () => {
    const unknown = '11111111-1111-4111-8111-111111111111';
    const create = await request(app).post('/api/projects').set('Cookie', admin).send({ name: `${name} x`, teamId: unknown });
    const update = await request(app).patch(`/api/projects/${projectId}`).set('Cookie', admin).send({ teamId: unknown });

    expect(create.status).toBe(422);
    expect(create.body.error.details.teamId).toBeDefined();
    expect(update.status).toBe(422);
  });

  it('updates the status and description, and can rename to its own name', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Cookie', admin)
      .send({ name, status: 'maintenance', description: 'Changed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('maintenance');
    expect(res.body.data.description).toBe('Changed');
    expect(res.body.data._count).toBeDefined();
  });

  it('lets a member create and edit but not delete', async () => {
    const edit = await request(app).patch(`/api/projects/${projectId}`).set('Cookie', member).send({ status: 'active' });
    const remove = await request(app).delete(`/api/projects/${projectId}`).set('Cookie', member);

    expect(edit.status).toBe(200);
    expect(remove.status).toBe(403);
  });

  it('does not let a viewer create, edit or delete', async () => {
    const create = await request(app).post('/api/projects').set('Cookie', viewer).send({ name: 'nope' });
    const edit = await request(app).patch(`/api/projects/${projectId}`).set('Cookie', viewer).send({ status: 'archived' });
    const remove = await request(app).delete(`/api/projects/${projectId}`).set('Cookie', viewer);

    expect([create.status, edit.status, remove.status]).toEqual([403, 403, 403]);
  });

  it('refuses to delete a project that still has services', async () => {
    const list = await request(app).get('/api/projects').set('Cookie', admin);
    const withServices = list.body.data.find((p: any) => p._count.services > 0);

    const res = await request(app).delete(`/api/projects/${withServices.id}`).set('Cookie', admin);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROJECT_HAS_SERVICES');

    const still = await request(app).get(`/api/projects/${withServices.id}`).set('Cookie', admin);
    expect(still.status).toBe(200);
  });

  it('deletes an empty project', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}`).set('Cookie', admin);
    const again = await request(app).get(`/api/projects/${projectId}`).set('Cookie', admin);

    expect(res.status).toBe(204);
    expect(again.status).toBe(404);
  });
});
