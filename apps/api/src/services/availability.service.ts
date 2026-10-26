import { TripType } from '@car-rental/shared';
import { Booking } from '../models/Booking';
import { Car, ICarDocument } from '../models/Car';
import { Driver } from '../models/Driver';
import { BusinessSettings } from '../models/BusinessSettings';

export interface ServiceIntervalCalculation {
  start: Date;
  end: Date;
  bufferMinutes: number;
}

export class AvailabilityService {
  /**
   * Computes the exact operational service interval including turnaround buffers
   */
  public static async calculateServiceInterval(params: {
    tripType: TripType;
    pickupDateTime: string | Date;
    returnDateTime?: string | Date;
    durationHours?: number;
    estimatedTripDurationHours?: number;
  }): Promise<ServiceIntervalCalculation> {
    const settings = await BusinessSettings.findOne();
    const bufferMinutes = settings?.bufferMinutesBetweenTrips || 60;

    const start = new Date(params.pickupDateTime);
    let end: Date;

    if (params.tripType === 'round_trip' && params.returnDateTime) {
      end = new Date(new Date(params.returnDateTime).getTime() + bufferMinutes * 60 * 1000);
    } else if (params.tripType === 'hourly' && params.durationHours) {
      const tripMs = params.durationHours * 60 * 60 * 1000;
      end = new Date(start.getTime() + tripMs + bufferMinutes * 60 * 1000);
    } else {
      // One-way trips: default estimated duration 5 hours + buffer if not explicitly passed
      const tripHours = params.estimatedTripDurationHours || 5;
      end = new Date(start.getTime() + tripHours * 60 * 60 * 1000 + bufferMinutes * 60 * 1000);
    }

    if (end <= start) {
      throw new Error('Service interval end time must be after pickup time');
    }

    return { start, end, bufferMinutes };
  }

  /**
   * Checks if a vehicle has any schedule overlaps with confirmed or active trips
   */
  public static async isCarAvailable(
    carId: string,
    intervalStart: Date,
    intervalEnd: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const car = await Car.findById(carId);
    if (!car || !car.isActive || car.status !== 'active') {
      return false;
    }

    const query: Record<string, any> = {
      carId,
      status: { $in: ['confirmed', 'in_progress'] },
      'serviceInterval.start': { $lt: intervalEnd },
      'serviceInterval.end': { $gt: intervalStart },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(query);
    return !conflict;
  }

  /**
   * Checks if an internal driver has any schedule overlaps with confirmed or active trips
   */
  public static async isDriverAvailable(
    driverId: string,
    intervalStart: Date,
    intervalEnd: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const driver = await Driver.findById(driverId);
    if (!driver || driver.status !== 'active') {
      return false;
    }

    const query: Record<string, any> = {
      driverId,
      status: { $in: ['confirmed', 'in_progress'] },
      'serviceInterval.start': { $lt: intervalEnd },
      'serviceInterval.end': { $gt: intervalStart },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(query);
    return !conflict;
  }

  /**
   * Returns list of vehicles that are available for the requested service interval and category/passengers
   */
  public static async getAvailableCars(filters: {
    tripType?: TripType;
    pickupDateTime?: string | Date;
    returnDateTime?: string | Date;
    durationHours?: number;
    category?: string;
    passengers?: number;
  }): Promise<ICarDocument[]> {
    const carQuery: Record<string, any> = {
      isActive: true,
      status: 'active',
    };

    if (filters.category) {
      carQuery.category = filters.category;
    }

    if (filters.passengers) {
      carQuery.seatingCapacity = { $gte: Number(filters.passengers) };
    }

    const allMatchingCars = await Car.find(carQuery).sort({ baseRatePerKm: 1 });

    if (!filters.pickupDateTime) {
      return allMatchingCars;
    }

    const interval = await this.calculateServiceInterval({
      tripType: filters.tripType || 'one_way',
      pickupDateTime: filters.pickupDateTime,
      returnDateTime: filters.returnDateTime,
      durationHours: filters.durationHours,
    });

    // Find conflicting car IDs
    const conflicts = await Booking.find({
      status: { $in: ['confirmed', 'in_progress'] },
      'serviceInterval.start': { $lt: interval.end },
      'serviceInterval.end': { $gt: interval.start },
    }).select('carId');

    const conflictingCarIds = new Set(conflicts.map((b) => b.carId.toString()));

    return allMatchingCars.filter((car) => !conflictingCarIds.has(car._id.toString()));
  }
}

