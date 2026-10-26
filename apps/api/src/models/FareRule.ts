import mongoose, { Document, Schema, Model } from 'mongoose';
import { CarCategory, TripType } from '@car-rental/shared';

export interface IFareRuleDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const FareRuleSchema = new Schema<IFareRuleDocument>(
  {
    name: { type: String, required: true, trim: true },
    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'hourly'],
      required: true,
      index: true,
    },
    carCategory: {
      type: String,
      enum: ['sedan', 'suv', 'luxury', 'tempo_traveller', 'hatchback'],
      index: true,
    },
    origin: { type: String, trim: true },
    destination: { type: String, trim: true },
    fixedPrice: { type: Number, min: 0 },
    baseRatePerKm: { type: Number, min: 0 },
    minDistanceKm: { type: Number, min: 0 },
    minFare: { type: Number, min: 0 },
    hourlyPackages: [
      {
        hours: { type: Number, required: true },
        maxKm: { type: Number, required: true },
        rate: { type: Number, required: true },
      },
    ],
    nightSurcharge: { type: Number, default: 300 },
    driverAllowancePerDay: { type: Number, default: 400 },
    priority: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

FareRuleSchema.index({ tripType: 1, carCategory: 1, priority: -1 });

export const FareRule: Model<IFareRuleDocument> =
  mongoose.models.FareRule || mongoose.model<IFareRuleDocument>('FareRule', FareRuleSchema);

