import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { createApp } from '../src/app';
import { Car } from '../src/models/Car';

describe('Fleet Alternatives API (GET /api/v1/cars/:id/alternatives)', () => {
  const app = createApp();
  let baseCarId: string;

  beforeEach(async () => {
    // Clear cars
    await Car.deleteMany({});

    // Create 6 cars of various categories and pricing
    const cars = await Car.create([
      {
        name: 'Honda City ZX',
        brand: 'Honda',
        model: 'City',
        category: 'sedan',
        registrationNumber: 'DL01AA1111',
        seatingCapacity: 4,
        luggageCapacity: 3,
        transmission: 'automatic',
        fuelType: 'petrol',
        primaryImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
        description: 'Premium Sedan',
        amenities: ['ac', 'bluetooth'],
        baseRatePerKm: 14,
        baseRatePerHour: 220,
        fixedRatePerDay: 2600,
        status: 'active',
        isActive: true,
      },
      {
        name: 'Hyundai Verna SX',
        brand: 'Hyundai',
        model: 'Verna',
        category: 'sedan',
        registrationNumber: 'DL01BB2222',
        seatingCapacity: 4,
        luggageCapacity: 3,
        transmission: 'automatic',
        fuelType: 'petrol',
        primaryImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
        description: 'Sporty Sedan',
        amenities: ['ac', 'bluetooth'],
        baseRatePerKm: 15,
        baseRatePerHour: 230,
        fixedRatePerDay: 2700,
        status: 'active',
        isActive: true,
      },
      {
        name: 'Maruti Ciaz Alpha',
        brand: 'Maruti Suzuki',
        model: 'Ciaz',
        category: 'sedan',
        registrationNumber: 'DL01CC3333',
        seatingCapacity: 4,
        luggageCapacity: 3,
        transmission: 'manual',
        fuelType: 'petrol',
        primaryImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d',
        description: 'Comfortable Sedan',
        amenities: ['ac'],
        baseRatePerKm: 13,
        baseRatePerHour: 210,
        fixedRatePerDay: 2500,
        status: 'active',
        isActive: true,
      },
      {
        name: 'Toyota Innova Crysta',
        brand: 'Toyota',
        model: 'Innova',
        category: 'suv',
        registrationNumber: 'DL01DD4444',
        seatingCapacity: 7,
        luggageCapacity: 4,
        transmission: 'manual',
        fuelType: 'diesel',
        primaryImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
        description: 'Executive MPV / SUV',
        amenities: ['ac', 'captain-seats'],
        baseRatePerKm: 19,
        baseRatePerHour: 320,
        fixedRatePerDay: 3800,
        status: 'active',
        isActive: true,
      },
      {
        name: 'Mahindra XUV700 AX7',
        brand: 'Mahindra',
        model: 'XUV700',
        category: 'suv',
        registrationNumber: 'DL01EE5555',
        seatingCapacity: 6,
        luggageCapacity: 4,
        transmission: 'automatic',
        fuelType: 'diesel',
        primaryImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
        description: 'Luxury SUV',
        amenities: ['ac', 'sunroof', 'adas'],
        baseRatePerKm: 21,
        baseRatePerHour: 350,
        fixedRatePerDay: 4200,
        status: 'active',
        isActive: true,
      },
      {
        name: 'Mercedes-Benz E-Class',
        brand: 'Mercedes-Benz',
        model: 'E-Class',
        category: 'luxury',
        registrationNumber: 'DL01FF6666',
        seatingCapacity: 4,
        luggageCapacity: 3,
        transmission: 'automatic',
        fuelType: 'diesel',
        primaryImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935',
        description: 'Ultra Luxury Chauffeur Sedan',
        amenities: ['ac', 'massage-seats', 'leather'],
        baseRatePerKm: 45,
        baseRatePerHour: 800,
        fixedRatePerDay: 9500,
        status: 'active',
        isActive: true,
      },
    ]);

    baseCarId = cars[0]._id.toString();
  });

  it('returns exactly 4 vehicle options: selected car + 3 ranked alternatives', async () => {
    const res = await request(app).get(`/api/v1/cars/${baseCarId}/alternatives`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.selectedCar).toBeDefined();
    expect(res.body.data.selectedCar._id).toBe(baseCarId);
    expect(res.body.data.allOptions.length).toBe(4);

    // Selected car should be the first item in allOptions
    expect(res.body.data.allOptions[0]._id).toBe(baseCarId);

    // The other 3 alternatives should prioritize same category (sedan: Verna, Ciaz) and closest pricing
    const alternativeIds = res.body.data.alternatives.map((c: any) => c._id);
    expect(alternativeIds.length).toBe(3);
    expect(alternativeIds).not.toContain(baseCarId);
  });

  it('re-ranks alternatives based on passenger count suitability', async () => {
    const res = await request(app)
      .get(`/api/v1/cars/${baseCarId}/alternatives`)
      .query({ passengerCount: 6 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allOptions.length).toBeLessThanOrEqual(4);
    expect(res.body.data.allOptions.length).toBe(3); // base car + 2 available 6+ passenger SUVs

    // When 6 passengers are requested, SUVs with seating >= 6 (Innova & XUV700) should be prioritized
    const alternativeNames = res.body.data.alternatives.map((c: any) => c.name);
    expect(alternativeNames.some((name: string) => name.includes('Innova'))).toBe(true);
    expect(alternativeNames.some((name: string) => name.includes('XUV700'))).toBe(true);
  });

  it('handles search query parameter on /api/v1/cars', async () => {
    const searchRes = await request(app)
      .get('/api/v1/cars')
      .query({ search: 'mercedes' });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].brand).toBe('Mercedes-Benz');
  });
});
