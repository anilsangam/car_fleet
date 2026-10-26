import { z } from 'zod';

export function normalizeIndianPhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export const indianPhoneRegex = /^[6-9]\d{9}$/;
export const nameRegex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+(?:[' -][a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+)*$/;

export const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export const tripTypeEnum = z.enum(['one_way', 'round_trip', 'hourly']);
export const carCategoryEnum = z.enum(['sedan', 'suv', 'luxury', 'tempo_traveller', 'hatchback']);
export const carStatusEnum = z.enum(['active', 'under_maintenance', 'inactive']);
export const transmissionEnum = z.enum(['manual', 'automatic']);
export const fuelTypeEnum = z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']);
export const driverStatusEnum = z.enum(['active', 'on_leave', 'inactive']);
export const bookingStatusEnum = z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected']);
export const paymentStatusEnum = z.enum(['pending', 'partially_collected', 'collected', 'refunded_or_waived']);

export const bookingCreateSchema = z.object({
  tripType: tripTypeEnum,
  customerName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .refine((val) => val.trim().length >= 2, 'Name cannot be whitespace only'),
  customerPhone: z
    .string()
    .trim()
    .transform(normalizeIndianPhone)
    .refine((val) => indianPhoneRegex.test(val), {
      message: 'Valid 10-digit mobile number required (starting with 6, 7, 8, or 9)',
    }),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  pickupLocation: z.string().min(3, 'Pickup location must be at least 3 characters'),
  destinationLocation: z.string().optional(),
  pickupDateTime: z.string().min(10, 'Valid pickup date and time is required'),
  returnDateTime: z.string().optional(),
  durationHours: z.number().int().min(1).max(72).optional(),
  passengerCount: z.number().int().min(1).max(20).default(1),
  carId: z.string().min(1, 'Please select a car'),
  specialInstructions: z.string().max(500).optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms & conditions'),
}).refine(data => {
  if (data.tripType === 'round_trip' && !data.returnDateTime) {
    return false;
  }
  return true;
}, {
  message: 'Return date and time is required for round trips',
  path: ['returnDateTime']
}).refine(data => {
  if ((data.tripType === 'one_way' || data.tripType === 'round_trip') && !data.destinationLocation) {
    return false;
  }
  return true;
}, {
  message: 'Destination location is required for one-way and round trips',
  path: ['destinationLocation']
}).refine(data => {
  if (data.tripType === 'hourly' && !data.durationHours) {
    return false;
  }
  return true;
}, {
  message: 'Duration in hours is required for hourly rentals',
  path: ['durationHours']
});

export const fareEstimateSchema = z.object({
  tripType: tripTypeEnum,
  carId: z.string().min(1, 'Car ID is required'),
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  destinationLocation: z.string().optional(),
  pickupDateTime: z.string().min(10, 'Pickup date time is required'),
  returnDateTime: z.string().optional(),
  durationHours: z.number().int().min(1).max(72).optional(),
  estimatedDistanceKm: z.number().min(1).optional(),
});

export const availabilityQuerySchema = z.object({
  tripType: tripTypeEnum.optional(),
  pickupDateTime: z.string().optional(),
  returnDateTime: z.string().optional(),
  durationHours: z.coerce.number().int().min(1).max(72).optional(),
  category: carCategoryEnum.optional(),
  passengers: z.coerce.number().int().min(1).optional(),
});

export const statusLookupSchema = z.object({
  bookingReference: z.string().min(4, 'Valid booking reference required').max(30),
  phone: z.string().min(10, 'Valid 10-digit mobile number required').max(15),
});

export const statusVerifyOtpSchema = z.object({
  bookingReference: z.string().min(4).max(30),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

export const carCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  category: carCategoryEnum,
  registrationNumber: z.string().min(4, 'Registration number is required').toUpperCase(),
  seatingCapacity: z.number().int().min(1).max(25),
  luggageCapacity: z.number().int().min(0).max(20),
  transmission: transmissionEnum,
  fuelType: fuelTypeEnum,
  primaryImage: z.string().url('Valid image URL required'),
  images: z.array(z.string().url()).optional().default([]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amenities: z.array(z.string()).default([]),
  baseRatePerKm: z.number().min(0),
  baseRatePerHour: z.number().min(0),
  fixedRatePerDay: z.number().min(0),
  status: carStatusEnum.default('active'),
  isActive: z.boolean().default(true),
  year: z.number().int().min(2000).max(2035).optional(),
  color: z.string().optional(),
});

export const carUpdateSchema = carCreateSchema.partial();

export const driverCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  alternatePhone: z.string().optional(),
  licenseNumber: z.string().min(5, 'Valid license number required').toUpperCase(),
  licenseExpiry: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  status: driverStatusEnum.default('active'),
  assignedCarId: z.string().optional(),
  notes: z.string().optional(),
});

export const driverUpdateSchema = driverCreateSchema.partial();

export const bookingStatusUpdateSchema = z.object({
  status: bookingStatusEnum,
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export const bookingAssignmentSchema = z.object({
  carId: z.string().min(1, 'Car selection is required'),
  driverId: z.string().optional(),
  discloseDriverToCustomer: z.boolean().default(false),
  notes: z.string().optional(),
});

export const cashCollectionSchema = z.object({
  finalFare: z.number().min(0, 'Final fare must be non-negative'),
  amountCollected: z.number().min(0, 'Amount collected must be non-negative'),
  paymentStatus: paymentStatusEnum,
  notes: z.string().optional(),
});

export const fareRuleCreateSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  tripType: tripTypeEnum,
  carCategory: carCategoryEnum.optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  fixedPrice: z.number().min(0).optional(),
  baseRatePerKm: z.number().min(0).optional(),
  minDistanceKm: z.number().min(0).optional(),
  minFare: z.number().min(0).optional(),
  hourlyPackages: z.array(z.object({
    hours: z.number().int().min(1),
    maxKm: z.number().min(1),
    rate: z.number().min(0)
  })).optional(),
  nightSurcharge: z.number().min(0).default(300),
  driverAllowancePerDay: z.number().min(0).default(400),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const fareRuleUpdateSchema = fareRuleCreateSchema.partial();

export const businessSettingsSchema = z.object({
  businessName: z.string().min(2),
  tagline: z.string(),
  logoUrl: z.string().optional(),
  supportPhone: z.string().min(8),
  supportEmail: z.string().email(),
  officeAddress: z.string().min(5),
  operatingHours: z.string(),
  serviceAreas: z.array(z.string()),
  defaultCurrency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  timezone: z.string().default('Asia/Kolkata'),
  bufferMinutesBetweenTrips: z.number().int().min(15).max(360).default(60),
  advanceBookingHoursRequired: z.number().int().min(0).max(48).default(2),
  cancellationPolicyText: z.string(),
  termsAndConditionsText: z.string(),
  privacyPolicyText: z.string(),
  cashPaymentInstructions: z.string(),
  discloseDriverHoursBeforePickup: z.number().int().min(1).max(24).default(3),
  autoDiscloseDriverOnConfirm: z.boolean().default(false),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerSignupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .refine((val) => val.trim().length >= 2, 'Full name cannot be whitespace only')
      .refine((val) => nameRegex.test(val.trim()), {
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      }),
    phone: z
      .string()
      .trim()
      .transform(normalizeIndianPhone)
      .refine((val) => indianPhoneRegex.test(val), {
        message: 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9',
      }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms & conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const customerLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Email or mobile number is required')
    .transform((val) => {
      const digits = val.replace(/\D/g, '');
      if (digits.length >= 10 && !val.includes('@')) {
        return normalizeIndianPhone(val);
      }
      return val.toLowerCase();
    }),
  password: z.string().min(1, 'Password is required'),
});

