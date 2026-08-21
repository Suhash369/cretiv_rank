import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logProctoringEvent, getAttemptProctoringTimeline } from '../services/proctoringService';
import AssessmentAttempt from '../models/AssessmentAttempt';

export const recordProctoringEvent = async (req: AuthRequest, res: Response) => {
  try {
    const candidateContext = req.candidateAttempt;
    if (!candidateContext) return res.status(401).json({ error: 'Candidate session context required.' });

    const { eventType, severity, duration, evidenceReference, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type is required.' });
    }

    const event = await logProctoringEvent({
      attemptId: candidateContext.attemptId,
      eventType,
      severity: severity || 'LOW',
      duration,
      evidenceReference,
      metadata,
    });

    return res.status(201).json({ success: true, event });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to log proctoring event.' });
  }
};

export const getAttemptProctoringEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Assessment attempt not found.' });

    const timeline = await getAttemptProctoringTimeline(attemptId);
    return res.json({
      attemptId,
      candidateName: attempt.candidateName,
      suspiciousActivityScore: attempt.suspiciousActivityScore,
      events: timeline,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch proctoring events.' });
  }
};
