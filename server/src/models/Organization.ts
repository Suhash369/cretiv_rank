import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  domain: string;
  status: 'ACTIVE' | 'SUSPENDED';
  dataRetentionDays: number;
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    dataRetentionDays: { type: Number, default: 90 },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
