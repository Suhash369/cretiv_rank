import mongoose, { Schema, Document } from 'mongoose';
import { IOption } from './Question';

export interface IFrozenQuestion {
  questionId: mongoose.Types.ObjectId;
  questionVersion: number;
  question: string;
  questionType: string;
  options: IOption[];
  marks: number;
  section: string;
  skill: string;
}

export interface ISectionScore {
  section: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export interface IAssessmentAttempt extends Document {
  organizationId: mongoose.Types.ObjectId;
  invitationId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  assessmentVersion: number;
  candidateName: string;
  candidateEmail: string;
  startedAt?: Date;
  expiresAt?: Date;
  submittedAt?: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'DISQUALIFIED';
  frozenQuestions: IFrozenQuestion[];
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  suspiciousActivityScore: number; // 0 to 100
  verificationRequired: boolean;
  sectionScores: ISectionScore[];
  identityVerified: boolean;
  identityPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FrozenQuestionSchema = new Schema<IFrozenQuestion>({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  questionVersion: { type: Number, required: true },
  question: { type: String, required: true },
  questionType: { type: String, required: true },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  marks: { type: Number, required: true },
  section: { type: String, required: true },
  skill: { type: String, required: true },
});

const SectionScoreSchema = new Schema<ISectionScore>({
  section: { type: String, required: true },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
});

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invitationId: { type: Schema.Types.ObjectId, ref: 'Invitation', required: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    assessmentVersion: { type: Number, required: true, default: 1 },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    startedAt: { type: Date },
    expiresAt: { type: Date },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED', 'DISQUALIFIED'],
      default: 'NOT_STARTED',
    },
    frozenQuestions: [FrozenQuestionSchema],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    suspiciousActivityScore: { type: Number, default: 0 },
    verificationRequired: { type: Boolean, default: false },
    sectionScores: [SectionScoreSchema],
    identityVerified: { type: Boolean, default: false },
    identityPhotoUrl: { type: String },
  },
  { timestamps: true }
);

AssessmentAttemptSchema.index({ organizationId: 1, assessmentId: 1, status: 1 });

export default mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
