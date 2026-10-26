import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { DriverStatus } from '@car-rental/shared';

export interface IDriverDocument extends Document {
  name: string;
  phone: string;
  alternatePhone?: string;
  licenseNumber: string;
  licenseExpiry?: Date;
  experienceYears?: number;
  status: DriverStatus;
  assignedCarId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriverDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    licenseExpiry: { type: Date },
    experienceYears: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive'],
      default: 'active',
      index: true,
    },
    assignedCarId: { type: Schema.Types.ObjectId, ref: 'Car' },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

DriverSchema.index({ status: 1, name: 1 });

export const Driver: Model<IDriverDocument> =
  mongoose.models.Driver || mongoose.model<IDriverDocument>('Driver', DriverSchema);

