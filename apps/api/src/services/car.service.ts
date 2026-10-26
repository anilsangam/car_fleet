import { Car, ICarDocument } from '../models/Car';
import { Booking } from '../models/Booking';

export class CarService {
  public static async listCars(params: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ cars: ICarDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (params.status && params.status !== 'all') {
      query.status = params.status;
    }
    if (params.category && params.category !== 'all') {
      query.category = params.category;
    }
    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
        { registrationNumber: searchRegex },
      ];
    }

    const [cars, total] = await Promise.all([
      Car.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Car.countDocuments(query),
    ]);

    return {
      cars,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getCarById(id: string): Promise<ICarDocument | null> {
    return Car.findById(id);
  }

  public static async createCar(data: any): Promise<ICarDocument> {
    const car = new Car(data);
    return car.save();
  }

  public static async updateCar(id: string, data: any): Promise<ICarDocument | null> {
    return Car.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  public static async getUpcomingBookingsForCar(carId: string) {
    const now = new Date();
    return Booking.find({
      carId,
      status: { $in: ['confirmed', 'in_progress'] },
      'serviceInterval.end': { $gte: now },
    }).sort({ 'serviceInterval.start': 1 });
  }
}

