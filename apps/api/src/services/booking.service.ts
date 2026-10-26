import crypto from 'crypto';
import mongoose from 'mongoose';
import { BookingStatus, PaymentStatus } from '@car-rental/shared';
import { Booking, IBookingDocument } from '../models/Booking';
import { Car } from '../models/Car';
import { Driver } from '../models/Driver';
import { Customer } from '../models/Customer';
import { BookingStatusHistory } from '../models/BookingStatusHistory';
import { PaymentRecord } from '../models/PaymentRecord';
import { AdminAuditLog } from '../models/AdminAuditLog';
import { BusinessSettings } from '../models/BusinessSettings';
import { BookingAccessToken } from '../models/BookingAccessToken';
import { PricingService } from './pricing.service';
import { AvailabilityService } from './availability.service';

// In-process resource locking mechanism for concurrency control across simultaneous dispatches
const resourceLocks = new Map<string, Promise<void>>();

async function withResourceLock<T>(resourceKeys: string[], fn: () => Promise<T>): Promise<T> {
  const sortedKeys = [...resourceKeys].filter(Boolean).sort();
  for (const key of sortedKeys) {
    while (resourceLocks.has(key)) {
      await resourceLocks.get(key);
    }
  }

  let resolveLock!: () => void;
  const lockPromise = new Promise<void>((res) => {
    resolveLock = res;
  });

  for (const key of sortedKeys) {
    resourceLocks.set(key, lockPromise);
  }

  try {
    return await fn();
  } finally {
    for (const key of sortedKeys) {
      resourceLocks.delete(key);
    }
    resolveLock();
  }
}

export class BookingService {
  /**
   * Generates a unique, collision-resistant booking reference e.g., CR-202610-A8F2
   */
  public static async generateReference(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    let reference = '';
    let isUnique = false;

    while (!isUnique) {
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      reference = `CR-${yearMonth}-${randomHex}`;
      const existing = await Booking.findOne({ bookingReference: reference });
      if (!existing) {
        isUnique = true;
      }
    }

    return reference;
  }

