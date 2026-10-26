import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Customer, ICustomerDocument } from '../models/Customer';
import { CustomerSession, ICustomerSessionDocument } from '../models/CustomerSession';
import { APP_CONSTANTS } from '../config/constants';
import { CustomerSignupRequest, normalizeIndianPhone } from '@car-rental/shared';

export class CustomerAuthService {
  /**
   * Registers a new customer or sets password for an existing unauthenticated customer record
   */
  public static async signup(
    data: CustomerSignupRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ customer: ICustomerDocument; sessionToken: string }> {
    const cleanPhone = normalizeIndianPhone(data.phone.trim());
    const cleanEmail = data.email?.trim().toLowerCase() || undefined;

    // Check if customer with this phone number already has a registered account
    const existingByPhone = await Customer.findOne({ phone: cleanPhone });
    if (existingByPhone && existingByPhone.passwordHash) {
      throw new Error('An account with this mobile number already exists. Please log in.');
    }

    // If email provided, verify it is not already used by another registered account
    if (cleanEmail) {
      const existingByEmail = await Customer.findOne({ email: cleanEmail });
      if (existingByEmail && existingByEmail.passwordHash && existingByEmail.phone !== cleanPhone) {
        throw new Error('An account with this email address already exists. Please log in.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    let customer: ICustomerDocument;
    if (existingByPhone) {
      existingByPhone.name = data.name.trim();
      if (cleanEmail) existingByPhone.email = cleanEmail;
      existingByPhone.passwordHash = passwordHash;
      existingByPhone.isActive = true;
      customer = await existingByPhone.save();
    } else {
      customer = await Customer.create({
        name: data.name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        passwordHash,
        isActive: true,
        totalBookings: 0,
      });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + APP_CONSTANTS.CUSTOMER_COOKIE_MAX_AGE);

    await CustomerSession.create({
      token: sessionToken,
      customerId: customer._id,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return { customer, sessionToken };
  }

  /**
   * Authenticates customer via email or mobile number + password
   */
  public static async login(
    identifier: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ customer: ICustomerDocument; sessionToken: string }> {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');

    const query = isEmail
      ? { email: trimmed.toLowerCase() }
      : { phone: normalizeIndianPhone(trimmed) };

    const customer = await Customer.findOne(query);
    if (!customer || !customer.passwordHash) {
      throw new Error('Invalid mobile/email or password');
    }

    if (!customer.isActive) {
      throw new Error('This account has been deactivated. Please contact support.');
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid mobile/email or password');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + APP_CONSTANTS.CUSTOMER_COOKIE_MAX_AGE);

    await CustomerSession.create({
      token: sessionToken,
      customerId: customer._id,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return { customer, sessionToken };
  }

  /**
   * Validates customer session token and returns active customer record
   */
  public static async validateSession(
    token: string
  ): Promise<{ customer: ICustomerDocument; session: ICustomerSessionDocument } | null> {
    if (!token) return null;

    const session = await CustomerSession.findOne({ token });
    if (!session || new Date() > session.expiresAt) {
      if (session) await CustomerSession.deleteOne({ _id: session._id });
      return null;
    }

    const customer = await Customer.findById(session.customerId);
    if (!customer || !customer.isActive) {
      return null;
    }

    return { customer, session };
  }

  /**
   * Logs customer out by deleting active session
   */
  public static async logout(token: string): Promise<void> {
    if (token) {
      await CustomerSession.deleteOne({ token });
    }
  }
}

