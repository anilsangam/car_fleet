import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IAdminSessionDocument extends Document {
  token: string;
  userId: Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Automatic MongoDB TTL cleanup
  },
  {
    timestamps: true,
  }
);

export const AdminSession: Model<IAdminSessionDocument> =
  mongoose.models.AdminSession || mongoose.model<IAdminSessionDocument>('AdminSession', AdminSessionSchema);

