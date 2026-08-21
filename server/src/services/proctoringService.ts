import ProctoringEvent, { IProctoringEvent } from '../models/ProctoringEvent';
import AssessmentAttempt from '../models/AssessmentAttempt';

const SEVERITY_WEIGHTS: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
  LOW: 3,
  MEDIUM: 10,
  HIGH: 25,
};

export const logProctoringEvent = async (params: {
  attemptId: string;
  eventType: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  duration?: number;
  evidenceReference?: string;
  metadata?: Record<string, any>;
}): Promise<IProctoringEvent> => {
  const event = await ProctoringEvent.create({
    attemptId: params.attemptId,
    eventType: params.eventType,
    severity: params.severity,
    duration: params.duration || 0,
    evidenceReference: params.evidenceReference,
    metadata: params.metadata,
    timestamp: new Date(),
  });

  // Calculate cumulative suspicious activity score
  const attempt = await AssessmentAttempt.findById(params.attemptId);
  if (attempt) {
    const points = SEVERITY_WEIGHTS[params.severity] || 3;
    attempt.suspiciousActivityScore = Math.min(100, (attempt.suspiciousActivityScore || 0) + points);
    await attempt.save();
  }

  return event;
};

export const getAttemptProctoringTimeline = async (attemptId: string) => {
  return ProctoringEvent.find({ attemptId }).sort({ timestamp: 1 });
};
