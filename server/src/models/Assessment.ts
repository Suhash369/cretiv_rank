import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentSection {
  name: string;
  questionCount: number;
  questionIds?: mongoose.Types.ObjectId[];
  poolSkillFilter?: string;
}

export interface IAssessmentSecuritySettings {
  webcamRequired: boolean;
  micRequired: boolean;
  identityVerification: boolean;
  fullscreenRequired: boolean;
}

export interface IAssessment extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  jobRole: string;
  duration: number; // in minutes
  passingScorePercentage: number;
  attemptLimit: number;
  startDate?: Date;
  endDate?: Date;
  navigationMode: 'FREE' | 'NEXT_ONLY' | 'SECTION_LOCKED' | 'NO_RETURN';
  questionRandomization: boolean;
  optionRandomization: boolean;
  sections: IAssessmentSection[];
  security: IAssessmentSecuritySettings;
  state: 'DRAFT' | 'READY' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  version: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSectionSchema = new Schema<IAssessmentSection>({
  name: { type: String, required: true },
  questionCount: { type: Number, required: true, default: 5 },
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  poolSkillFilter: { type: String, default: '' },
});

const AssessmentSecuritySchema = new Schema<IAssessmentSecuritySettings>({
  webcamRequired: { type: Boolean, default: true },
  micRequired: { type: Boolean, default: false },
  identityVerification: { type: Boolean, default: true },
  fullscreenRequired: { type: Boolean, default: true },
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    jobRole: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, default: 60 },
    passingScorePercentage: { type: Number, required: true, default: 60 },
    attemptLimit: { type: Number, default: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    navigationMode: {
      type: String,
      enum: ['FREE', 'NEXT_ONLY', 'SECTION_LOCKED', 'NO_RETURN'],
      default: 'FREE',
    },
    questionRandomization: { type: Boolean, default: true },
    optionRandomization: { type: Boolean, default: true },
    sections: [AssessmentSectionSchema],
    security: { type: AssessmentSecuritySchema, default: () => ({}) },
    state: {
      type: String,
      enum: ['DRAFT', 'READY', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AssessmentSchema.index({ organizationId: 1, state: 1 });

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
