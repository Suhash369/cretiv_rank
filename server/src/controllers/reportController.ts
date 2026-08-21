import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AssessmentAttempt from '../models/AssessmentAttempt';
import Assessment from '../models/Assessment';
import Question from '../models/Question';
import InterviewVerification from '../models/InterviewVerification';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const filter: any = {};
    if (orgId) filter.organizationId = orgId;

    const totalAssessments = await Assessment.countDocuments(filter);
    const activeAssessments = await Assessment.countDocuments({ ...filter, state: 'PUBLISHED' });

    const attempts = await AssessmentAttempt.find(filter);
    const totalCandidates = attempts.length;
    const completedAttempts = attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED');

    let totalScoreSum = 0;
    let passedCount = 0;
    let suspiciousCount = 0;

    completedAttempts.forEach((att) => {
      totalScoreSum += att.percentage || 0;
      if (att.percentage >= 60) passedCount++;
      if (att.suspiciousActivityScore >= 20) suspiciousCount++;
    });

    const averageScore = completedAttempts.length > 0 ? Number((totalScoreSum / completedAttempts.length).toFixed(1)) : 0;
    const passRate = completedAttempts.length > 0 ? Number(((passedCount / completedAttempts.length) * 100).toFixed(1)) : 0;

    const pendingVerifications = await InterviewVerification.countDocuments({ ...filter });

    // Score distribution buckets: 0-20, 21-40, 41-60, 61-80, 81-100
    const distribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];

    completedAttempts.forEach((att) => {
      const p = att.percentage || 0;
      if (p <= 20) distribution[0].count++;
      else if (p <= 40) distribution[1].count++;
      else if (p <= 60) distribution[2].count++;
      else if (p <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    return res.json({
      summary: {
        totalAssessments,
        activeAssessments,
        completedAssessments: completedAttempts.length,
        totalCandidates,
        averageScore,
        passRate,
        pendingVerifications,
        suspiciousAttempts: suspiciousCount,
      },
      distribution,
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to generate dashboard summary metrics.' });
  }
};

export const getCandidateResults = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const attempts = await AssessmentAttempt.find({ organizationId: orgId })
      .populate('assessmentId', 'name jobRole')
      .sort({ createdAt: -1 });

    return res.json({ attempts });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve candidate results list.' });
  }
};
