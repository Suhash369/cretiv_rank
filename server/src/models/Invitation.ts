import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  token: string;
  organizationId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  jobRole: string;
  scheduleStartTime?: Date;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
  usedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  emailSent?: boolean;
  emailSentCount?: number;
  lastEmailSentAt?: Date;
  lastEmailPreviewUrl?: string;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    token: { type: String, required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    jobRole: { type: String, required: true, trim: true },
    scheduleStartTime: { type: Date },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'REVOKED'],
      default: 'PENDING',
    },
    usedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emailSent: { type: Boolean, default: false },
    emailSentCount: { type: Number, default: 0 },
    lastEmailSentAt: { type: Date },
    lastEmailPreviewUrl: { type: String },
  },
  { timestamps: true }
);

InvitationSchema.index({ organizationId: 1, candidateEmail: 1 });

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);
