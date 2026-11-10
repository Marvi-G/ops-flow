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

describe('Service write path', () => {
  let admin: string;
  let member: string;
  let viewer: string;
  let serviceId: string;
  let projectId: string;
  const name = `Write test service ${Date.now()}`;

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.headers['set-cookie'][0] as string;
  };

  beforeAll(async () => {
    admin = await login('admin@northstarlabs.io', 'admin');
    member = await login('alex@northstarlabs.io', 'password123');
    viewer = await login('david@northstarlabs.io', 'password123');

    const projects = await request(app).get('/api/projects').set('Cookie', admin);
    // A seeded project (it has services), so it can't be one another test file is creating or deleting
    projectId = projects.body.data.find((p: any) => p._count.services > 0).id;
  });

  it('creates a service in a project and returns it ready for the list', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Cookie', admin)
      .send({ name: `  ${name}  `, description: 'Created by a test', projectId, status: 'degraded' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.project.id).toBe(projectId);
    expect(res.body.data._count.incidents).toBe(0);
    serviceId = res.body.data.id;
  });

  it('refuses a second service with the same name', async () => {
    const res = await request(app).post('/api/services').set('Cookie', admin).send({ name });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_NAME');
  });

  it('refuses a project that is not in the organization', async () => {
    const unknown = '11111111-1111-4111-8111-111111111111';
    const create = await request(app).post('/api/services').set('Cookie', admin).send({ name: `${name} x`, projectId: unknown });
    const update = await request(app).patch(`/api/services/${serviceId}`).set('Cookie', admin).send({ projectId: unknown });

    expect(create.status).toBe(422);
    expect(create.body.error.details.projectId).toBeDefined();
    expect(update.status).toBe(422);
  });

  it('updates the status and can move the service out of its project', async () => {
    const res = await request(app)
      .patch(`/api/services/${serviceId}`)
      .set('Cookie', admin)
      .send({ name, status: 'operational', projectId: null });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('operational');
    expect(res.body.data.project).toBeNull();
  });

  it('lets a member manage services, but not a viewer', async () => {
    const edit = await request(app).patch(`/api/services/${serviceId}`).set('Cookie', member).send({ description: 'By a member' });
    const create = await request(app).post('/api/services').set('Cookie', viewer).send({ name: 'nope' });
    const update = await request(app).patch(`/api/services/${serviceId}`).set('Cookie', viewer).send({ status: 'unknown' });
    const remove = await request(app).delete(`/api/services/${serviceId}`).set('Cookie', viewer);

    expect(edit.status).toBe(200);
    expect([create.status, update.status, remove.status]).toEqual([403, 403, 403]);
  });

  it('refuses to delete a service that incidents are linked to', async () => {
    const list = await request(app).get('/api/services').set('Cookie', admin);
    let linked: any;
    for (const svc of list.body.data) {
      const detail = await request(app).get(`/api/services/${svc.id}`).set('Cookie', admin);
      if (detail.body.data.incidents.length > 0) {
        linked = svc;
        break;
      }
    }

    const res = await request(app).delete(`/api/services/${linked.id}`).set('Cookie', admin);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SERVICE_HAS_INCIDENTS');
    const still = await request(app).get(`/api/services/${linked.id}`).set('Cookie', admin);
    expect(still.status).toBe(200);
  });

  it('deletes a service nothing refers to', async () => {
    const res = await request(app).delete(`/api/services/${serviceId}`).set('Cookie', admin);
    const again = await request(app).get(`/api/services/${serviceId}`).set('Cookie', admin);

    expect(res.status).toBe(204);
    expect(again.status).toBe(404);
  });
});

