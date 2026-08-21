import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  organizationId: mongoose.Types.ObjectId;
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
  tags: string[]; // ADMIN-ONLY
  status: 'ACTIVE' | 'ARCHIVED';
  currentVersion: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>({
  id: { type: String, required: true },
  text: { type: String, required: true },
});

const QuestionSchema = new Schema<IQuestion>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    question: { type: String, required: true, trim: true },
    questionType: { type: String, required: true },
    options: [OptionSchema],
    correctAnswer: { type: Schema.Types.Mixed, required: true }, // A, B, C, D or exact string
    marks: { type: Number, required: true, default: 1, min: 1 },
    section: { type: String, required: true, trim: true },
    skill: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'],
      required: true,
      default: 'Medium',
    },
    explanation: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    tags: [{ type: String }],
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    currentVersion: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ organizationId: 1, section: 1, skill: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);
