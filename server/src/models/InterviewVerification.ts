import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewRatings {
  technicalUnderstanding: number; // 1-5
  problemSolving: number; // 1-5
  communication: number; // 1-5
  confidence: number; // 1-5
  verificationScore: number; // calculated percentage (0-100)
}

export interface IInterviewVerification extends Document {
  organizationId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  interviewerId: mongoose.Types.ObjectId;
  interviewerName: string;
  selectedQuestionIds: mongoose.Types.ObjectId[];
  ratings: IInterviewRatings;
  recommendation: 'STRONG HIRE' | 'HIRE' | 'BORDERLINE' | 'REJECT';
  notes: string;
  completedAt: Date;
  createdAt: Date;
}

const RatingsSchema = new Schema<IInterviewRatings>({
  technicalUnderstanding: { type: Number, required: true, min: 1, max: 5 },
  problemSolving: { type: Number, required: true, min: 1, max: 5 },
  communication: { type: Number, required: true, min: 1, max: 5 },
  confidence: { type: Number, required: true, min: 1, max: 5 },
  verificationScore: { type: Number, required: true, default: 0 },
});

const InterviewVerificationSchema = new Schema<IInterviewVerification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, unique: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interviewerName: { type: String, required: true },
    selectedQuestionIds: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
    ratings: { type: RatingsSchema, required: true },
    recommendation: {
      type: String,
      enum: ['STRONG HIRE', 'HIRE', 'BORDERLINE', 'REJECT'],
      required: true,
    },
    notes: { type: String, default: '' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewVerification>('InterviewVerification', InterviewVerificationSchema);
