import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './setup';
import { createApp } from '../src/app';
import { validateIndianMobileNumber, normalizeIndianPhone } from '@car-rental/shared';

describe('Strict Indian Mobile Number Validation Suite', () => {
  const app = createApp();

  describe('validateIndianMobileNumber helper', () => {
    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () => {
      expect(validateIndianMobileNumber('9876543210').isValid).toBe(true);
      expect(validateIndianMobileNumber('8123456789').isValid).toBe(true);
      expect(validateIndianMobileNumber('7012345678').isValid).toBe(true);
      expect(validateIndianMobileNumber('6912345678').isValid).toBe(true);
    });

    it('rejects incomplete numbers (< 10 digits) with appropriate message', () => {
      const res = validateIndianMobileNumber('987654321');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Enter a 10-digit mobile number.');
    });

    it('rejects numbers exceeding 10 digits', () => {
      const res = validateIndianMobileNumber('98765432101');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Mobile number cannot exceed 10 digits.');
    });

    it('rejects numbers starting with digits other than 6, 7, 8, 9 (e.g. 1-5)', () => {
      const res = validateIndianMobileNumber('1234567890');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(
        'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      );
    });

    it('handles normalization of numbers with +91 or leading zero', () => {
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210');
      expect(normalizeIndianPhone('09876543210')).toBe('9876543210');
      expect(normalizeIndianPhone('98765-43210')).toBe('9876543210');
    });

    it('rejects empty strings or non-numeric strings', () => {
      expect(validateIndianMobileNumber('').isValid).toBe(false);
      expect(validateIndianMobileNumber('ABCDEFGHIJ').isValid).toBe(false);
    });
  });

  describe('Backend Endpoint Enforcement', () => {
    it('rejects customer signup if phone has less than 10 digits', async () => {
      const res = await request(app)
        .post('/api/v1/customer/signup')
        .send({
          name: 'Ankit Gupta',
          phone: '98765432', // only 8 digits
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.phone).toBe('Enter a 10-digit mobile number.');
    });

    it('rejects customer signup if phone starts with 1-5', async () => {
      const res = await request(app)
        .post('/api/v1/customer/signup')
        .send({
          name: 'Ankit Gupta',
          phone: '3876543210', // starts with 3
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.phone).toBe(
        'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      );
    });

    it('rejects status lookup if phone is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/status')
        .send({
          bookingReference: 'CR-202610-1234',
          phone: '1234567890',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.phone).toBeDefined();
    });
  });
});

