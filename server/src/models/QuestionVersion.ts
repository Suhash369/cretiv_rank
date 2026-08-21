import mongoose, { Schema, Document } from 'mongoose';
import { IOption } from './Question';

export interface IQuestionVersion extends Document {
  questionId: mongoose.Types.ObjectId;
  version: number;
  question: string;
  questionType: string;
  options: IOption[];
  correctAnswer: any; // ADMIN-ONLY
  marks: number;
  section: string;
  skill: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Expert'; // ADMIN-ONLY
  explanation?: string; // ADMIN-ONLY
  imageUrl?: string;
  mediaUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OptionSchema = new Schema<IOption>({
  id: { type: String, required: true },
  text: { type: String, required: true },
});

const QuestionVersionSchema = new Schema<IQuestionVersion>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    version: { type: Number, required: true },
    question: { type: String, required: true },
    questionType: { type: String, required: true },
    options: [OptionSchema],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    marks: { type: Number, required: true },
    section: { type: String, required: true },
    skill: { type: String, required: true },
    difficulty: { type: String, required: true },
    explanation: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

QuestionVersionSchema.index({ questionId: 1, version: 1 }, { unique: true });

export default mongoose.model<IQuestionVersion>('QuestionVersion', QuestionVersionSchema);