  /**
   * Create a new booking request from customer submission
   */
  public static async createBooking(data: any): Promise<{
    booking: IBookingDocument;
    accessToken: string;
    otpCode: string;
  }> {
    const car = await Car.findById(data.carId);
    if (!car || !car.isActive) {
      throw new Error('Selected vehicle is currently unavailable or inactive');
    }

    // Calculate verified service interval
    const serviceInterval = await AvailabilityService.calculateServiceInterval({
      tripType: data.tripType,
      pickupDateTime: data.pickupDateTime,
      returnDateTime: data.returnDateTime,
      durationHours: data.durationHours,
    });

    // Recalculate price deterministically on backend
    const { breakdown, snapshot } = await PricingService.calculateFare({
      tripType: data.tripType,
      carId: data.carId,
      pickupLocation: data.pickupLocation,
      destinationLocation: data.destinationLocation,
      pickupDateTime: data.pickupDateTime,
      returnDateTime: data.returnDateTime,
      durationHours: data.durationHours,
    });

    const bookingReference = await this.generateReference();
    const rawAccessToken = crypto.randomBytes(24).toString('hex');
    const accessTokenHash = crypto.createHash('sha256').update(rawAccessToken).digest('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour OTP for demo/ease of testing

    const booking = new Booking({
      bookingReference,
      tripType: data.tripType,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerEmail: data.customerEmail?.trim() || undefined,
      pickupLocation: data.pickupLocation.trim(),
      destinationLocation: data.destinationLocation?.trim() || undefined,
      pickupDateTime: new Date(data.pickupDateTime),
      returnDateTime: data.returnDateTime ? new Date(data.returnDateTime) : undefined,
      durationHours: data.durationHours,
      passengerCount: data.passengerCount || 1,
      specialInstructions: data.specialInstructions?.trim() || undefined,
      customerId: data.customerId || undefined,

      carId: car._id,
      carDetails: {
        name: car.name,
        brand: car.brand,
        model: car.model,
        category: car.category,
        registrationNumber: car.registrationNumber,
        primaryImage: car.primaryImage,
        seatingCapacity: car.seatingCapacity,
      },

      serviceInterval,
      fareBreakdown: breakdown,
      fareSnapshot: snapshot,

      status: 'pending',
      expectedFare: breakdown.totalFare,
      finalFare: breakdown.totalFare,
      amountCollected: 0,
      paymentStatus: 'pending',

      accessTokenHash,
      otpCode,
      otpExpiresAt,
      discloseDriverToCustomer: false,
    });

    await booking.save();

    // Create Status History
    await BookingStatusHistory.create({
      bookingId: booking._id,
      fromStatus: 'pending',
      toStatus: 'pending',
      changedBy: data.customerName,
      actorRole: 'customer',
      reason: 'Booking request placed by customer',
    });

    // Create Booking Access Token Record
    await BookingAccessToken.create({
      bookingId: booking._id,
      tokenHash: accessTokenHash,
      phone: data.customerPhone.trim(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Update Customer record
    if (data.customerId) {
      await Customer.findByIdAndUpdate(data.customerId, {
        $set: {
          name: data.customerName.trim(),
          email: data.customerEmail?.trim() || undefined,
          lastBookingAt: new Date(),
        },
        $inc: { totalBookings: 1 },
      });
    } else {
      await Customer.findOneAndUpdate(
        { phone: data.customerPhone.trim() },
        {
          $set: {
            name: data.customerName.trim(),
            email: data.customerEmail?.trim() || undefined,
            lastBookingAt: new Date(),
          },
          $inc: { totalBookings: 1 },
        },
        { upsert: true, new: true }
      );
    }

    return { booking, accessToken: rawAccessToken, otpCode };
  }

  /**
   * Accepts a pending booking and locks in availability
   */
  public static async acceptBooking(
    bookingId: string,
    adminUser: { id: string; email: string; name: string }
  ): Promise<IBookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot accept booking with status '${booking.status}'`);
    }

    return withResourceLock([`car:${booking.carId}`], async () => {
      // Critical Double-Booking Protection Check inside locked block
      const carAvailable = await AvailabilityService.isCarAvailable(
        booking.carId.toString(),
        booking.serviceInterval.start,
        booking.serviceInterval.end,
        booking._id.toString()
      );

      if (!carAvailable) {
        throw new Error(
          'Selected vehicle is already committed to another confirmed trip during this time interval. Please assign an alternative vehicle.'
        );
      }

      const previousStatus = booking.status;
      booking.status = 'confirmed';
      await booking.save();

      await BookingStatusHistory.create({
        bookingId: booking._id,
        fromStatus: previousStatus,
        toStatus: 'confirmed',
        changedBy: adminUser.email,
        actorRole: 'admin',
        reason: 'Booking request confirmed by dispatcher',
      });

      await AdminAuditLog.create({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'ACCEPT_BOOKING',
        targetType: 'Booking',
        targetId: booking._id.toString(),
        details: { bookingReference: booking.bookingReference },
      });

      return booking;
    });
  }

  /**
   * Assign or reassign car and driver with real-time conflict checking
   */
  public static async assignCarAndDriver(
    bookingId: string,
    data: {
      carId: string;
      driverId?: string;
      discloseDriverToCustomer?: boolean;
      notes?: string;
    },
    adminUser: { id: string; email: string; name: string }
  ): Promise<IBookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      throw new Error(`Cannot assign resources to a ${booking.status} booking`);
    }

    return withResourceLock([`car:${data.carId}`, data.driverId ? `driver:${data.driverId}` : ''], async () => {
      // 1. Check Car Availability
      const car = await Car.findById(data.carId);
      if (!car || !car.isActive || car.status !== 'active') {
        throw new Error('Selected vehicle is inactive or under maintenance');
      }

      const isCarAvail = await AvailabilityService.isCarAvailable(
        data.carId,
        booking.serviceInterval.start,
        booking.serviceInterval.end,
        booking._id.toString()
      );

      if (!isCarAvail) {
        throw new Error(
          `Car ${car.registrationNumber} (${car.name}) has a scheduling conflict during this service interval.`
        );
      }

      booking.carId = car._id as any;
      booking.carDetails = {
        name: car.name,
        brand: car.brand,
        model: car.model,
        category: car.category,
        registrationNumber: car.registrationNumber,
        primaryImage: car.primaryImage,
        seatingCapacity: car.seatingCapacity,
      };

      // 2. Check Driver Availability if assigned
      if (data.driverId) {
        const driver = await Driver.findById(data.driverId);
        if (!driver || driver.status !== 'active') {
          throw new Error('Selected driver is inactive or on leave');
        }

        const isDriverAvail = await AvailabilityService.isDriverAvailable(
          data.driverId,
          booking.serviceInterval.start,
          booking.serviceInterval.end,
          booking._id.toString()
        );

        if (!isDriverAvail) {
          throw new Error(
            `Driver ${driver.name} has a scheduling conflict during this service interval.`
          );
        }

        booking.driverId = driver._id as any;
        booking.driverDetails = {
          name: driver.name,
          phone: driver.phone,
        };
      } else {
        booking.driverId = undefined;
        booking.driverDetails = undefined;
      }

      if (typeof data.discloseDriverToCustomer === 'boolean') {
        booking.discloseDriverToCustomer = data.discloseDriverToCustomer;
      }

      if (data.notes) {
        booking.statusNotes = data.notes;
      }

      await booking.save();

      await AdminAuditLog.create({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'ASSIGN_RESOURCES',
        targetType: 'Booking',
        targetId: booking._id.toString(),
        details: {
          carId: data.carId,
          driverId: data.driverId,
          discloseDriverToCustomer: booking.discloseDriverToCustomer,
        },
      });

      return booking;
    });
  }

  /**
   * Safe status transitions with conflict prevention and resource release
   */
  public static async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    reason: string | undefined,
    notes: string | undefined,
    adminUser: { id: string; email: string; name: string }
  ): Promise<IBookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const currentStatus = booking.status;
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      rejected: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
    }

    // Recheck car availability when confirming
    if (newStatus === 'confirmed') {
      const carAvailable = await AvailabilityService.isCarAvailable(
        booking.carId.toString(),
        booking.serviceInterval.start,
        booking.serviceInterval.end,
        booking._id.toString()
      );
      if (!carAvailable) {
        throw new Error('Vehicle is already reserved for this interval by another confirmed trip.');
      }
    }

    booking.status = newStatus;
    if (notes) booking.statusNotes = notes;
    if (newStatus === 'cancelled') booking.cancellationReason = reason || 'Cancelled by dispatcher';
    if (newStatus === 'rejected') booking.rejectionReason = reason || 'Rejected by dispatcher';

    await booking.save();

    await BookingStatusHistory.create({
      bookingId: booking._id,
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedBy: adminUser.email,
      actorRole: 'admin',
      reason: reason || notes || `Status changed to ${newStatus}`,
    });

    await AdminAuditLog.create({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: `STATUS_${newStatus.toUpperCase()}`,
      targetType: 'Booking',
      targetId: booking._id.toString(),
      details: { previousStatus: currentStatus, newStatus, reason },
    });

    return booking;
  }

  /**
   * Records cash collection details
   */
  public static async recordCashPayment(
    bookingId: string,
    paymentData: {
      finalFare: number;
      amountCollected: number;
      paymentStatus: PaymentStatus;
      notes?: string;
    },
    adminUser: { id: string; email: string; name: string }
  ): Promise<IBookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.finalFare = paymentData.finalFare;
    booking.amountCollected = paymentData.amountCollected;
    booking.paymentStatus = paymentData.paymentStatus;
    booking.paymentNotes = paymentData.notes;

    await booking.save();

    if (paymentData.amountCollected > 0) {
      await PaymentRecord.create({
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        amount: paymentData.amountCollected,
        collectedAt: new Date(),
        collectedBy: adminUser.name || adminUser.email,
        paymentMode: 'cash',
        notes: paymentData.notes,
      });
    }

    await AdminAuditLog.create({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'RECORD_CASH_PAYMENT',
      targetType: 'Booking',
      targetId: booking._id.toString(),
      details: {
        finalFare: paymentData.finalFare,
        amountCollected: paymentData.amountCollected,
        paymentStatus: paymentData.paymentStatus,
      },
    });

    return booking;
  }

  /**
   * Secure booking lookup by customer using Reference + Verified Mobile/OTP
   */
  public static async lookupStatus(
    reference: string,
    phone: string,
    otpCode?: string
  ): Promise<{
    booking: Partial<IBookingDocument>;
    isOtpVerified: boolean;
    otpSentForDemo?: string;
  }> {
    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase().trim(),
    });

    if (!booking) {
      throw new Error('No booking found matching this reference code.');
    }

    const cleanInputPhone = phone.replace(/[^0-9]/g, '');
    const cleanStoredPhone = booking.customerPhone.replace(/[^0-9]/g, '');

    if (!cleanStoredPhone.endsWith(cleanInputPhone) && !cleanInputPhone.endsWith(cleanStoredPhone)) {
      throw new Error('Mobile number does not match this booking record.');
    }

    let isOtpVerified = false;

    if (otpCode) {
      if (booking.otpCode !== otpCode) {
        throw new Error('Invalid OTP code. Please enter the correct 6-digit OTP.');
      }
      if (booking.otpExpiresAt && new Date() > booking.otpExpiresAt) {
        throw new Error('OTP has expired. Please request a new verification code.');
      }
      isOtpVerified = true;
    }

    const safeBooking: any = {
      _id: booking._id,
      bookingReference: booking.bookingReference,
      tripType: booking.tripType,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      pickupLocation: booking.pickupLocation,
      destinationLocation: booking.destinationLocation,
      pickupDateTime: booking.pickupDateTime,
      returnDateTime: booking.returnDateTime,
      durationHours: booking.durationHours,
      passengerCount: booking.passengerCount,
      specialInstructions: booking.specialInstructions,
      carDetails: booking.carDetails,
      fareBreakdown: booking.fareBreakdown,
      status: booking.status,
      expectedFare: booking.expectedFare,
      finalFare: booking.finalFare,
      amountCollected: booking.amountCollected,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    };

    // Disclose driver info only if authorized by admin or policy
    if (booking.discloseDriverToCustomer && booking.driverDetails) {
      safeBooking.driverDetails = booking.driverDetails;
    }

    return {
      booking: safeBooking,
      isOtpVerified,
      otpSentForDemo: !isOtpVerified ? booking.otpCode : undefined,
    };
  }
}
