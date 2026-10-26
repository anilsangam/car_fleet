import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { createApp } from '../src/app';
import { Car } from '../src/models/Car';
import { AdminUser } from '../src/models/AdminUser';
import bcrypt from 'bcryptjs';
import { APP_CONSTANTS } from '../src/config/constants';

describe('Admin Car Creation & Validation Suite', () => {
  const app = createApp();
  let adminSessionCookie: string;

  beforeEach(async () => {
    await Car.deleteMany({});
    await AdminUser.deleteMany({});

    // Create admin user & login to get admin cookie
    const passwordHash = await bcrypt.hash('AdminPassword123', 10);
    await AdminUser.create({
      name: 'Super Admin',
      email: 'admin.test@eliteride.com',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.test@eliteride.com', password: 'AdminPassword123' });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];
    adminSessionCookie = cookies.find((c: string) => c.includes(APP_CONSTANTS.COOKIE_NAME));
    expect(adminSessionCookie).toBeDefined();
  });

  it('successfully creates a new vehicle when all fields including model are provided', async () => {
    const validCar = {
      name: 'Toyota Camry Hybrid',
      brand: 'Toyota',
      model: 'Camry',
      category: 'sedan',
      registrationNumber: 'DL01-AB-1234',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'automatic',
      fuelType: 'hybrid',
      primaryImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
      description: 'Ultra luxurious hybrid sedan with plush ride comfort and silent engine.',
      baseRatePerKm: 16,
      baseRatePerHour: 280,
      fixedRatePerDay: 3200,
      year: 2024,
      color: 'Pearl White',
      amenities: ['ac', 'water_bottle', 'charger', 'bluetooth'],
    };

    const res = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(validCar);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Toyota Camry Hybrid');
    expect(res.body.data.model).toBe('Camry');
    expect(res.body.data.registrationNumber).toBe('DL01-AB-1234');
  });

  it('rejects vehicle creation and returns precise field error when model is missing', async () => {
    const carMissingModel = {
      name: 'Toyota Camry Hybrid',
      brand: 'Toyota',
      // model missing!
      category: 'sedan',
      registrationNumber: 'DL01-AB-5678',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'automatic',
      fuelType: 'hybrid',
      primaryImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
      description: 'Ultra luxurious hybrid sedan with plush ride comfort and silent engine.',
      baseRatePerKm: 16,
      baseRatePerHour: 280,
      fixedRatePerDay: 3200,
    };

    const res = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(carMissingModel);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.model).toBe('Model is required');
  });

  it('rejects invalid numeric fields like negative rates or seating < 1', async () => {
    const invalidNumbersCar = {
      name: 'Honda City',
      brand: 'Honda',
      model: 'City',
      category: 'sedan',
      registrationNumber: 'DL01-CD-9999',
      seatingCapacity: 0, // Seating capacity cannot be 0
      luggageCapacity: -2, // Cannot be negative
      transmission: 'manual',
      fuelType: 'petrol',
      primaryImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      description: 'Comfortable executive sedan for city travel.',
      baseRatePerKm: -10, // Negative rate
      baseRatePerHour: -50,
      fixedRatePerDay: -500,
    };

    const res = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(invalidNumbersCar);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.seatingCapacity).toBeDefined();
    expect(res.body.errors.baseRatePerKm).toBeDefined();
  });

  it('returns 409 conflict with field-level error when registrationNumber is duplicate', async () => {
    const car1 = {
      name: 'Hyundai Verna',
      brand: 'Hyundai',
      model: 'Verna',
      category: 'sedan',
      registrationNumber: 'DL01-HV-1000',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'automatic',
      fuelType: 'petrol',
      primaryImage: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982',
      description: 'Executive sedan with heated front seats and generous boot space.',
      baseRatePerKm: 15,
      baseRatePerHour: 250,
      fixedRatePerDay: 2800,
    };

    // First car succeeds
    const res1 = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(car1);
    expect(res1.status).toBe(201);

    // Second car with same registration number
    const duplicateCar = {
      ...car1,
      name: 'Another Verna',
    };

    const res2 = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(duplicateCar);

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.errors.registrationNumber).toBe('This registration number is already in use.');
  });

  it('rejects invalid image URL format', async () => {
    const invalidImageCar = {
      name: 'Maruti Ciaz',
      brand: 'Maruti',
      model: 'Ciaz',
      category: 'sedan',
      registrationNumber: 'DL01-MZ-2000',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'manual',
      fuelType: 'petrol',
      primaryImage: 'not-a-valid-url',
      description: 'Comfortable family sedan with great fuel efficiency.',
      baseRatePerKm: 14,
      baseRatePerHour: 220,
      fixedRatePerDay: 2500,
    };

    const res = await request(app)
      .post('/api/v1/admin/cars')
      .set('Cookie', adminSessionCookie)
      .send(invalidImageCar);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.primaryImage).toBeDefined();
  });
});
