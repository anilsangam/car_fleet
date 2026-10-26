import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { BookingStatus, PaymentStatus, TripType } from '@car-rental/shared';

export interface IBookingDocument extends Document {
  bookingReference: string;
  tripType: TripType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation: string;
  destinationLocation?: string;
  pickupDateTime: Date;
  returnDateTime?: Date;
  durationHours?: number;
  passengerCount: number;
  specialInstructions?: string;
  customerId?: Types.ObjectId;

  carId: Types.ObjectId;
  carDetails?: {
    name: string;
    brand: string;
    model: string;
    category: string;
    registrationNumber: string;
    primaryImage: string;
    seatingCapacity: number;
  };

  driverId?: Types.ObjectId;
  driverDetails?: {
    name: string;
    phone: string;
  };
  discloseDriverToCustomer: boolean;

  serviceInterval: {
    start: Date;
    end: Date;
    bufferMinutes: number;
  };

  fareBreakdown: {
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
  };
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
  otpExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDocument>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'hourly'],
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    pickupLocation: { type: String, required: true, trim: true },
    destinationLocation: { type: String, trim: true },
    pickupDateTime: { type: Date, required: true, index: true },
    returnDateTime: { type: Date },
    durationHours: { type: Number },
    passengerCount: { type: Number, required: true, default: 1 },
    specialInstructions: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },

    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    carDetails: {
      name: String,
      brand: String,
      model: String,
      category: String,
      registrationNumber: String,
      primaryImage: String,
      seatingCapacity: Number,
    },

    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
    driverDetails: {
      name: String,
      phone: String,
    },
    discloseDriverToCustomer: { type: Boolean, default: false },

    serviceInterval: {
      start: { type: Date, required: true, index: true },
      end: { type: Date, required: true, index: true },
      bufferMinutes: { type: Number, default: 60 },
    },

    fareBreakdown: {
      baseFare: { type: Number, required: true },
      distanceKm: { type: Number },
      ratePerKm: { type: Number },
      durationHours: { type: Number },
      hourlyRate: { type: Number },
      driverAllowance: { type: Number, default: 0 },
      nightSurcharge: { type: Number, default: 0 },
      tollTaxesEstimated: { type: Number, default: 0 },
      subtotal: { type: Number, required: true },
      totalFare: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      appliedRuleName: { type: String },
    },
    fareSnapshot: { type: Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
      index: true,
    },
    statusNotes: { type: String },
    cancellationReason: { type: String },
    rejectionReason: { type: String },

    expectedFare: { type: Number, required: true },
    finalFare: { type: Number, required: true },
    amountCollected: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partially_collected', 'collected', 'refunded_or_waived'],
      default: 'pending',
      index: true,
    },
    paymentNotes: { type: String },

    accessTokenHash: { type: String },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast double-booking conflict detection and query filtering
BookingSchema.index({ carId: 1, 'serviceInterval.start': 1, 'serviceInterval.end': 1, status: 1 });
BookingSchema.index({ driverId: 1, 'serviceInterval.start': 1, 'serviceInterval.end': 1, status: 1 });
BookingSchema.index({ status: 1, pickupDateTime: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking: Model<IBookingDocument> =
  mongoose.models.Booking || mongoose.model<IBookingDocument>('Booking', BookingSchema);

