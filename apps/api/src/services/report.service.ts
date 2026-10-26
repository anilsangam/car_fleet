import { Booking } from '../models/Booking';
import { Car } from '../models/Car';
import { Driver } from '../models/Driver';
import { PaymentRecord } from '../models/PaymentRecord';
import { DashboardMetrics } from '@car-rental/shared';

export class ReportService {
  public static async getDashboardMetrics(dateFrom?: string, dateTo?: string): Promise<DashboardMetrics> {
    const bookingQuery: Record<string, any> = {};
    if (dateFrom || dateTo) {
      bookingQuery.createdAt = {};
      if (dateFrom) bookingQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) bookingQuery.createdAt.$lte = new Date(dateTo);
    }

    const [
      totalCars,
      activeCars,
      pendingCount,
      confirmedCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      paymentsAggregation,
      revenueAggregation,
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'active', isActive: true }),
      Booking.countDocuments({ ...bookingQuery, status: 'pending' }),
      Booking.countDocuments({ ...bookingQuery, status: 'confirmed' }),
      Booking.countDocuments({ ...bookingQuery, status: 'in_progress' }),
      Booking.countDocuments({ ...bookingQuery, status: 'completed' }),
      Booking.countDocuments({ ...bookingQuery, status: 'cancelled' }),
      PaymentRecord.aggregate([
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { ...bookingQuery, status: { $in: ['confirmed', 'in_progress', 'completed'] } } },
        {
          $group: {
            _id: null,
            totalExpected: { $sum: '$expectedFare' },
            totalFinal: { $sum: '$finalFare' },
            totalCollected: { $sum: '$amountCollected' },
          },
        },
      ]),
    ]);

    const totalCashCollected = paymentsAggregation[0]?.totalCollected || 0;
    const totalExpectedRevenue = revenueAggregation[0]?.totalFinal || revenueAggregation[0]?.totalExpected || 0;
    const totalOutstandingCash = Math.max(0, totalExpectedRevenue - (revenueAggregation[0]?.totalCollected || 0));

    return {
      totalCars,
      availableCars: activeCars,
      unavailableCars: totalCars - activeCars,
      pendingBookings: pendingCount,
      confirmedBookings: confirmedCount,
      inProgressBookings: inProgressCount,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount,
      totalCashCollected,
      totalOutstandingCash,
      totalExpectedRevenue,
    };
  }

  public static async getBookingsReport(filters: {
    startDate?: string;
    endDate?: string;
    tripType?: string;
    status?: string;
  }) {
    const query: Record<string, any> = {};

    if (filters.startDate || filters.endDate) {
      query.pickupDateTime = {};
      if (filters.startDate) query.pickupDateTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.pickupDateTime.$lte = new Date(filters.endDate);
    }
    if (filters.tripType && filters.tripType !== 'all') {
      query.tripType = filters.tripType;
    }
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    const bookings = await Booking.find(query).sort({ pickupDateTime: -1 }).limit(500);
    return bookings;
  }

  public static async exportBookingsCSV(filters: any): Promise<string> {
    const bookings = await this.getBookingsReport(filters);
    const headers = [
      'Reference',
      'Trip Type',
      'Customer Name',
      'Customer Phone',
      'Pickup Location',
      'Destination',
      'Pickup Date Time',
      'Vehicle',
      'Driver',
      'Status',
      'Expected Fare (INR)',
      'Final Fare (INR)',
      'Collected Amount (INR)',
      'Payment Status',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingReference}"`,
      `"${b.tripType}"`,
      `"${b.customerName}"`,
      `"${b.customerPhone}"`,
      `"${b.pickupLocation.replace(/"/g, '""')}"`,
      `"${(b.destinationLocation || '').replace(/"/g, '""')}"`,
      `"${new Date(b.pickupDateTime).toISOString()}"`,
      `"${(b.carDetails?.name || '') + ' (' + (b.carDetails?.registrationNumber || '') + ')'}"`,
      `"${b.driverDetails?.name || 'Unassigned'}"`,
      `"${b.status}"`,
      b.expectedFare,
      b.finalFare,
      b.amountCollected,
      `"${b.paymentStatus}"`,
      `"${new Date(b.createdAt).toISOString()}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

