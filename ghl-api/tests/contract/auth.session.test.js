import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../dist/app.js';

describe('POST /auth/session', () => {
  it('should start authorization code with PKCE', async () => {
    const response = await request(app)
      .post('/api/auth/session')
      .send({
        code: 'test_authorization_code',
        code_verifier: 'test_code_verifier'
      });

    // Test should fail until implementation exists
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessionId');
  });

  it('should return 400 for missing code', async () => {
    const response = await request(app)
      .post('/api/auth/session')
      .send({
        code_verifier: 'test_code_verifier'
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing code_verifier', async () => {
    const response = await request(app)
      .post('/api/auth/session')
      .send({
        code: 'test_authorization_code'
      });

    expect(response.status).toBe(400);
  });
});
