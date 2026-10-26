import { FareBreakdown, TripType } from '@car-rental/shared';
import { Car, ICarDocument } from '../models/Car';
import { FareRule } from '../models/FareRule';
import { BusinessSettings } from '../models/BusinessSettings';

export interface FareCalculationInput {
  tripType: TripType;
  carId: string;
  pickupLocation: string;
  destinationLocation?: string;
  pickupDateTime: string | Date;
  returnDateTime?: string | Date;
  durationHours?: number;
  estimatedDistanceKm?: number;
}

export class PricingService {
  /**
   * Deterministic fare calculation engine with strict precedence:
   * 1. Fixed route rule (matched by origin & destination)
   * 2. Hourly package rule (for hourly rentals)
   * 3. Per-KM standard pricing with minimum fare threshold
   * 4. Night surcharges & driver allowances
   */
  public static async calculateFare(input: FareCalculationInput): Promise<{
    breakdown: FareBreakdown;
    snapshot: Record<string, any>;
  }> {
    const car = await Car.findById(input.carId);
    if (!car) {
      throw new Error('Vehicle not found for pricing calculation');
    }

    const settings = (await BusinessSettings.findOne()) || {
      currencySymbol: '₹',
      defaultCurrency: 'INR',
    };

    const pickupDate = new Date(input.pickupDateTime);
    const pickupHour = pickupDate.getHours();

    // Check night surcharge: 10 PM (22:00) to 6 AM (06:00)
    const isNightPickup = pickupHour >= 22 || pickupHour < 6;
    let nightSurcharge = isNightPickup ? 300 : 0;
    let driverAllowance = 0;

    let baseFare = 0;
    let distanceKm = input.estimatedDistanceKm || 0;
    let ratePerKm = car.baseRatePerKm;
    let hourlyDuration = input.durationHours || 0;
    let hourlyRate = car.baseRatePerHour;
    let appliedRuleName = 'Default Vehicle Rate';

    // 1. Check for Fixed Route rule if origin & destination provided
    if (input.pickupLocation && input.destinationLocation && input.tripType !== 'hourly') {
      const originLower = input.pickupLocation.toLowerCase().trim();
      const destLower = input.destinationLocation.toLowerCase().trim();

      const fixedRule = await FareRule.findOne({
        tripType: input.tripType,
        carCategory: car.category,
        isActive: true,
        fixedPrice: { $gt: 0 },
      }).sort({ priority: -1 });

      if (fixedRule && fixedRule.fixedPrice) {
        // If route matches origin/destination roughly or matches category rule
        const ruleOrigin = fixedRule.origin?.toLowerCase().trim() || '';
        const ruleDest = fixedRule.destination?.toLowerCase().trim() || '';

        if (
          (ruleOrigin && originLower.includes(ruleOrigin) && destLower.includes(ruleDest)) ||
          (!ruleOrigin && !ruleDest)
        ) {
          baseFare = fixedRule.fixedPrice;
          appliedRuleName = fixedRule.name;
          if (fixedRule.nightSurcharge) nightSurcharge = isNightPickup ? fixedRule.nightSurcharge : 0;
          if (fixedRule.driverAllowancePerDay) driverAllowance = fixedRule.driverAllowancePerDay;
        }
      }
    }

    // 2. Hourly rental pricing
    if (input.tripType === 'hourly') {
      hourlyDuration = Math.max(1, input.durationHours || 4);
      hourlyRate = car.baseRatePerHour;

      // Check if an hourly package rule matches
      const hourlyRule = await FareRule.findOne({
        tripType: 'hourly',
        carCategory: car.category,
        isActive: true,
        'hourlyPackages.0': { $exists: true },
      }).sort({ priority: -1 });

      if (hourlyRule && hourlyRule.hourlyPackages && hourlyRule.hourlyPackages.length > 0) {
        // Find best package for duration
        const matchingPackage = hourlyRule.hourlyPackages.find(
          (pkg) => pkg.hours === hourlyDuration
        );
        if (matchingPackage) {
          baseFare = matchingPackage.rate;
          appliedRuleName = `${hourlyRule.name} (${matchingPackage.hours}h / ${matchingPackage.maxKm}km)`;
        } else {
          baseFare = hourlyDuration * hourlyRate;
          appliedRuleName = `Hourly Standard Rate (${hourlyDuration} hrs @ ₹${hourlyRate}/hr)`;
        }
      } else {
        baseFare = hourlyDuration * hourlyRate;
        appliedRuleName = `Hourly Fleet Base (${hourlyDuration} hrs @ ₹${hourlyRate}/hr)`;
      }
    }

    // 3. One-way or Round Trip standard distance calculation if no fixed route was applied
    if (baseFare === 0) {
      if (input.tripType === 'round_trip') {
        // For round trip: minimum 250km per day or estimated distance * 2
        let days = 1;
        if (input.returnDateTime) {
          const returnDate = new Date(input.returnDateTime);
          const diffMs = returnDate.getTime() - pickupDate.getTime();
          days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
        }
        const minKmPerDay = 250;
        const totalMinKm = days * minKmPerDay;
        distanceKm = Math.max(totalMinKm, distanceKm * 2 || totalMinKm);
        driverAllowance = days * 400; // ₹400/day driver allowance for round trip
        baseFare = distanceKm * ratePerKm;
        appliedRuleName = `Round Trip (${days} Day(s), Min ${totalMinKm} km @ ₹${ratePerKm}/km)`;
      } else {
        // One-way distance pricing: default minimum 80 km if not specified
        distanceKm = Math.max(80, distanceKm || 80);
        baseFare = distanceKm * ratePerKm;
        appliedRuleName = `One-Way Outstation (${distanceKm} km @ ₹${ratePerKm}/km)`;
      }
    }

    const tollTaxesEstimated = input.tripType === 'round_trip' ? 600 : input.tripType === 'one_way' ? 350 : 0;
    const subtotal = Math.round(baseFare + driverAllowance + nightSurcharge);
    const totalFare = Math.round(subtotal + tollTaxesEstimated);

    const breakdown: FareBreakdown = {
      baseFare: Math.round(baseFare),
      distanceKm: distanceKm || undefined,
      ratePerKm: ratePerKm || undefined,
      durationHours: hourlyDuration || undefined,
      hourlyRate: hourlyRate || undefined,
      driverAllowance,
      nightSurcharge,
      tollTaxesEstimated,
      subtotal,
      totalFare,
      currency: 'INR',
      appliedRuleName,
    };

    const snapshot = {
      calculatedAt: new Date().toISOString(),
      car: {
        id: car._id.toString(),
        name: car.name,
        category: car.category,
        baseRatePerKm: car.baseRatePerKm,
        baseRatePerHour: car.baseRatePerHour,
      },
      inputs: {
        tripType: input.tripType,
        pickupLocation: input.pickupLocation,
        destinationLocation: input.destinationLocation,
        pickupDateTime: input.pickupDateTime,
        returnDateTime: input.returnDateTime,
        durationHours: input.durationHours,
      },
      breakdown,
    };

    return { breakdown, snapshot };
  }
}

