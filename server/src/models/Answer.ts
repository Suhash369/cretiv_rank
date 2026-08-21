import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  attemptId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  questionVersion: number;
  answer: any;
  isCorrect: boolean;
  score: number;
  startedAt?: Date;
  answeredAt?: Date;
  timeSpent: number; // in seconds
  mediaUrl?: string;
  cloudinaryUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    questionVersion: { type: Number, required: true },
    answer: { type: Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    startedAt: { type: Date },
    answeredAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
    mediaUrl: { type: String, default: '' },
    cloudinaryUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

AnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export default mongoose.model<IAnswer>('Answer', AnswerSchema);
