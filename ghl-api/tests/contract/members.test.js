import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../dist/app.js';

describe('GET /members', () => {
  it('should return member list with search support', async () => {
    const response = await request(app)
      .get('/api/members')
      .query({ search: 'John' });

    // Test should fail until implementation exists
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('members');
    expect(Array.isArray(response.body.members)).toBe(true);
  });

  it('should return member list without search', async () => {
    const response = await request(app)
      .get('/api/members');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('members');
    expect(Array.isArray(response.body.members)).toBe(true);
  });
});

describe('GET /members/:id', () => {
  it('should return member details', async () => {
    const response = await request(app)
      .get('/api/members/123');

    // Test should fail until implementation exists
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', '123');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('membershipTier');
  });

  it('should return 404 for non-existent member', async () => {
    const response = await request(app)
      .get('/api/members/999999');

    expect(response.status).toBe(404);
  });
});
