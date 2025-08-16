import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { cfg } from '../src/config/env';

describe('Health Check', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    
    // Basic CORS setup for testing
    app.use(cors({
      origin: (origin, cb) => {
        if (!origin || cfg.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true
    }));

    // Health endpoint
    app.get('/api/health', (_req, res) => {
      res.json({ ok: true, ts: new Date().toISOString() });
    });
  });

  test('GET /api/health returns ok status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('ok', true);
    expect(response.body).toHaveProperty('ts');
    expect(new Date(response.body.ts)).toBeInstanceOf(Date);
  });

  test('CORS allows configured origins', async () => {
    await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
  });

  test('CORS blocks unconfigured origins', async () => {
    await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-site.com')
      .expect(500); // CORS error
  });
});
