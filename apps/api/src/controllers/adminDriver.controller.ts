import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { AdminAuditLog } from '../models/AdminAuditLog';

export class AdminDriverController {
  public static async listDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DriverService.listDrivers({
        status: req.query.status as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.json({
        success: true,
        data: result.drivers,
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

  public static async getDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.getDriverById(req.params.id);
      if (!driver) {
        return res.status(404).json({ success: false, error: 'Driver not found' });
      }
      res.json({ success: true, data: driver });
    } catch (error) {
      next(error);
    }
  }

  public static async createDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.createDriver(req.body);

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'CREATE_DRIVER',
        targetType: 'Driver',
        targetId: driver._id.toString(),
        details: { name: driver.name, licenseNumber: driver.licenseNumber },
      });

      res.status(201).json({ success: true, data: driver, message: 'Driver created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async updateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.updateDriver(req.params.id, req.body);
      if (!driver) {
        return res.status(404).json({ success: false, error: 'Driver not found' });
      }

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'UPDATE_DRIVER',
        targetType: 'Driver',
        targetId: driver._id.toString(),
        details: req.body,
      });

      res.json({ success: true, data: driver, message: 'Driver updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getUpcomingBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await DriverService.getUpcomingBookingsForDriver(req.params.id);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }
}

