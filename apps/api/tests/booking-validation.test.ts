import { describe, it, expect } from 'vitest';
import { bookingCreateSchema, fareEstimateSchema, statusLookupSchema } from '@car-rental/shared';

describe('Zod Validation Schemas', () => {
  it('validates a correct one-way booking payload', () => {
    const valid = {
      tripType: 'one_way',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      pickupLocation: 'Terminal 3, New Delhi',
      destinationLocation: 'Agra City Center',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
      passengerCount: 2,
      carId: '507f1f77bcf86cd799439011',
      termsAccepted: true,
    };

    const res = bookingCreateSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects round trip booking if returnDateTime is missing', () => {
    const missingReturn = {
      tripType: 'round_trip',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      pickupLocation: 'Delhi',
      destinationLocation: 'Jaipur',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
      // returnDateTime missing
      passengerCount: 2,
      carId: '507f1f77bcf86cd799439011',
      termsAccepted: true,
    };

    const res = bookingCreateSchema.safeParse(missingReturn);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors.some((e) => e.path.includes('returnDateTime'))).toBe(true);
    }
  });

  it('rejects hourly rental if durationHours is missing', () => {
    const missingHours = {
      tripType: 'hourly',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      pickupLocation: 'Delhi Connaught Place',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
      // durationHours missing
      passengerCount: 1,
      carId: '507f1f77bcf86cd799439011',
      termsAccepted: true,
    };

    const res = bookingCreateSchema.safeParse(missingHours);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors.some((e) => e.path.includes('durationHours'))).toBe(true);
    }
  });

  it('rejects submission if termsAccepted is false', () => {
    const unaccepted = {
      tripType: 'one_way',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      pickupLocation: 'Delhi',
      destinationLocation: 'Jaipur',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
      passengerCount: 2,
      carId: '507f1f77bcf86cd799439011',
      termsAccepted: false,
    };

    const res = bookingCreateSchema.safeParse(unaccepted);
    expect(res.success).toBe(false);
  });

  it('rejects short or invalid phone numbers', () => {
    const invalidPhone = {
      bookingReference: 'CR-202610-1234',
      phone: '123', // less than 10 digits
    };

    const res = statusLookupSchema.safeParse(invalidPhone);
    expect(res.success).toBe(false);
  });
});

