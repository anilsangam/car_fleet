import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import { Car } from '../src/models/Car';
import { Driver } from '../src/models/Driver';
import { PaymentRecord } from '../src/models/PaymentRecord';
import { BookingStatusHistory } from '../src/models/BookingStatusHistory';
import { BusinessSettings } from '../src/models/BusinessSettings';
import { BookingService } from '../src/services/booking.service';

describe('Booking Lifecycle, Status Transitions & Cash Collection', () => {
  let car: any;
  let driver: any;
  const adminActor = { id: 'admin1', email: 'dispatch@eliteride.com', name: 'Lead Dispatcher' };

  beforeEach(async () => {
    await BusinessSettings.create({
      businessName: 'EliteRide Car Fleet',
      bufferMinutesBetweenTrips: 60,
    });

    car = await Car.create({
      name: 'Toyota Camry Hybrid',
      brand: 'Toyota',
      model: 'Camry',
      category: 'luxury',
      registrationNumber: 'DL01-CA-1234',
      seatingCapacity: 4,
      luggageCapacity: 3,
      transmission: 'automatic',
      fuelType: 'hybrid',
      primaryImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
      description: 'Luxury Sedan',
      baseRatePerKm: 22,
      baseRatePerHour: 450,
      fixedRatePerDay: 4500,
      status: 'active',
      isActive: true,
    });

    driver = await Driver.create({
      name: 'Vikram Singh',
      phone: '+91 98222 33445',
      licenseNumber: 'DL-072015009122',
      experienceYears: 8,
      status: 'active',
    });
  });

  it('progresses through valid status lifecycle: pending -> confirmed -> in_progress -> completed', async () => {
    const { booking } = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: new Date('2026-11-25T10:00:00.000Z').toISOString(),
      pickupLocation: 'Delhi Airport',
      customerName: 'Sanjay Gupta',
      customerPhone: '9899999999',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    expect(booking.status).toBe('pending');

    // 1. Confirm
    const confirmed = await BookingService.acceptBooking(booking._id.toString(), adminActor);
    expect(confirmed.status).toBe('confirmed');

    // 2. Start Trip -> in_progress
    const inProgress = await BookingService.updateBookingStatus(
      booking._id.toString(),
      'in_progress',
      'Chauffeur arrived at pickup point',
      undefined,
      adminActor
    );
    expect(inProgress.status).toBe('in_progress');

    // 3. Complete Trip
    const completed = await BookingService.updateBookingStatus(
      booking._id.toString(),
      'completed',
      'Trip ended safely, passenger dropped',
      undefined,
      adminActor
    );
    expect(completed.status).toBe('completed');

    // Verify audit trail history
    const history = await BookingStatusHistory.find({ bookingId: booking._id });
    expect(history.length).toBeGreaterThanOrEqual(4);
  });

  it('blocks invalid or illegal status transitions', async () => {
    const { booking } = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 3,
      pickupDateTime: new Date('2026-11-25T14:00:00.000Z').toISOString(),
      pickupLocation: 'Delhi',
      customerName: 'Test Illegal',
      customerPhone: '9888888881',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    // Attempting to jump directly from 'pending' to 'completed' must be rejected
    await expect(
      BookingService.updateBookingStatus(
        booking._id.toString(),
        'completed',
        undefined,
        undefined,
        adminActor
      )
    ).rejects.toThrow(/invalid status transition/i);
  });

  it('records cash collection accurately and logs payment receipt', async () => {
    const { booking } = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: new Date('2026-11-26T10:00:00.000Z').toISOString(),
      pickupLocation: 'Aerocity Delhi',
      customerName: 'Neha Verma',
      customerPhone: '9812345678',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    // Record cash payment
    const updated = await BookingService.recordCashPayment(
      booking._id.toString(),
      {
        finalFare: 2400,
        amountCollected: 2400,
        paymentStatus: 'collected',
        notes: 'Cash handed to Driver Vikram Singh at Aerocity',
      },
      adminActor
    );

    expect(updated.finalFare).toBe(2400);
    expect(updated.amountCollected).toBe(2400);
    expect(updated.paymentStatus).toBe('collected');

    // Verify PaymentRecord collection
    const receipt = await PaymentRecord.findOne({ bookingId: booking._id });
    expect(receipt).toBeDefined();
    expect(receipt?.amount).toBe(2400);
    expect(receipt?.paymentMode).toBe('cash');
  });

  it('secures customer booking status lookup and only discloses chauffeur details when authorized', async () => {
    const { booking, otpCode } = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: new Date('2026-11-27T10:00:00.000Z').toISOString(),
      pickupLocation: 'Aerocity Delhi',
      customerName: 'Rohit Mehra',
      customerPhone: '9876543210',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    await BookingService.acceptBooking(booking._id.toString(), adminActor);
    await BookingService.assignCarAndDriver(
      booking._id.toString(),
      { carId: car._id.toString(), driverId: driver._id.toString(), discloseDriverToCustomer: false },
      adminActor
    );

    // Initial lookup with phone: driver details MUST be hidden
    const initialLookup = await BookingService.lookupStatus(
      booking.bookingReference,
      '9876543210'
    );
    expect(initialLookup.booking.bookingReference).toBe(booking.bookingReference);
    expect(initialLookup.booking.driverDetails).toBeUndefined();

    // Now admin enables driver disclosure
    await BookingService.assignCarAndDriver(
      booking._id.toString(),
      { carId: car._id.toString(), driverId: driver._id.toString(), discloseDriverToCustomer: true },
      adminActor
    );

    // With OTP verified and disclosure enabled, driver details are safely revealed
    const disclosedLookup = await BookingService.lookupStatus(
      booking.bookingReference,
      '9876543210',
      otpCode
    );
    expect(disclosedLookup.isOtpVerified).toBe(true);
    expect(disclosedLookup.booking.driverDetails?.name).toBe('Vikram Singh');
  });
});

