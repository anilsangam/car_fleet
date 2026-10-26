import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPaymentRecordDocument extends Document {
  bookingId: Types.ObjectId;
  bookingReference: string;
  amount: number;
  collectedAt: Date;
  collectedBy: string;
  paymentMode: 'cash';
  notes?: string;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecordDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    bookingReference: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    collectedAt: { type: Date, default: Date.now },
    collectedBy: { type: String, required: true },
    paymentMode: { type: String, enum: ['cash'], default: 'cash' },
    notes: { type: String },
    receiptNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

PaymentRecordSchema.index({ collectedAt: -1 });

export const PaymentRecord: Model<IPaymentRecordDocument> =
  mongoose.models.PaymentRecord ||
  mongoose.model<IPaymentRecordDocument>('PaymentRecord', PaymentRecordSchema);

