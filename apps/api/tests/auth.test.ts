import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Authentication', () => {
  let sessionCookie: string;

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@northstarlabs.io',
          password: 'admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@northstarlabs.io');
      expect(res.body.data.user.name).toBe('Mark Chen');
      expect(res.body.data.organization.name).toBe('Northstar Labs');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@northstarlabs.io',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@northstarlabs.io',
          password: 'admin',
        });
      sessionCookie = res.headers['set-cookie'][0];
    });

    it('should return current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@northstarlabs.io');
      expect(res.body.data.organizations).toBeInstanceOf(Array);
      expect(res.body.data.organizations.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear session', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@northstarlabs.io',
          password: 'admin',
        });

      const cookie = loginRes.headers['set-cookie'][0];

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(204);

      // Verify session is invalid
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(401);
    });
  });
});
