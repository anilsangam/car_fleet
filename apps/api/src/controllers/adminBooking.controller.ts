import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { BookingStatusHistory } from '../models/BookingStatusHistory';
import { PaymentRecord } from '../models/PaymentRecord';
import { BookingService } from '../services/booking.service';

export class AdminBookingController {
  public static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {};

      if (req.query.status && req.query.status !== 'all') {
        query.status = req.query.status;
      }
      if (req.query.tripType && req.query.tripType !== 'all') {
        query.tripType = req.query.tripType;
      }
      if (req.query.carId) {
        query.carId = req.query.carId;
      }
      if (req.query.driverId) {
        query.driverId = req.query.driverId;
      }
      if (req.query.dateFrom || req.query.dateTo) {
        query.pickupDateTime = {};
        if (req.query.dateFrom) query.pickupDateTime.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) query.pickupDateTime.$lte = new Date(req.query.dateTo as string);
      }
      if (req.query.search) {
        const searchRegex = new RegExp((req.query.search as string).trim(), 'i');
        query.$or = [
          { bookingReference: searchRegex },
          { customerName: searchRegex },
          { customerPhone: searchRegex },
          { pickupLocation: searchRegex },
          { destinationLocation: searchRegex },
        ];
      }

      const [bookings, total] = await Promise.all([
        Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Booking.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBookingDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      const [history, payments] = await Promise.all([
        BookingStatusHistory.find({ bookingId: booking._id }).sort({ createdAt: 1 }),
        PaymentRecord.find({ bookingId: booking._id }).sort({ collectedAt: -1 }),
      ]);

      res.json({
        success: true,
        data: {
          booking,
          history,
          payments,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async acceptBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BookingService.acceptBooking(req.params.id, req.adminUser!);
      res.json({
        success: true,
        data: updated,
        message: 'Booking request confirmed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async assignResources(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BookingService.assignCarAndDriver(
        req.params.id,
        req.body,
        req.adminUser!
      );
      res.json({
        success: true,
        data: updated,
        message: 'Vehicle and driver assigned successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes, reason } = req.body;
      const updated = await BookingService.updateBookingStatus(
        req.params.id,
        status,
        reason,
        notes,
        req.adminUser!
      );
      res.json({
        success: true,
        data: updated,
        message: `Booking status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async recordCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BookingService.recordCashPayment(
        req.params.id,
        req.body,
        req.adminUser!
      );
      res.json({
        success: true,
        data: updated,
        message: 'Cash payment record saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

