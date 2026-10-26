import crypto from 'crypto';
import { AdminUser, IAdminUserDocument } from '../models/AdminUser';
import { AdminSession, IAdminSessionDocument } from '../models/AdminSession';
import { APP_CONSTANTS } from '../config/constants';

export class AuthService {
  public static async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: IAdminUserDocument; sessionToken: string }> {
    const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('This administrator account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + APP_CONSTANTS.COOKIE_MAX_AGE);

    await AdminSession.create({
      token: sessionToken,
      userId: user._id,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return { user, sessionToken };
  }

  public static async validateSession(
    token: string
  ): Promise<{ user: IAdminUserDocument; session: IAdminSessionDocument } | null> {
    if (!token) return null;

    const session = await AdminSession.findOne({ token });
    if (!session || new Date() > session.expiresAt) {
      if (session) await AdminSession.deleteOne({ _id: session._id });
      return null;
    }

    const user = await AdminUser.findById(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return { user, session };
  }

  public static async logout(token: string): Promise<void> {
    if (token) {
      await AdminSession.deleteOne({ token });
    }
  }
}

