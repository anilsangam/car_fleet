import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { createApp } from '../src/app';
import { Customer } from '../src/models/Customer';
import { Car } from '../src/models/Car';
import { Booking } from '../src/models/Booking';
import { APP_CONSTANTS } from '../src/config/constants';

describe('Customer Authentication & Protected Booking Workflows', () => {
  const app = createApp();
  let testCarId: string;

  beforeEach(async () => {
    // Seed an active car
    const car = await Car.create({
      name: 'Honda City ZX',
      brand: 'Honda',
      model: 'City',
      category: 'sedan',
      registrationNumber: 'DL01AB1234',
      seatingCapacity: 4,
      luggageCapacity: 3,
      transmission: 'automatic',
      fuelType: 'petrol',
      primaryImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      description: 'Comfortable executive sedan for city and outstation journeys.',
      amenities: ['ac', 'bluetooth', 'airbags'],
      baseRatePerKm: 14,
      baseRatePerHour: 220,
      fixedRatePerDay: 2600,
      status: 'active',
      isActive: true,
    });
    testCarId = car._id.toString();
  });

  it('rejects signup with password shorter than 8 characters', async () => {
    const signupPayload = {
      name: 'Rohan Sharma',
      phone: '9876543210',
      email: 'rohan.short@example.com',
      password: 'Pass1', // only 5 characters
      confirmPassword: 'Pass1',
      termsAccepted: true,
    };

    const res = await request(app)
      .post('/api/v1/customer/signup')
      .send(signupPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('normalizes Indian phone number with +91 or spaces during signup and login', async () => {
    const signupPayload = {
      name: 'Ananya Sharma',
      phone: '+91 98765 43299',
      email: 'ananya@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      termsAccepted: true,
    };

    const res = await request(app)
      .post('/api/v1/customer/signup')
      .send(signupPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.customer.phone).toBe('9876543299');

    // Customer can log in with normalized 10 digits
    const loginRes = await request(app)
      .post('/api/v1/customer/login')
      .send({ identifier: '9876543299', password: 'Password@123' });

    expect(loginRes.status).toBe(200);
  });

  it('rejects customer signup if phone does not match valid Indian mobile pattern', async () => {
    const invalidPhoneSignup = {
      name: 'Test User',
      phone: '1234567890', // starts with 1, not 6-9
      password: 'ValidPassword123',
      confirmPassword: 'ValidPassword123',
      termsAccepted: true,
    };

    const res = await request(app)
      .post('/api/v1/customer/signup')
      .send(invalidPhoneSignup);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('allows a customer to sign up and sets HTTP-only customer session cookie', async () => {
    const signupPayload = {
      name: 'Rohan Sharma',
      phone: '9876543210',
      email: 'rohan@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      termsAccepted: true,
    };

    const res = await request(app)
      .post('/api/v1/customer/signup')
      .send(signupPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.name).toBe('Rohan Sharma');
    expect(res.body.data.customer.passwordHash).toBeUndefined(); // Verify password hash is never leaked

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes(APP_CONSTANTS.CUSTOMER_COOKIE_NAME))).toBe(true);
  });

  it('rejects duplicate customer registration with same mobile number', async () => {
    const signupPayload = {
      name: 'Rohan Sharma',
      phone: '9876543210',
      email: 'rohan@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      termsAccepted: true,
    };

    await request(app).post('/api/v1/customer/signup').send(signupPayload);

    const duplicateRes = await request(app)
      .post('/api/v1/customer/signup')
      .send(signupPayload);

    expect(duplicateRes.status).toBe(500); // Handled by global errorHandler
    expect(duplicateRes.body.success).toBe(false);
  });

  it('authenticates customer via mobile number or email and returns profile via /customer/me', async () => {
    await request(app).post('/api/v1/customer/signup').send({
      name: 'Priya Verma',
      phone: '9811223344',
      email: 'priya@example.com',
      password: 'SecurePassword1',
      confirmPassword: 'SecurePassword1',
      termsAccepted: true,
    });

    // Login via mobile phone
    const loginRes = await request(app)
      .post('/api/v1/customer/login')
      .send({ identifier: '9811223344', password: 'SecurePassword1' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    const sessionCookie = loginRes.headers['set-cookie'].find((c: string) =>
      c.includes(APP_CONSTANTS.CUSTOMER_COOKIE_NAME)
    );

    // Access /customer/me
    const meRes = await request(app)
      .get('/api/v1/customer/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.customer.name).toBe('Priya Verma');
  });

  it('blocks booking creation without customer authentication (401)', async () => {
    const bookingPayload = {
      tripType: 'one_way',
      customerName: 'Guest User',
      customerPhone: '9123456789',
      pickupLocation: 'Delhi Airport T3',
      destinationLocation: 'Agra City',
      pickupDateTime: '2026-11-10T10:00:00.000Z',
      passengerCount: 2,
      carId: testCarId,
      termsAccepted: true,
    };

    const res = await request(app)
      .post('/api/v1/bookings')
      .send(bookingPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('successfully creates booking when customer is authenticated and associates customerId', async () => {
    const signupRes = await request(app).post('/api/v1/customer/signup').send({
      name: 'Vikram Malhotra',
      phone: '9988776655',
      email: 'vikram@example.com',
      password: 'Password@999',
      confirmPassword: 'Password@999',
      termsAccepted: true,
    });

    const sessionCookie = signupRes.headers['set-cookie'].find((c: string) =>
      c.includes(APP_CONSTANTS.CUSTOMER_COOKIE_NAME)
    );

    const bookingPayload = {
      tripType: 'one_way',
      customerName: 'Vikram Malhotra',
      customerPhone: '9988776655',
      customerEmail: 'vikram@example.com',
      pickupLocation: 'Connaught Place, New Delhi',
      destinationLocation: 'Jaipur Heritage Road',
      pickupDateTime: '2026-11-15T08:00:00.000Z',
      passengerCount: 2,
      carId: testCarId,
      termsAccepted: true,
    };

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', sessionCookie)
      .send(bookingPayload);

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.success).toBe(true);
    expect(bookingRes.body.data.bookingReference).toBeDefined();

    // Verify booking is retrieved in customer's own trips endpoint
    const myBookingsRes = await request(app)
      .get('/api/v1/customer/bookings')
      .set('Cookie', sessionCookie);

    expect(myBookingsRes.status).toBe(200);
    expect(myBookingsRes.body.data.length).toBe(1);
    expect(myBookingsRes.body.data[0].bookingReference).toBe(bookingRes.body.data.bookingReference);
  });
});

