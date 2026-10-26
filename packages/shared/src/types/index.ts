export type TripType = 'one_way' | 'round_trip' | 'hourly';

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 
  | 'pending'
  | 'partially_collected'
  | 'collected'
  | 'refunded_or_waived';

export type CarStatus = 'active' | 'under_maintenance' | 'inactive';

export type CarCategory = 'sedan' | 'suv' | 'luxury' | 'tempo_traveller' | 'hatchback';

export type Transmission = 'manual' | 'automatic';

export type FuelType = 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';

export type DriverStatus = 'active' | 'on_leave' | 'inactive';

export interface FareBreakdown {
  baseFare: number;
  distanceKm?: number;
  ratePerKm?: number;
  durationHours?: number;
  hourlyRate?: number;
  driverAllowance: number;
  nightSurcharge: number;
  tollTaxesEstimated: number;
  subtotal: number;
  totalFare: number;
  currency: string;
  appliedRuleName?: string;
}

export interface ICar {
  _id: string;
  name: string;
  model: string;
  brand: string;
  category: CarCategory;
  registrationNumber: string;
  seatingCapacity: number;
  luggageCapacity: number;
  transmission: Transmission;
  fuelType: FuelType;
  primaryImage: string;
  images: string[];
  description: string;
  amenities: string[];
  baseRatePerKm: number;
  baseRatePerHour: number;
  fixedRatePerDay: number;
  status: CarStatus;
  isActive: boolean;
  year?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDriver {
  _id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  experienceYears?: number;
  status: DriverStatus;
  rating?: number;
  assignedCarId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBooking {
  _id: string;
  bookingReference: string;
  tripType: TripType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation: string;
  destinationLocation?: string;
  pickupDateTime: string;
  returnDateTime?: string;
  durationHours?: number;
  passengerCount: number;
  specialInstructions?: string;
  customerId?: string;
  
  carId: string;
  carDetails?: {
    name: string;
    brand: string;
    model: string;
    category: CarCategory;
    registrationNumber: string;
    primaryImage: string;
    seatingCapacity: number;
  };

  driverId?: string;
  driverDetails?: {
    name: string;
    phone: string;
  };
  discloseDriverToCustomer: boolean;

  serviceInterval: {
    start: string;
    end: string;
    bufferMinutes: number;
  };

  fareBreakdown: FareBreakdown;
  fareSnapshot: Record<string, any>;

  status: BookingStatus;
  statusNotes?: string;
  cancellationReason?: string;
  rejectionReason?: string;

  expectedFare: number;
  finalFare: number;
  amountCollected: number;
  paymentStatus: PaymentStatus;
  paymentNotes?: string;

  accessTokenHash?: string;
  otpCode?: string;
  otpExpiresAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface IBookingStatusHistory {
  _id: string;
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  changedBy: string;
  actorRole: 'admin' | 'customer' | 'system';
  reason?: string;
  createdAt: string;
}

export interface IPaymentRecord {
  _id: string;
  bookingId: string;
  bookingReference: string;
  amount: number;
  collectedAt: string;
  collectedBy: string;
  paymentMode: 'cash';
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface IFareRule {
  _id: string;
  name: string;
  tripType: TripType;
  carCategory?: CarCategory;
  origin?: string;
  destination?: string;
  fixedPrice?: number;
  baseRatePerKm?: number;
  minDistanceKm?: number;
  minFare?: number;
  hourlyPackages?: Array<{
    hours: number;
    maxKm: number;
    rate: number;
  }>;
  nightSurcharge: number;
  driverAllowancePerDay: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessSettings {
  _id?: string;
  businessName: string;
  tagline: string;
  logoUrl?: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  operatingHours: string;
  serviceAreas: string[];
  defaultCurrency: string;
  currencySymbol: string;
  timezone: string;
  bufferMinutesBetweenTrips: number;
  advanceBookingHoursRequired: number;
  cancellationPolicyText: string;
  termsAndConditionsText: string;
  privacyPolicyText: string;
  cashPaymentInstructions: string;
  discloseDriverHoursBeforePickup: number;
  autoDiscloseDriverOnConfirm: boolean;
  updatedAt?: string;
}

export interface IAdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'dispatcher';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  totalBookings?: number;
  lastBookingAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerSignupRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  termsAccepted: boolean;
}

export interface CustomerLoginRequest {
  identifier: string; // email or phone
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardMetrics {
  totalCars: number;
  availableCars: number;
  unavailableCars: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCashCollected: number;
  totalOutstandingCash: number;
  totalExpectedRevenue: number;
}

