import mongoose, { Document, Schema, Model } from 'mongoose';
import { CarCategory, CarStatus, FuelType, Transmission } from '@car-rental/shared';

export interface ICarDocument extends Omit<Document, 'model'> {
  name: string;
  brand: string;
  model: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const CarSchema = new Schema<ICarDocument>(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['sedan', 'suv', 'luxury', 'tempo_traveller', 'hatchback'],
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    seatingCapacity: { type: Number, required: true, min: 1, index: true },
    luggageCapacity: { type: Number, required: true, default: 2 },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      required: true,
      default: 'manual',
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid'],
      required: true,
      default: 'diesel',
    },
    primaryImage: { type: String, required: true },
    images: { type: [String], default: [] },
    description: { type: String, required: true },
    amenities: { type: [String], default: [] },
    baseRatePerKm: { type: Number, required: true, min: 0 },
    baseRatePerHour: { type: Number, required: true, min: 0 },
    fixedRatePerDay: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'under_maintenance', 'inactive'],
      default: 'active',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    year: { type: Number },
    color: { type: String },
  },
  {
    timestamps: true,
  }
);

CarSchema.index({ status: 1, isActive: 1, category: 1 });

export const Car: Model<ICarDocument> =
  mongoose.models.Car || mongoose.model<ICarDocument>('Car', CarSchema);
