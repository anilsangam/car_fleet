import { Request, Response, NextFunction } from 'express';
import { CarService } from '../services/car.service';
import { AdminAuditLog } from '../models/AdminAuditLog';

export class AdminCarController {
  public static async listCars(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CarService.listCars({
        status: req.query.status as string,
        category: req.query.category as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.json({
        success: true,
        data: result.cars,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCar(req: Request, res: Response, next: NextFunction) {
    try {
      const car = await CarService.getCarById(req.params.id);
      if (!car) {
        return res.status(404).json({ success: false, error: 'Car not found' });
      }
      res.json({ success: true, data: car });
    } catch (error) {
      next(error);
    }
  }

  public static async createCar(req: Request, res: Response, next: NextFunction) {
    try {
      const car = await CarService.createCar(req.body);

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'CREATE_CAR',
        targetType: 'Car',
        targetId: car._id.toString(),
        details: { name: car.name, registrationNumber: car.registrationNumber },
      });

      res.status(201).json({ success: true, data: car, message: 'Vehicle added to fleet successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCar(req: Request, res: Response, next: NextFunction) {
    try {
      const car = await CarService.updateCar(req.params.id, req.body);
      if (!car) {
        return res.status(404).json({ success: false, error: 'Car not found' });
      }

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'UPDATE_CAR',
        targetType: 'Car',
        targetId: car._id.toString(),
        details: req.body,
      });

      res.json({ success: true, data: car, message: 'Vehicle details updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getUpcomingBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await CarService.getUpcomingBookingsForCar(req.params.id);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }
}

