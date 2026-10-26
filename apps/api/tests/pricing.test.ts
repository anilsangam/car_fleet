import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import { Car } from '../src/models/Car';
import { FareRule } from '../src/models/FareRule';
import { BusinessSettings } from '../src/models/BusinessSettings';
import { PricingService } from '../src/services/pricing.service';

describe('Pricing Calculation Engine', () => {
  let testCar: any;

  beforeEach(async () => {
    await BusinessSettings.create({
      businessName: 'EliteRide Car Fleet',
      bufferMinutesBetweenTrips: 60,
    });

    testCar = await Car.create({
      name: 'Honda City VTEC',
      brand: 'Honda',
      model: 'City',
      category: 'sedan',
      registrationNumber: 'DL01-TEST-001',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'manual',
      fuelType: 'petrol',
      primaryImage: 'https://images.unsplash.com/photo-1590362891991-f776e747a588',
      description: 'Test vehicle for pricing suite',
      baseRatePerKm: 15,
      baseRatePerHour: 300,
      fixedRatePerDay: 3000,
      status: 'active',
      isActive: true,
    });
  });

  it('calculates standard one-way outstation fare with minimum km threshold', async () => {
    const { breakdown } = await PricingService.calculateFare({
      tripType: 'one_way',
      carId: testCar._id.toString(),
      pickupLocation: 'Delhi Airport',
      destinationLocation: 'Gurugram',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
    });

    expect(breakdown.baseFare).toBeGreaterThanOrEqual(15 * 80); // Min 80km
    expect(breakdown.tollTaxesEstimated).toBe(350);
    expect(breakdown.totalFare).toBe(breakdown.subtotal + breakdown.tollTaxesEstimated);
  });

  it('applies night surcharge when pickup is between 10 PM and 6 AM', async () => {
    const nightPickup = '2026-11-01T23:30:00.000Z'; // 11:30 PM
    const dayPickup = '2026-11-01T14:00:00.000Z'; // 2:00 PM

    const nightResult = await PricingService.calculateFare({
      tripType: 'one_way',
      carId: testCar._id.toString(),
      pickupLocation: 'Delhi',
      destinationLocation: 'Agra',
      pickupDateTime: nightPickup,
    });

    const dayResult = await PricingService.calculateFare({
      tripType: 'one_way',
      carId: testCar._id.toString(),
      pickupLocation: 'Delhi',
      destinationLocation: 'Agra',
      pickupDateTime: dayPickup,
    });

    expect(nightResult.breakdown.nightSurcharge).toBe(300);
    expect(dayResult.breakdown.nightSurcharge).toBe(0);
  });

  it('calculates round-trip fare with minimum 250km/day and driver allowance', async () => {
    const pickupDateTime = '2026-11-01T08:00:00.000Z';
    const returnDateTime = '2026-11-03T20:00:00.000Z'; // 3 days

    const { breakdown } = await PricingService.calculateFare({
      tripType: 'round_trip',
      carId: testCar._id.toString(),
      pickupLocation: 'Delhi',
      destinationLocation: 'Jaipur',
      pickupDateTime,
      returnDateTime,
    });

    expect(breakdown.distanceKm).toBeGreaterThanOrEqual(750); // 3 days * 250 km
    expect(breakdown.driverAllowance).toBe(1200); // 3 days * 400
    expect(breakdown.tollTaxesEstimated).toBe(600);
  });

  it('applies fixed route rule when matching origin and destination are provided', async () => {
    await FareRule.create({
      name: 'Delhi to Agra Express Fixed Deal',
      tripType: 'one_way',
      carCategory: 'sedan',
      origin: 'delhi',
      destination: 'agra',
      fixedPrice: 3800,
      priority: 20,
      isActive: true,
    });

    const { breakdown } = await PricingService.calculateFare({
      tripType: 'one_way',
      carId: testCar._id.toString(),
      pickupLocation: 'New Delhi Connaught Place',
      destinationLocation: 'Taj Mahal, Agra',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
    });

    expect(breakdown.baseFare).toBe(3800);
    expect(breakdown.appliedRuleName).toBe('Delhi to Agra Express Fixed Deal');
  });

  it('ensures pricing snapshot is frozen and immutable when vehicle rates change later', async () => {
    const initialPricing = await PricingService.calculateFare({
      tripType: 'one_way',
      carId: testCar._id.toString(),
      pickupLocation: 'Delhi Airport',
      destinationLocation: 'Alwar',
      pickupDateTime: '2026-11-01T10:00:00.000Z',
    });

    const originalTotal = initialPricing.breakdown.totalFare;

    // Simulate price increase on vehicle in database
    testCar.baseRatePerKm = 50;
    await testCar.save();

    // Snapshot retains the frozen original fare
    expect(initialPricing.snapshot.breakdown.totalFare).toBe(originalTotal);
    expect(initialPricing.snapshot.car.baseRatePerKm).toBe(15);
  });
});

