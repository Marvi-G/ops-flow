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
