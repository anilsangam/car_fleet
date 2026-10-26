import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { CustomerAuthService } from '../services/customerAuth.service';
import { APP_CONSTANTS } from '../config/constants';

declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
        name: string;
        role: 'superadmin' | 'admin' | 'dispatcher';
      };
      sessionToken?: string;
      customer?: {
        id: string;
        phone: string;
        email?: string;
        name: string;
      };
      customerSessionToken?: string;
    }
  }
}

export const requireAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.[APP_CONSTANTS.COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    const sessionData = await AuthService.validateSession(token);
    if (!sessionData) {
      res.clearCookie(APP_CONSTANTS.COOKIE_NAME);
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please log in again.',
      });
    }

    req.adminUser = {
      id: sessionData.user._id.toString(),
      email: sessionData.user.email,
      name: sessionData.user.name,
      role: sessionData.user.role,
    };
    req.sessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireCustomerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.[APP_CONSTANTS.CUSTOMER_COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Customer login required. Please sign in or create an account to proceed.',
      });
    }

    const sessionData = await CustomerAuthService.validateSession(token);
    if (!sessionData) {
      res.clearCookie(APP_CONSTANTS.CUSTOMER_COOKIE_NAME);
      return res.status(401).json({
        success: false,
        error: 'Customer session expired or invalid. Please sign in again.',
      });
    }

    req.customer = {
      id: sessionData.customer._id.toString(),
      phone: sessionData.customer.phone,
      email: sessionData.customer.email,
      name: sessionData.customer.name,
    };
    req.customerSessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
};