describe('Team write path', () => {
  let admin: string;
  let member: string;
  let viewer: string;
  let teamId: string;
  let userId: string;
  const name = `Write test team ${Date.now()}`;

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.headers['set-cookie'][0] as string;
  };

  beforeAll(async () => {
    admin = await login('admin@northstarlabs.io', 'admin');
    member = await login('alex@northstarlabs.io', 'password123');
    viewer = await login('david@northstarlabs.io', 'password123');

    const users = await request(app).get('/api/users').set('Cookie', admin);
    userId = users.body.data[0].id;
  });

  it('creates a team and returns it with counts and members, ready for the list', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Cookie', admin)
      .send({ name: `  ${name}  `, description: 'Created by a test' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data._count).toEqual({ members: 0, projects: 0, incidents: 0 });
    expect(res.body.data.members).toEqual([]);
    teamId = res.body.data.id;
  });

  it('refuses a second team with the same name, ignoring upper and lower case', async () => {
    const res = await request(app).post('/api/teams').set('Cookie', admin).send({ name: name.toUpperCase() });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_NAME');
  });

  it('refuses renaming a team to another team\'s name', async () => {
    const teams = await request(app).get('/api/teams').set('Cookie', admin);
    const other = teams.body.data.find((t: any) => t.id !== teamId && !t.name.startsWith('Write test'));

    const res = await request(app).patch(`/api/teams/${teamId}`).set('Cookie', admin).send({ name: other.name });

    expect(res.status).toBe(409);
  });

  it('updates the on-call status and description', async () => {
    const res = await request(app)
      .patch(`/api/teams/${teamId}`)
      .set('Cookie', admin)
      .send({ name, onCallStatus: 'active', description: 'Changed' });

    expect(res.status).toBe(200);
    expect(res.body.data.onCallStatus).toBe('active');
    expect(res.body.data.description).toBe('Changed');
  });

  it('adds a member of the organization and returns the updated team', async () => {
    const res = await request(app).post(`/api/teams/${teamId}/members`).set('Cookie', admin).send({ userId });

    expect(res.status).toBe(201);
    expect(res.body.data._count.members).toBe(1);
    expect(res.body.data.members[0].user.id).toBe(userId);
    expect(res.body.data.members[0].role).toBe('member');
  });

  it('refuses adding the same person twice', async () => {
    const res = await request(app).post(`/api/teams/${teamId}/members`).set('Cookie', admin).send({ userId });

    expect(res.status).toBe(409);
  });

  it('refuses someone who is not a member of the organization', async () => {
    const stranger = '11111111-1111-4111-8111-111111111111';
    const res = await request(app).post(`/api/teams/${teamId}/members`).set('Cookie', admin).send({ userId: stranger });

    expect(res.status).toBe(422);
    expect(res.body.error.details.userId).toBeDefined();
  });

  it('makes a member the team lead, and rejects an unknown role', async () => {
    const lead = await request(app).patch(`/api/teams/${teamId}/members/${userId}`).set('Cookie', admin).send({ role: 'lead' });
    const bad = await request(app).patch(`/api/teams/${teamId}/members/${userId}`).set('Cookie', admin).send({ role: 'boss' });

    expect(lead.status).toBe(200);
    expect(lead.body.data.members[0].role).toBe('lead');
    expect(bad.status).toBe(422);
  });

  it('only lets admins and owners manage teams', async () => {
    const memberCreate = await request(app).post('/api/teams').set('Cookie', member).send({ name: 'nope' });
    const memberEdit = await request(app).patch(`/api/teams/${teamId}`).set('Cookie', member).send({ description: 'x' });
    const viewerAdd = await request(app).post(`/api/teams/${teamId}/members`).set('Cookie', viewer).send({ userId });
    const viewerDelete = await request(app).delete(`/api/teams/${teamId}`).set('Cookie', viewer);

    expect([memberCreate.status, memberEdit.status, viewerAdd.status, viewerDelete.status]).toEqual([403, 403, 403, 403]);
  });

  it('removes a member', async () => {
    const res = await request(app).delete(`/api/teams/${teamId}/members/${userId}`).set('Cookie', admin);
    const again = await request(app).delete(`/api/teams/${teamId}/members/${userId}`).set('Cookie', admin);
    const team = await request(app).get(`/api/teams/${teamId}`).set('Cookie', admin);

    expect(res.status).toBe(204);
    expect(again.status).toBe(404);
    expect(team.body.data._count.members).toBe(0);
  });

  it('refuses to delete a team that owns projects or has been on incidents', async () => {
    const teams = await request(app).get('/api/teams').set('Cookie', admin);
    const busy = teams.body.data.find((t: any) => t._count.projects > 0);

    const res = await request(app).delete(`/api/teams/${busy.id}`).set('Cookie', admin);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TEAM_HAS_PROJECTS');
    const still = await request(app).get(`/api/teams/${busy.id}`).set('Cookie', admin);
    expect(still.status).toBe(200);
  });

  it('deletes an empty team', async () => {
    const res = await request(app).delete(`/api/teams/${teamId}`).set('Cookie', admin);
    const again = await request(app).get(`/api/teams/${teamId}`).set('Cookie', admin);

    expect(res.status).toBe(204);
    expect(again.status).toBe(404);
  });
});
