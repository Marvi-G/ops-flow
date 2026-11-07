import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Teams and services', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@northstarlabs.io', password: 'admin' });
    sessionCookie = res.headers['set-cookie'][0];
  });

  describe('GET /api/teams', () => {
    it('should list teams with member, project and active incident counts', async () => {
      const res = await request(app).get('/api/teams').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const team of res.body.data) {
        expect(team._count.members).toBe(team.members.length);
        expect(typeof team._count.projects).toBe('number');
        expect(typeof team._count.incidents).toBe('number');
      }
    });

    it('should count only active incidents for each team', async () => {
      const teams = await request(app).get('/api/teams').set('Cookie', sessionCookie);
      const incidents = await request(app)
        .get('/api/incidents?pageSize=100')
        .set('Cookie', sessionCookie);

      for (const team of teams.body.data) {
        const expected = incidents.body.data.filter(
          (i: any) =>
            i.teamId === team.id && i.status !== 'resolved' && i.status !== 'postmortem'
        ).length;
        expect(team._count.incidents).toBe(expected);
      }
    });

    it('should return a single team and 404 for an unknown one', async () => {
      const list = await request(app).get('/api/teams').set('Cookie', sessionCookie);
      const target = list.body.data[0];

      const found = await request(app).get(`/api/teams/${target.id}`).set('Cookie', sessionCookie);
      expect(found.status).toBe(200);
      expect(found.body.data.id).toBe(target.id);

      const missing = await request(app)
        .get('/api/teams/00000000-0000-0000-0000-000000000000')
        .set('Cookie', sessionCookie);
      expect(missing.status).toBe(404);
    });
  });

  describe('GET /api/services', () => {
    it('should list services with their project and open incident count', async () => {
      const res = await request(app).get('/api/services').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const service of res.body.data) {
        expect(typeof service._count.incidents).toBe('number');
        expect(Number.isNaN(Number(service.uptime))).toBe(false);
      }
    });

    it('should count only open incidents for each service', async () => {
      const services = await request(app).get('/api/services').set('Cookie', sessionCookie);
      const incidents = await request(app)
        .get('/api/incidents?pageSize=100')
        .set('Cookie', sessionCookie);

      for (const service of services.body.data) {
        const expected = incidents.body.data.filter(
          (i: any) =>
            i.services.some((s: any) => s.id === service.id) &&
            i.status !== 'resolved' &&
            i.status !== 'postmortem'
        ).length;
        expect(service._count.incidents).toBe(expected);
      }
    });

    it('should return a single service and 404 for an unknown one', async () => {
      const list = await request(app).get('/api/services').set('Cookie', sessionCookie);
      const target = list.body.data[0];

      const found = await request(app)
        .get(`/api/services/${target.id}`)
        .set('Cookie', sessionCookie);
      expect(found.status).toBe(200);
      expect(found.body.data.id).toBe(target.id);

      const missing = await request(app)
        .get('/api/services/00000000-0000-0000-0000-000000000000')
        .set('Cookie', sessionCookie);
      expect(missing.status).toBe(404);
    });
  });
});
