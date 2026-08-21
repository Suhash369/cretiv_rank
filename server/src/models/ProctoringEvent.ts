import mongoose, { Schema, Document } from 'mongoose';

export interface IProctoringEvent extends Document {
  attemptId: mongoose.Types.ObjectId;
  eventType:
    | 'TAB_SWITCH'
    | 'WINDOW_BLUR'
    | 'WINDOW_FOCUS'
    | 'FULLSCREEN_EXIT'
    | 'FACE_NOT_VISIBLE'
    | 'MULTIPLE_FACES_DETECTED'
    | 'CAMERA_DISCONNECTED'
    | 'CANDIDATE_LEFT_FRAME'
    | 'COPY_ATTEMPT'
    | 'PASTE_ATTEMPT'
    | 'CUT_ATTEMPT'
    | 'RIGHT_CLICK'
    | 'VPN_DETECTED'
    | 'PROXY_DETECTED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Date;
  duration?: number; // in seconds
  evidenceReference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ProctoringEventSchema = new Schema<IProctoringEvent>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'TAB_SWITCH',
        'WINDOW_BLUR',
        'WINDOW_FOCUS',
        'FULLSCREEN_EXIT',
        'FACE_NOT_VISIBLE',
        'MULTIPLE_FACES_DETECTED',
        'CAMERA_DISCONNECTED',
        'CANDIDATE_LEFT_FRAME',
        'COPY_ATTEMPT',
        'PASTE_ATTEMPT',
        'CUT_ATTEMPT',
        'RIGHT_CLICK',
        'VPN_DETECTED',
        'PROXY_DETECTED',
      ],
      required: true,
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    evidenceReference: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IProctoringEvent>('ProctoringEvent', ProctoringEventSchema);
