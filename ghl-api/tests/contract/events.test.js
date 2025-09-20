import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../dist/app.js';

describe('GET /events', () => {
  it('should return events list', async () => {
    const response = await request(app)
      .get('/api/events');

    // Test should fail until implementation exists
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
  });

  it('should support date filtering', async () => {
    const response = await request(app)
      .get('/api/events')
      .query({ 
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
  });
});

describe('POST /events/:id/rsvp', () => {
  it('should create RSVP for event', async () => {
    const response = await request(app)
      .post('/api/events/123/rsvp')
      .send({
        status: 'attending',
        guestCount: 2
      });

    // Test should fail until implementation exists
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'attending');
    expect(response.body).toHaveProperty('guestCount', 2);
  });

  it('should return 400 for invalid RSVP status', async () => {
    const response = await request(app)
      .post('/api/events/123/rsvp')
      .send({
        status: 'invalid-status'
      });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent event', async () => {
    const response = await request(app)
      .post('/api/events/999999/rsvp')
      .send({
        status: 'attending'
      });

    expect(response.status).toBe(404);
  });
});
