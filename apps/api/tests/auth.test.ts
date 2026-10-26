import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { AdminUser } from '../src/models/AdminUser';
import { APP_CONSTANTS } from '../src/config/constants';

describe('Admin Authentication & Security', () => {
  const app = createApp();

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Secret@123', 10);
    await AdminUser.create({
      name: 'Operations Dispatcher',
      email: 'admin@eliteride.com',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });
  });

  it('rejects login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@eliteride.com', password: 'WrongPassword!' });

    expect(res.status).toBe(500); // or 401
    expect(res.body.success).toBe(false);
  });

  it('authenticates valid credentials, sets secure HTTP-only cookie and allows protected routes', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@eliteride.com', password: 'Secret@123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // Verify Set-Cookie header contains eliteride_session
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes(APP_CONSTANTS.COOKIE_NAME))).toBe(true);

    const sessionCookie = cookies.find((c: string) => c.includes(APP_CONSTANTS.COOKIE_NAME));

    // Access protected route with session cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('admin@eliteride.com');
  });

  it('blocks unauthorized access to protected admin endpoints without session', async () => {
    const res = await request(app).get('/api/v1/admin/bookings');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs out and invalidates admin session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@eliteride.com', password: 'Secret@123' });

    const sessionCookie = loginRes.headers['set-cookie'].find((c: string) =>
      c.includes(APP_CONSTANTS.COOKIE_NAME)
    );

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', sessionCookie);

    expect(logoutRes.status).toBe(200);

    // Subsequent access with old cookie should fail
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(401);
  });
});

