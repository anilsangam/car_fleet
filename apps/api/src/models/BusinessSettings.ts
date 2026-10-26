import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBusinessSettingsDocument extends Document {
  businessName: string;
  tagline: string;
  logoUrl?: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  operatingHours: string;
  serviceAreas: string[];
  defaultCurrency: string;
  currencySymbol: string;
  timezone: string;
  bufferMinutesBetweenTrips: number;
  advanceBookingHoursRequired: number;
  cancellationPolicyText: string;
  termsAndConditionsText: string;
  privacyPolicyText: string;
  cashPaymentInstructions: string;
  discloseDriverHoursBeforePickup: number;
  autoDiscloseDriverOnConfirm: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema<IBusinessSettingsDocument>(
  {
    businessName: { type: String, required: true, default: 'EliteRide Car Fleet' },
    tagline: {
      type: String,
      default: 'Chauffeur-Driven Luxury & Outstation Car Rentals',
    },
    logoUrl: { type: String },
    supportPhone: { type: String, required: true, default: '+91 98765 43210' },
    supportEmail: { type: String, required: true, default: 'support@eliteride.com' },
    officeAddress: {
      type: String,
      required: true,
      default: 'Plot 42, Aerocity Commercial Hub, New Delhi, 110037',
    },
    operatingHours: { type: String, default: '24 Hours, 7 Days a Week' },
    serviceAreas: {
      type: [String],
      default: ['Delhi NCR', 'Jaipur', 'Agra', 'Chandigarh', 'Dehradun', 'Shimla'],
    },
    defaultCurrency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    bufferMinutesBetweenTrips: { type: Number, default: 60, min: 15 },
    advanceBookingHoursRequired: { type: Number, default: 2, min: 0 },
    cancellationPolicyText: {
      type: String,
      default:
        'Cancellations are accepted without fee up to 4 hours before scheduled pickup. As bookings are cash-settled directly with the driver, no advance card refunds are required. Please notify dispatch promptly for schedule adjustments.',
    },
    termsAndConditionsText: {
      type: String,
      default:
        'All vehicle bookings include a licensed commercial chauffeur. State tolls, parking, and state entry permits are settled directly in cash unless specified in the fixed quote. Smoking and contraband are strictly prohibited inside fleet vehicles.',
    },
    privacyPolicyText: {
      type: String,
      default:
        'Customer contact details and trip coordinates are strictly retained for reservation fulfillment and safety dispatching. No personal information is sold or marketed to third parties.',
    },
    cashPaymentInstructions: {
      type: String,
      default:
        'Payment Model: 100% Cash on arrival/completion. Pay the exact confirmed fare to your assigned chauffeur upon vehicle arrival or trip completion. Driver will provide a stamped trip receipt.',
    },
    discloseDriverHoursBeforePickup: { type: Number, default: 3 },
    autoDiscloseDriverOnConfirm: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const BusinessSettings: Model<IBusinessSettingsDocument> =
  mongoose.models.BusinessSettings ||
  mongoose.model<IBusinessSettingsDocument>('BusinessSettings', BusinessSettingsSchema);

