import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import { Car } from '../src/models/Car';
import { Driver } from '../src/models/Driver';
import { Booking } from '../src/models/Booking';
import { BusinessSettings } from '../src/models/BusinessSettings';
import { BookingService } from '../src/services/booking.service';
import { AvailabilityService } from '../src/services/availability.service';

describe('Double-Booking Prevention & Concurrency Control', () => {
  let car: any;
  let driver: any;
  const adminActor = { id: 'admin1', email: 'dispatcher@eliteride.com', name: 'Dispatcher 1' };

  beforeEach(async () => {
    await BusinessSettings.create({
      businessName: 'EliteRide Car Fleet',
      bufferMinutesBetweenTrips: 60, // 1 hour buffer
    });

    car = await Car.create({
      name: 'Toyota Fortuner 4x4',
      brand: 'Toyota',
      model: 'Fortuner',
      category: 'suv',
      registrationNumber: 'DL01-TF-9999',
      seatingCapacity: 6,
      luggageCapacity: 4,
      transmission: 'automatic',
      fuelType: 'diesel',
      primaryImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      description: 'SUV for conflict tests',
      baseRatePerKm: 25,
      baseRatePerHour: 500,
      fixedRatePerDay: 5000,
      status: 'active',
      isActive: true,
    });

    driver = await Driver.create({
      name: 'Rajesh Kumar',
      phone: '+91 98111 22334',
      licenseNumber: 'DL-042012008451',
      experienceYears: 10,
      status: 'active',
    });
  });

  it('prevents overlapping bookings from confirming the same vehicle', async () => {
    // Booking 1: 10:00 AM to 02:00 PM (+ 60m buffer = 03:00 PM)
    const pickup1 = new Date('2026-11-10T10:00:00.000Z');
    const b1 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickup1.toISOString(),
      pickupLocation: 'Delhi Airport',
      customerName: 'Customer One',
      customerPhone: '9811111111',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    // Accept Booking 1 -> Confirmed
    await BookingService.acceptBooking(b1.booking._id.toString(), adminActor);

    // Booking 2: 12:00 PM to 04:00 PM (overlaps with Booking 1's interval!)
    const pickup2 = new Date('2026-11-10T12:00:00.000Z');
    const b2 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickup2.toISOString(),
      pickupLocation: 'Connaught Place',
      customerName: 'Customer Two',
      customerPhone: '9822222222',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    // Attempting to accept Booking 2 MUST be rejected with conflict error
    await expect(
      BookingService.acceptBooking(b2.booking._id.toString(), adminActor)
    ).rejects.toThrow(/already committed to another confirmed trip/i);

    // Verify Booking 2 remains pending and vehicle was NOT double-booked
    const refreshedB2 = await Booking.findById(b2.booking._id);
    expect(refreshedB2?.status).toBe('pending');
  });

  it('permits non-overlapping booking after turnaround buffer has elapsed', async () => {
    // Booking 1: 10:00 AM to 02:00 PM (+ 60 min buffer = free after 03:00 PM)
    const pickup1 = new Date('2026-11-10T10:00:00.000Z');
    const b1 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickup1.toISOString(),
      pickupLocation: 'Delhi Airport',
      customerName: 'Customer One',
      customerPhone: '9811111111',
      carId: car._id.toString(),
      termsAccepted: true,
    });
    await BookingService.acceptBooking(b1.booking._id.toString(), adminActor);

    // Booking 3: 03:30 PM to 07:30 PM (after buffer expires at 03:00 PM)
    const pickup3 = new Date('2026-11-10T15:30:00.000Z');
    const b3 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickup3.toISOString(),
      pickupLocation: 'Noida Hub',
      customerName: 'Customer Three',
      customerPhone: '9833333333',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    // Accepting Booking 3 succeeds!
    const acceptedB3 = await BookingService.acceptBooking(b3.booking._id.toString(), adminActor);
    expect(acceptedB3.status).toBe('confirmed');
  });

  it('prevents assigning the same driver to overlapping trips', async () => {
    const pickup1 = new Date('2026-11-12T09:00:00.000Z');
    const b1 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 5,
      pickupDateTime: pickup1.toISOString(),
      pickupLocation: 'Delhi',
      customerName: 'Customer A',
      customerPhone: '9844444444',
      carId: car._id.toString(),
      termsAccepted: true,
    });
    await BookingService.acceptBooking(b1.booking._id.toString(), adminActor);

    // Assign driver to Trip 1
    await BookingService.assignCarAndDriver(
      b1.booking._id.toString(),
      { carId: car._id.toString(), driverId: driver._id.toString() },
      adminActor
    );

    // Create a 2nd car so car isn't the conflict
    const car2 = await Car.create({
      name: 'Mercedes E-Class',
      brand: 'Mercedes',
      model: 'E220',
      category: 'luxury',
      registrationNumber: 'DL01-MB-8888',
      seatingCapacity: 4,
      luggageCapacity: 3,
      transmission: 'automatic',
      fuelType: 'diesel',
      primaryImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738',
      description: '2nd fleet car',
      baseRatePerKm: 40,
      baseRatePerHour: 800,
      fixedRatePerDay: 8000,
      status: 'active',
      isActive: true,
    });

    // Booking 2 on car2 during the same time interval
    const b2 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickup1.toISOString(),
      pickupLocation: 'Delhi',
      customerName: 'Customer B',
      customerPhone: '9855555555',
      carId: car2._id.toString(),
      termsAccepted: true,
    });
    await BookingService.acceptBooking(b2.booking._id.toString(), adminActor);

    // Attempting to assign the same driver to Trip 2 MUST fail!
    await expect(
      BookingService.assignCarAndDriver(
        b2.booking._id.toString(),
        { carId: car2._id.toString(), driverId: driver._id.toString() },
        adminActor
      )
    ).rejects.toThrow(/scheduling conflict/i);
  });

  it('safely handles concurrent acceptance attempts for overlapping trips', async () => {
    const pickupTime = new Date('2026-11-15T10:00:00.000Z').toISOString();

    const [b1, b2] = await Promise.all([
      BookingService.createBooking({
        tripType: 'hourly',
        durationHours: 4,
        pickupDateTime: pickupTime,
        pickupLocation: 'Delhi',
        customerName: 'Simultaneous 1',
        customerPhone: '9866666661',
        carId: car._id.toString(),
        termsAccepted: true,
      }),
      BookingService.createBooking({
        tripType: 'hourly',
        durationHours: 4,
        pickupDateTime: pickupTime,
        pickupLocation: 'Delhi',
        customerName: 'Simultaneous 2',
        customerPhone: '9866666662',
        carId: car._id.toString(),
        termsAccepted: true,
      }),
    ]);

    // Simultaneously trigger acceptance
    const results = await Promise.allSettled([
      BookingService.acceptBooking(b1.booking._id.toString(), adminActor),
      BookingService.acceptBooking(b2.booking._id.toString(), adminActor),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed and one must be rejected to prevent double-booking!
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });

  it('releases schedule reservations upon booking cancellation or rejection', async () => {
    const pickupTime = new Date('2026-11-20T10:00:00.000Z').toISOString();
    const b1 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickupTime,
      pickupLocation: 'Delhi',
      customerName: 'Cancel Test',
      customerPhone: '9877777777',
      carId: car._id.toString(),
      termsAccepted: true,
    });
    await BookingService.acceptBooking(b1.booking._id.toString(), adminActor);

    // Cancel Booking 1
    await BookingService.updateBookingStatus(
      b1.booking._id.toString(),
      'cancelled',
      'Customer requested cancellation',
      undefined,
      adminActor
    );

    // Another booking for the exact same interval can now be accepted safely!
    const b2 = await BookingService.createBooking({
      tripType: 'hourly',
      durationHours: 4,
      pickupDateTime: pickupTime,
      pickupLocation: 'Delhi',
      customerName: 'Replacement Customer',
      customerPhone: '9888888888',
      carId: car._id.toString(),
      termsAccepted: true,
    });

    const acceptedB2 = await BookingService.acceptBooking(b2.booking._id.toString(), adminActor);
    expect(acceptedB2.status).toBe('confirmed');
  });
});

