import { Request, Response, NextFunction } from 'express';
import { Car } from '../models/Car';
import { SettingsService } from '../services/settings.service';
import { AvailabilityService } from '../services/availability.service';
import { PricingService } from '../services/pricing.service';
import { BookingService } from '../services/booking.service';

export class PublicController {
  public static async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json({
        success: true,
        data: {
          businessName: settings.businessName,
          tagline: settings.tagline,
          logoUrl: settings.logoUrl,
          supportPhone: settings.supportPhone,
          supportEmail: settings.supportEmail,
          officeAddress: settings.officeAddress,
          operatingHours: settings.operatingHours,
          serviceAreas: settings.serviceAreas,
          defaultCurrency: settings.defaultCurrency,
          currencySymbol: settings.currencySymbol,
          cancellationPolicyText: settings.cancellationPolicyText,
          termsAndConditionsText: settings.termsAndConditionsText,
          privacyPolicyText: settings.privacyPolicyText,
          cashPaymentInstructions: settings.cashPaymentInstructions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCars(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, transmission, seating, sort, search } = req.query;
      const query: Record<string, any> = { isActive: true, status: 'active' };

      if (search) {
        const s = String(search).trim();
        if (s) {
          query.$or = [
            { name: { $regex: s, $options: 'i' } },
            { brand: { $regex: s, $options: 'i' } },
            { model: { $regex: s, $options: 'i' } },
            { category: { $regex: s, $options: 'i' } },
          ];
        }
      }

      if (category && category !== 'all') {
        query.category = category;
      }
      if (transmission && transmission !== 'all') {
        query.transmission = transmission;
      }
      if (seating) {
        query.seatingCapacity = { $gte: Number(seating) };
      }

      let sortOptions: Record<string, any> = { baseRatePerKm: 1 };
      if (sort === 'price_desc') {
        sortOptions = { baseRatePerKm: -1 };
      } else if (sort === 'seats_desc') {
        sortOptions = { seatingCapacity: -1 };
      }

      const cars = await Car.find(query).sort(sortOptions);
      res.json({ success: true, data: cars });
    } catch (error) {
      next(error);
    }
  }

  public static async getCarDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const car = await Car.findOne({ _id: req.params.id, isActive: true });
      if (!car) {
        return res.status(404).json({ success: false, error: 'Vehicle not found or inactive' });
      }
      res.json({ success: true, data: car });
    } catch (error) {
      next(error);
    }
  }

  public static async getCarAlternatives(req: Request, res: Response, next: NextFunction) {
    try {
      const carId = req.params.id;
      const tripType = req.query.tripType as string;
      const pickupDateTime = req.query.pickupDateTime as string;
      const returnDateTime = req.query.returnDateTime as string;
      const durationHours = req.query.durationHours;
      const passengers = req.query.passengers || req.query.passengerCount;

      const selectedCar = await Car.findOne({ _id: carId, isActive: true });
      if (!selectedCar) {
        return res.status(404).json({ success: false, error: 'Vehicle not found or inactive' });
      }

      let intervalStart: Date | undefined;
      let intervalEnd: Date | undefined;

      if (pickupDateTime) {
        try {
          const interval = await AvailabilityService.calculateServiceInterval({
            tripType: (tripType as any) || 'one_way',
            pickupDateTime: pickupDateTime as string,
            returnDateTime: returnDateTime as string | undefined,
            durationHours: durationHours ? Number(durationHours) : undefined,
          });
          intervalStart = interval.start;
          intervalEnd = interval.end;
        } catch {
          // If interval cannot be parsed, leave undefined
        }
      }

      let isSelectedAvailable = true;
      if (intervalStart && intervalEnd) {
        isSelectedAvailable = await AvailabilityService.isCarAvailable(
          selectedCar._id.toString(),
          intervalStart,
          intervalEnd
        );
      }

      // Query other active cars as alternative candidates
      const candidateQuery: Record<string, any> = {
        _id: { $ne: selectedCar._id },
        isActive: true,
        status: 'active',
      };

      if (passengers) {
        candidateQuery.seatingCapacity = { $gte: Number(passengers) };
      }

      const candidates = await Car.find(candidateQuery);

      // Check availability and compute scoring for candidates
      const scoredAlternatives = await Promise.all(
        candidates.map(async (car) => {
          let isAvailable = true;
          if (intervalStart && intervalEnd) {
            isAvailable = await AvailabilityService.isCarAvailable(
              car._id.toString(),
              intervalStart,
              intervalEnd
            );
          }

          const categoryScore = car.category === selectedCar.category ? 0 : 1;
          const priceDiff = Math.abs(car.baseRatePerKm - selectedCar.baseRatePerKm);

          return {
            car: {
              ...car.toObject(),
              isAvailable,
            },
            isAvailable,
            categoryScore,
            priceDiff,
          };
        })
      );

      // Sort: 1. Available first, 2. Category match, 3. Price proximity
      scoredAlternatives.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        if (a.categoryScore !== b.categoryScore) {
          return a.categoryScore - b.categoryScore;
        }
        return a.priceDiff - b.priceDiff;
      });

      // Take top 3 alternatives
      const topAlternatives = scoredAlternatives.slice(0, 3).map((item) => item.car);

      res.json({
        success: true,
        data: {
          selectedCar: {
            ...selectedCar.toObject(),
            isAvailable: isSelectedAvailable,
          },
          alternatives: topAlternatives,
          allOptions: [
            { ...selectedCar.toObject(), isAvailable: isSelectedAvailable, isOriginalSelection: true },
            ...topAlternatives.map((alt) => ({ ...alt, isOriginalSelection: false })),
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const availableCars = await AvailabilityService.getAvailableCars({
        tripType: req.query.tripType as any,
        pickupDateTime: req.query.pickupDateTime as string,
        returnDateTime: req.query.returnDateTime as string,
        durationHours: req.query.durationHours ? Number(req.query.durationHours) : undefined,
        category: req.query.category as string,
        passengers: req.query.passengers ? Number(req.query.passengers) : undefined,
      });

      res.json({
        success: true,
        data: availableCars,
        count: availableCars.length,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFareEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PricingService.calculateFare(req.body);
      res.json({
        success: true,
        data: result.breakdown,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        ...req.body,
        customerId: req.customer?.id,
        customerName: req.customer?.name || req.body.customerName,
        customerPhone: req.customer?.phone || req.body.customerPhone,
        customerEmail: req.customer?.email || req.body.customerEmail,
      };
      const result = await BookingService.createBooking(payload);
      res.status(201).json({
        success: true,
        data: {
          bookingReference: result.booking.bookingReference,
          booking: result.booking,
          accessToken: result.accessToken,
          otpCode: result.otpCode, // Provided for user confirmation demo
        },
        message: 'Your booking request has been submitted. Our dispatcher will review and confirm availability shortly.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async lookupStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingReference, phone, otpCode } = req.body;
      const result = await BookingService.lookupStatus(bookingReference, phone, otpCode);
      res.json({
        success: true,
        data: result.booking,
        isOtpVerified: result.isOtpVerified,
        otpSentForDemo: result.otpSentForDemo,
      });
    } catch (error) {
      next(error);
    }
  }
}

