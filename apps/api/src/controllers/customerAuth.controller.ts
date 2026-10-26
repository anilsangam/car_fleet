import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from '../services/customerAuth.service';
import { Customer } from '../models/Customer';
import { Booking } from '../models/Booking';
import { APP_CONSTANTS, getCustomerCookieOptions } from '../config/constants';

export class CustomerAuthController {
  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip;

      const { customer, sessionToken } = await CustomerAuthService.signup(
        req.body,
        userAgent,
        ipAddress
      );

      res.cookie(
        APP_CONSTANTS.CUSTOMER_COOKIE_NAME,
        sessionToken,
        getCustomerCookieOptions()
      );

      res.status(201).json({
        success: true,
        data: {
          customer,
          sessionToken,
        },
        message: 'Account created successfully. You are now logged in.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip;

      const { customer, sessionToken } = await CustomerAuthService.login(
        identifier,
        password,
        userAgent,
        ipAddress
      );

      res.cookie(
        APP_CONSTANTS.CUSTOMER_COOKIE_NAME,
        sessionToken,
        getCustomerCookieOptions()
      );

      res.json({
        success: true,
        data: {
          customer,
          sessionToken,
        },
        message: 'Welcome back! You are now logged in.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      let token = req.cookies?.[APP_CONSTANTS.CUSTOMER_COOKIE_NAME];
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (token) {
        await CustomerAuthService.logout(token);
      }

      res.clearCookie(APP_CONSTANTS.CUSTOMER_COOKIE_NAME);
      res.json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.customer?.id) {
        return res.status(401).json({ success: false, error: 'Customer not authenticated' });
      }

      const customer = await Customer.findById(req.customer.id);
      if (!customer || !customer.isActive) {
        return res.status(401).json({ success: false, error: 'Customer account not found or inactive' });
      }

      res.json({
        success: true,
        data: {
          customer,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.customer?.id) {
        return res.status(401).json({ success: false, error: 'Customer not authenticated' });
      }

      // Query bookings strictly belonging to this authenticated customer
      const bookings = await Booking.find({
        $or: [
          { customerId: req.customer.id },
          { customerPhone: req.customer.phone },
        ],
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}

