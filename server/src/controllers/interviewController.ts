import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import InterviewVerification from '../models/InterviewVerification';
import AssessmentAttempt from '../models/AssessmentAttempt';
import Answer from '../models/Answer';
import AuditLog from '../models/AuditLog';

export const getAssignedInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const attempts = await AssessmentAttempt.find({
      organizationId: orgId,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    })
      .populate('assessmentId', 'name jobRole')
      .sort({ updatedAt: -1 });

    const verifications = await InterviewVerification.find({ organizationId: orgId });
    const verifiedMap = new Map<string, any>();
    verifications.forEach((v) => verifiedMap.set(v.attemptId.toString(), v));

    const candidatesList = attempts.map((att) => {
      const v = verifiedMap.get((att._id as any).toString());
      return {
        attemptId: att._id,
        candidateName: att.candidateName,
        candidateEmail: att.candidateEmail,
        assessmentName: (att.assessmentId as any)?.name || 'Assessment',
        jobRole: (att.assessmentId as any)?.jobRole || 'Applicant',
        score: att.score,
        maxScore: att.maxScore,
        percentage: att.percentage,
        suspiciousActivityScore: att.suspiciousActivityScore,
        submittedAt: att.submittedAt,
        interviewStatus: v ? 'COMPLETED' : 'PENDING_VERIFICATION',
        verificationDetails: v || null,
      };
    });

    return res.json({ candidates: candidatesList });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch assigned interviews list.' });
  }
};

export const getCandidateInterviewDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const attempt = await AssessmentAttempt.findById(attemptId).populate('assessmentId');
    if (!attempt) return res.status(404).json({ error: 'Assessment attempt not found.' });

    const answers = await Answer.find({ attemptId }).populate('questionId');
    const existingVerification = await InterviewVerification.findOne({ attemptId });

    return res.json({
      attempt,
      answers,
      verification: existingVerification || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve candidate interview details.' });
  }
};

export const submitVerificationInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId, selectedQuestionIds, ratings, recommendation, notes } = req.body;
    const user = req.user;

    if (!attemptId || !selectedQuestionIds || !ratings || !recommendation) {
      return res.status(400).json({ error: 'Missing mandatory interview verification payload fields.' });
    }

    if (!Array.isArray(selectedQuestionIds) || selectedQuestionIds.length < 1) {
      return res.status(400).json({ error: 'At least 1 to 5 questions must be selected for verification defense.' });
    }

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Candidate attempt record not found.' });

    // Calculate total verification score percentage
    const { technicalUnderstanding, problemSolving, communication, confidence } = ratings;
    const totalPoints = technicalUnderstanding + problemSolving + communication + confidence;
    const verificationScore = Number(((totalPoints / 20) * 100).toFixed(2));

    const verificationDoc = await InterviewVerification.findOneAndUpdate(
      { attemptId },
      {
        organizationId: attempt.organizationId,
        attemptId: attempt._id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        interviewerId: user?.id,
        interviewerName: user?.name || 'Interviewer',
        selectedQuestionIds,
        ratings: {
          technicalUnderstanding,
          problemSolving,
          communication,
          confidence,
          verificationScore,
        },
        recommendation,
        notes: notes || '',
        completedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    attempt.verificationRequired = true;
    await attempt.save();

    await AuditLog.create({
      organizationId: attempt.organizationId,
      actorId: user?.id,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: 'SUBMIT_VERIFICATION_INTERVIEW',
      entity: 'InterviewVerification',
      entityId: (verificationDoc._id as any).toString(),
      details: { candidateEmail: attempt.candidateEmail, recommendation, verificationScore },
    });

    return res.status(200).json({
      message: 'Verification interview evaluation submitted successfully.',
      verification: verificationDoc,
    });
  } catch (error: any) {
    console.error('Interview submission error:', error);
    return res.status(500).json({ error: 'Failed to submit verification interview report.' });
  }
};
