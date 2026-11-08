import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Users and organizations', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@northstarlabs.io', password: 'admin' });
    sessionCookie = res.headers['set-cookie'][0];
  });

  describe('GET /api/users', () => {
    it('should list the organization members with their role', async () => {
      const res = await request(app).get('/api/users').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const user of res.body.data) {
        expect(user.id).toBeDefined();
        expect(user.email).toContain('@');
        expect(['owner', 'admin', 'member', 'viewer']).toContain(user.role);
        expect(user.passwordHash).toBeUndefined();
      }
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/organizations', () => {
    it('should list organizations with plan and member count', async () => {
      const res = await request(app).get('/api/organizations').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const org of res.body.data) {
        expect(org.plan).toBeDefined();
        expect(org._count.members).toBeGreaterThan(0);
      }
    });

    it('should match the member count of the users endpoint for the current organization', async () => {
      const current = await request(app)
        .get('/api/organizations/current')
        .set('Cookie', sessionCookie);
      const users = await request(app).get('/api/users').set('Cookie', sessionCookie);

      expect(current.status).toBe(200);
      expect(current.body.data._count.members).toBe(users.body.data.length);
    });
  });
});
