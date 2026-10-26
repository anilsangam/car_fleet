import { Driver, IDriverDocument } from '../models/Driver';
import { Booking } from '../models/Booking';

export class DriverService {
  public static async listDrivers(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ drivers: IDriverDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (params.status && params.status !== 'all') {
      query.status = params.status;
    }
    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { licenseNumber: searchRegex },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Driver.countDocuments(query),
    ]);

    return {
      drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getDriverById(id: string): Promise<IDriverDocument | null> {
    return Driver.findById(id);
  }

  public static async createDriver(data: any): Promise<IDriverDocument> {
    const driver = new Driver(data);
    return driver.save();
  }

  public static async updateDriver(id: string, data: any): Promise<IDriverDocument | null> {
    return Driver.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  public static async getUpcomingBookingsForDriver(driverId: string) {
    const now = new Date();
    return Booking.find({
      driverId,
      status: { $in: ['confirmed', 'in_progress'] },
      'serviceInterval.end': { $gte: now },
    }).sort({ 'serviceInterval.start': 1 });
  }
}

