import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/index.js';
import { getDatabase } from '../src/infrastructure/database/index.js';

const stamp = Date.now();
const PASSWORD = 'password123';
const DEMO_EMAIL = 'demo@northstarlabs.io';

describe('Profile and demo account', () => {
  const db = getDatabase();
  const email = `tmp-profile-${stamp}@example.test`;
  let userId = '';

  const login = async (address: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email: address, password });
    return res.headers['set-cookie']?.[0] as string;
  };

  beforeAll(async () => {
    const organization = await db.organization.findUniqueOrThrow({ where: { slug: 'northstar-labs' } });
    const hash = await bcrypt.hash(PASSWORD, 4);

    const user = await db.user.create({
      data: {
        email,
        name: 'Temp Profile',
        passwordHash: hash,
        memberships: { create: { organizationId: organization.id, role: 'member' } },
      },
    });
    userId = user.id;

    // The shared demo visitor (what `npm run db:add-demo` creates), as a viewer
    const demo = await db.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { passwordHash: await bcrypt.hash('demo', 4) },
      create: { email: DEMO_EMAIL, name: 'Demo Visitor', passwordHash: await bcrypt.hash('demo', 4) },
    });
    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: demo.id } },
      update: { role: 'viewer' },
      create: { organizationId: organization.id, userId: demo.id, role: 'viewer' },
    });
  });

  afterAll(async () => {
    if (userId) await db.user.delete({ where: { id: userId } });
  });

  describe('PATCH /api/users/current', () => {
    it('changes and trims the name', async () => {
      const cookie = await login(email, PASSWORD);

      const res = await request(app).patch('/api/users/current').set('Cookie', cookie).send({ name: '  Renamed Person  ' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed Person');
      expect(res.body.data.email).toBe(email);

      const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
      expect(me.body.data.user.name).toBe('Renamed Person');
    });

    it('rejects an empty name and needs a signed-in user', async () => {
      const cookie = await login(email, PASSWORD);

      const empty = await request(app).patch('/api/users/current').set('Cookie', cookie).send({ name: '   ' });
      const anonymous = await request(app).patch('/api/users/current').send({ name: 'x' });

      expect([empty.status, anonymous.status]).toEqual([422, 401]);
    });
  });

  describe('POST /api/users/current/password', () => {
    const change = (cookie: string, currentPassword: string, newPassword: string) =>
      request(app).post('/api/users/current/password').set('Cookie', cookie).send({ currentPassword, newPassword });

    it('answers a wrong current password with a field error, not a 401 (which would sign the person out)', async () => {
      const cookie = await login(email, PASSWORD);

      const res = await change(cookie, 'not-my-password', 'a-new-password-1');
      const stillSignedIn = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(422);
      expect(res.body.error.details.currentPassword).toBeDefined();
      expect(stillSignedIn.status).toBe(200);
    });

    it('rejects a new password that is too short, too long or the same as the old one', async () => {
      const cookie = await login(email, PASSWORD);

      const short = await change(cookie, PASSWORD, 'short');
      const long = await change(cookie, PASSWORD, 'x'.repeat(73));
      const same = await change(cookie, PASSWORD, PASSWORD);

      expect([short.status, long.status, same.status]).toEqual([422, 422, 422]);
      expect(same.body.error.details.newPassword).toBeDefined();
    });

    it('changes the password, keeps this session and signs out the others', async () => {
      const thisSession = await login(email, PASSWORD);
      const otherDevice = await login(email, PASSWORD);

      const res = await change(thisSession, PASSWORD, 'a-brand-new-password');

      expect(res.status).toBe(204);

      const mine = await request(app).get('/api/auth/me').set('Cookie', thisSession);
      const theirs = await request(app).get('/api/auth/me').set('Cookie', otherDevice);
      const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'a-brand-new-password' });
      const oldLogin = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });

      expect([mine.status, theirs.status, newLogin.status, oldLogin.status]).toEqual([200, 401, 200, 401]);
    });
  });

  describe('the shared demo account', () => {
    it('can look at everything', async () => {
      const cookie = await login(DEMO_EMAIL, 'demo');

      const incidents = await request(app).get('/api/incidents').set('Cookie', cookie);
      const projects = await request(app).get('/api/projects').set('Cookie', cookie);

      expect([incidents.status, projects.status]).toEqual([200, 200]);
      expect(incidents.body.meta.total).toBeGreaterThan(0);
    });

    it('cannot change anything', async () => {
      const cookie = await login(DEMO_EMAIL, 'demo');

      const attempts = await Promise.all([
        request(app).post('/api/incidents').set('Cookie', cookie).send({ title: 'x', severity: 'low' }),
        request(app).post('/api/projects').set('Cookie', cookie).send({ name: 'x' }),
        request(app).post('/api/services').set('Cookie', cookie).send({ name: 'x' }),
        request(app).post('/api/teams').set('Cookie', cookie).send({ name: 'x' }),
        request(app).patch('/api/organizations/current').set('Cookie', cookie).send({ name: 'x' }),
      ]);

      expect(attempts.map((r) => r.status)).toEqual([403, 403, 403, 403, 403]);
    });

    it('cannot change its own name or password, so a visitor cannot lock out the next one', async () => {
      const cookie = await login(DEMO_EMAIL, 'demo');

      const rename = await request(app).patch('/api/users/current').set('Cookie', cookie).send({ name: 'Hacked' });
      const password = await request(app)
        .post('/api/users/current/password')
        .set('Cookie', cookie)
        .send({ currentPassword: 'demo', newPassword: 'locked-you-out' });

      expect([rename.status, password.status]).toEqual([403, 403]);
      expect(rename.body.error.code).toBe('DEMO_ACCOUNT');

      const stillWorks = await request(app).post('/api/auth/login').send({ email: DEMO_EMAIL, password: 'demo' });
      expect(stillWorks.status).toBe(200);
    });
  });
});
