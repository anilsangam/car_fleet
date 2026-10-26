import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAdminAuditLogDocument extends Document {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLogDocument>(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AdminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog: Model<IAdminAuditLogDocument> =
  mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLogDocument>('AdminAuditLog', AdminAuditLogSchema);

