import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IBookingAccessTokenDocument extends Document {
  bookingId: Types.ObjectId;
  tokenHash: string;
  phone: string;
  expiresAt: Date;
  attemptCount: number;
  createdAt: Date;
}

const BookingAccessTokenSchema = new Schema<IBookingAccessTokenDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const BookingAccessToken: Model<IBookingAccessTokenDocument> =
  mongoose.models.BookingAccessToken ||
  mongoose.model<IBookingAccessTokenDocument>('BookingAccessToken', BookingAccessTokenSchema);

