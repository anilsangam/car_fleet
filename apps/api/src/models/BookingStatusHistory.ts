import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { BookingStatus } from '@car-rental/shared';

export interface IBookingStatusHistoryDocument extends Document {
  bookingId: Types.ObjectId;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  changedBy: string;
  actorRole: 'admin' | 'customer' | 'system';
  reason?: string;
  createdAt: Date;
}

const BookingStatusHistorySchema = new Schema<IBookingStatusHistoryDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    fromStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
      required: true,
    },
    toStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
      required: true,
    },
    changedBy: { type: String, required: true },
    actorRole: {
      type: String,
      enum: ['admin', 'customer', 'system'],
      default: 'admin',
    },
    reason: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BookingStatusHistorySchema.index({ bookingId: 1, createdAt: -1 });

export const BookingStatusHistory: Model<IBookingStatusHistoryDocument> =
  mongoose.models.BookingStatusHistory ||
  mongoose.model<IBookingStatusHistoryDocument>('BookingStatusHistory', BookingStatusHistorySchema);

