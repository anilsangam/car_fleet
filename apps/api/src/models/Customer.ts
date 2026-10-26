import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICustomerDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  isActive: boolean;
  totalBookings: number;
  lastBookingAt?: Date;
  notes?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, index: true },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
    totalBookings: { type: Number, default: 0 },
    lastBookingAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        return ret;
      },
    },
  }
);

CustomerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);
