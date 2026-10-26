import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { APP_CONSTANTS, getCookieOptions } from '../config/constants';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, sessionToken } = await AuthService.login(
        email,
        password,
        req.headers['user-agent'],
        req.ip
      );

      res.cookie(APP_CONSTANTS.COOKIE_NAME, sessionToken, getCookieOptions());

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          sessionToken,
        },
        message: 'Logged in successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[APP_CONSTANTS.COOKIE_NAME] || req.sessionToken;
      if (token) {
        await AuthService.logout(token);
      }
      res.clearCookie(APP_CONSTANTS.COOKIE_NAME, { path: '/' });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: {
          user: req.adminUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

