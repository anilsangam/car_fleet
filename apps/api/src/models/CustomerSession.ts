import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ICustomerSessionDocument extends Document {
  token: string;
  customerId: Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSessionSchema = new Schema<ICustomerSessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL auto-cleanup
  },
  {
    timestamps: true,
  }
);

export const CustomerSession: Model<ICustomerSessionDocument> =
  mongoose.models.CustomerSession ||
  mongoose.model<ICustomerSessionDocument>('CustomerSession', CustomerSessionSchema);

