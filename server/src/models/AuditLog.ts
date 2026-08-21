import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  organizationId?: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId | string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    actorId: { type: Schema.Types.Mixed, required: true },
    actorEmail: { type: String },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ organizationId: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
