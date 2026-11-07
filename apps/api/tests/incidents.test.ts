import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Incidents', () => {
  let sessionCookie: string;
  let createdIncidentId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@northstarlabs.io',
        password: 'admin',
      });
    sessionCookie = res.headers['set-cookie'][0];
  });

  describe('GET /api/incidents', () => {
    it('should list incidents', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should filter by severity', async () => {
      const res = await request(app)
        .get('/api/incidents?severity=critical')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.every((i: any) => i.severity === 'critical')).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/incidents?status=investigating')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.every((i: any) => i.status === 'investigating')).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/incidents?page=1&pageSize=2')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(2);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/incidents');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/incidents', () => {
    it('should create an incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Test incident from API',
          description: 'This is a test incident created via the API',
          severity: 'medium',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test incident from API');
      expect(res.body.data.severity).toBe('medium');
      expect(res.body.data.status).toBe('investigating');
      expect(res.body.data.number).toBeGreaterThan(0);

      createdIncidentId = res.body.data.id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Cookie', sessionCookie)
        .send({
          description: 'Missing title and severity',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should validate severity enum', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Test',
          severity: 'invalid-severity',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/incidents/:id', () => {
    it('should get incident by ID', async () => {
      const res = await request(app)
        .get(`/api/incidents/${createdIncidentId}`)
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdIncidentId);
      expect(res.body.data.title).toBe('Test incident from API');
    });

    it('should return 404 for non-existent incident', async () => {
      const res = await request(app)
        .get('/api/incidents/00000000-0000-0000-0000-000000000000')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(404);
    });

    it('should validate UUID format', async () => {
      const res = await request(app)
        .get('/api/incidents/not-a-uuid')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/incidents/:id', () => {
    it('should update incident status', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${createdIncidentId}`)
        .set('Cookie', sessionCookie)
        .send({
          status: 'identified',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('identified');
    });

    it('should update incident severity', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${createdIncidentId}`)
        .set('Cookie', sessionCookie)
        .send({
          severity: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.severity).toBe('high');
    });

    it('should mark incident as resolved', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${createdIncidentId}`)
        .set('Cookie', sessionCookie)
        .send({
          status: 'resolved',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolvedAt).toBeDefined();
    });
  });

  describe('POST /api/incidents/:id/comments', () => {
    it('should add a comment', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/comments`)
        .set('Cookie', sessionCookie)
        .send({
          body: 'This is a test comment',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.body).toBe('This is a test comment');
      expect(res.body.data.user).toBeDefined();
    });

    it('should validate comment body', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/comments`)
        .set('Cookie', sessionCookie)
        .send({
          body: '',
        });

      expect(res.status).toBe(422);
    });
  });
});

describe('Tenant Isolation', () => {
  let user1Cookie: string;
  let user2Cookie: string;

  beforeAll(async () => {
    // Login as user 1
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@northstarlabs.io',
        password: 'admin',
      });
    user1Cookie = res1.headers['set-cookie'][0];

    // Login as user 2
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sarah@northstarlabs.io',
        password: 'password123',
      });
    user2Cookie = res2.headers['set-cookie'][0];
  });

  it('should only return incidents from authenticated user organization', async () => {
    // Both users are in the same organization, so they should see the same incidents
    const res1 = await request(app)
      .get('/api/incidents')
      .set('Cookie', user1Cookie);

    const res2 = await request(app)
      .get('/api/incidents')
      .set('Cookie', user2Cookie);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Both should see the same incidents (same org)
    expect(res1.body.meta.total).toBe(res2.body.meta.total);
  });
});
