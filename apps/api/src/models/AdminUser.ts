import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'dispatcher';
  isActive: boolean;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'dispatcher'],
      default: 'admin',
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
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

AdminUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const AdminUser: Model<IAdminUserDocument> =
  mongoose.models.AdminUser || mongoose.model<IAdminUserDocument>('AdminUser', AdminUserSchema);

