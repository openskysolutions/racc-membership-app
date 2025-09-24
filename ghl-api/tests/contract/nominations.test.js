import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../dist/app.js';

describe('POST /nominations', () => {
  it('should submit a nomination', async () => {
    const response = await request(app)
      .post('/api/nominations')
      .send({
        nomineeName: 'Test Business',
        nomineeContact: 'test@example.com',
        notes: 'Great local business'
      });

    // Test should fail until implementation exists
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('status', 'pending');
  });

  it('should return 400 for missing nomineeName', async () => {
    const response = await request(app)
      .post('/api/nominations')
      .send({
        nomineeContact: 'test@example.com'
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing nomineeContact', async () => {
    const response = await request(app)
      .post('/api/nominations')
      .send({
        nomineeName: 'Test Business'
      });

    expect(response.status).toBe(400);
  });
});
