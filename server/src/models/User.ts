import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'INTERVIEWER' | 'CANDIDATE';
  organizationId?: mongoose.Types.ObjectId;
  jobRole?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER', 'CANDIDATE'],
      default: 'ORG_ADMIN',
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    jobRole: { type: String, default: 'Recruiter' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
