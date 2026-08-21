import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AssessmentAttempt from '../models/AssessmentAttempt';
import Assessment from '../models/Assessment';
import Question from '../models/Question';
import InterviewVerification from '../models/InterviewVerification';
import Answer from '../models/Answer';
import AuditLog from '../models/AuditLog';

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

export const updateManualAnswerGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { questionId, score, isCorrect } = req.body;
    const user = req.user;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Candidate attempt not found.' });

    // Find frozen question to get max marks
    const fq = attempt.frozenQuestions.find(
      (q: any) => q.questionId.toString() === questionId.toString()
    );

    const maxMarks = fq ? fq.marks : 10;
    const assignedScore = Math.max(0, Math.min(Number(score) || 0, maxMarks));
    const assignedIsCorrect = typeof isCorrect === 'boolean' ? isCorrect : assignedScore > 0;

    let ansDoc = await Answer.findOne({ attemptId, questionId });
    if (!ansDoc) {
      ansDoc = await Answer.create({
        attemptId: attempt._id,
        questionId,
        questionVersion: fq ? fq.questionVersion : 1,
        answer: 'Manually Reviewed / Evaluated by Recruiter',
        isCorrect: assignedIsCorrect,
        score: assignedScore,
        timeSpent: 0,
      });
    } else {
      ansDoc.isCorrect = assignedIsCorrect;
      ansDoc.score = assignedScore;
      await ansDoc.save();
    }

    // Recalculate candidate overall scores and section breakdown
    const allAnswers = await Answer.find({ attemptId });
    const answerMap = new Map<string, any>();
    allAnswers.forEach((ans) => answerMap.set(ans.questionId.toString(), ans));

    let totalScore = 0;
    let maxScoreTotal = 0;
    let totalAnsweredCount = 0;
    let correctCountTotal = 0;

    const sectionMap = new Map<
      string,
      { score: number; maxScore: number; correct: number; incorrect: number; unanswered: number }
    >();

    for (const item of attempt.frozenQuestions) {
      const qIdStr = item.questionId.toString();
      const qMarks = item.marks || 1;
      maxScoreTotal += qMarks;

      if (!sectionMap.has(item.section)) {
        sectionMap.set(item.section, { score: 0, maxScore: 0, correct: 0, incorrect: 0, unanswered: 0 });
      }
      const secStats = sectionMap.get(item.section)!;
      secStats.maxScore += qMarks;

      const aDoc = answerMap.get(qIdStr);
      if (!aDoc || aDoc.answer === null || aDoc.answer === undefined || aDoc.answer === '') {
        secStats.unanswered++;
      } else {
        totalAnsweredCount++;
        const itemScore = aDoc.score || 0;
        const itemCorrect = aDoc.isCorrect;

        secStats.score += itemScore;
        totalScore += itemScore;

        if (itemCorrect) {
          secStats.correct++;
          correctCountTotal++;
        } else {
          secStats.incorrect++;
        }
      }
    }

    attempt.score = totalScore;
    attempt.maxScore = maxScoreTotal;
    attempt.percentage = maxScoreTotal > 0 ? Number(((totalScore / maxScoreTotal) * 100).toFixed(2)) : 0;
    attempt.accuracy = totalAnsweredCount > 0 ? Number(((correctCountTotal / totalAnsweredCount) * 100).toFixed(2)) : 0;

    attempt.sectionScores = Array.from(sectionMap.entries()).map(([secName, stats]) => ({
      section: secName,
      score: stats.score,
      maxScore: stats.maxScore,
      correctCount: stats.correct,
      incorrectCount: stats.incorrect,
      unansweredCount: stats.unanswered,
    }));

    await attempt.save();

    await AuditLog.create({
      organizationId: attempt.organizationId,
      actorId: user?.id,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: 'MANUAL_GRADE_ANSWER',
      entity: 'AssessmentAttempt',
      entityId: (attempt._id as any).toString(),
      details: { questionId, assignedScore, assignedIsCorrect, newTotalScore: totalScore },
    });

    const updatedAnswers = await Answer.find({ attemptId });

    return res.json({
      message: 'Manual answer grade updated successfully.',
      attempt,
      answers: updatedAnswers,
    });
  } catch (error: any) {
    console.error('Manual grade error:', error);
    return res.status(500).json({ error: 'Failed to update manual answer grade.' });
  }
};
