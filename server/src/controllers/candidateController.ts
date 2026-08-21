import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CANDIDATE_JWT_SECRET } from '../config/constants';
import Invitation from '../models/Invitation';
import Assessment from '../models/Assessment';
import Question from '../models/Question';
import AssessmentAttempt, { IFrozenQuestion } from '../models/AssessmentAttempt';
import Answer from '../models/Answer';
import { evaluateAttemptAnswers } from '../services/scoringService';
import { AuthRequest } from '../middleware/auth';
import { uploadImageToCloudinary, processAnswerCloudinaryMedia } from '../config/cloudinary';

// Utility to shuffle an array (Fisher-Yates)
const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate(
      'assessmentId',
      'name description jobRole duration passingScorePercentage navigationMode security'
    );

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or revoked assessment invitation link.' });
    }

    if (invitation.status === 'REVOKED' || invitation.status === 'EXPIRED') {
      return res.status(410).json({ error: 'This assessment invitation is no longer active.' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(410).json({ error: 'This assessment invitation has expired.' });
    }

    const now = new Date();
    if (invitation.scheduleStartTime && now < invitation.scheduleStartTime) {
      const remainingSecondsUntilStart = Math.max(0, Math.floor((invitation.scheduleStartTime.getTime() - now.getTime()) / 1000));
      return res.json({
        invitation,
        isScheduledFuture: true,
        scheduleStartTime: invitation.scheduleStartTime,
        remainingSecondsUntilStart,
      });
    }

    return res.json({ invitation, isScheduledFuture: false });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error validating invitation link.' });
  }
};

export const startAttempt = async (req: Request, res: Response) => {
  try {
    const { token, identityPhotoUrl } = req.body;
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token.' });
    }

    if (invitation.scheduleStartTime && new Date() < invitation.scheduleStartTime) {
      return res.status(403).json({ error: 'This assessment is scheduled for a future time window and has not opened yet.' });
    }

    if (invitation.status === 'COMPLETED') {
      return res.status(400).json({ error: 'You have already completed this assessment.' });
    }

    const assessment = await Assessment.findById(invitation.assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment configuration not found.' });
    }

    // Check if an attempt is already in progress (Resume capability without timer reset!)
    let attempt = await AssessmentAttempt.findOne({
      invitationId: invitation._id,
      status: 'IN_PROGRESS',
    });

    if (!attempt) {
      // Build Frozen Question Set
      const frozenQuestions: IFrozenQuestion[] = [];

      for (const section of assessment.sections) {
        // Flexible Section Query (Exact match or composite name match)
        const parts = section.name.split(/&|\/|and/).map((p) => p.trim()).filter(Boolean);
        const regexFilter = parts.join('|');

        let poolQuestions = await Question.find({
          organizationId: assessment.organizationId,
          status: 'ACTIVE',
          $or: [
            { section: section.name },
            { section: { $regex: new RegExp(regexFilter, 'i') } },
          ],
        });

        if (poolQuestions.length < section.questionCount) {
          return res.status(400).json({
            error: `Insufficient questions in bank for section ${section.name}. Contact recruiter.`,
          });
        }

        // Randomize questions within pool if enabled
        if (assessment.questionRandomization) {
          poolQuestions = shuffleArray(poolQuestions);
        }

        const selected = poolQuestions.slice(0, section.questionCount);

        selected.forEach((q) => {
          let opts = q.options.map((o) => ({ id: o.id, text: o.text }));
          if (assessment.optionRandomization && opts.length > 0) {
            opts = shuffleArray(opts);
          }

          // STRICT SECURITY RULE 3 & 5: Strip out correctAnswer, difficulty, explanation!
          frozenQuestions.push({
            questionId: q._id as any,
            questionVersion: q.currentVersion,
            question: q.question,
            questionType: q.questionType,
            options: opts,
            marks: q.marks,
            section: q.section,
            skill: q.skill,
          });
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + assessment.duration * 60 * 1000);

      // Upload Identity Photo Snapshot to Cloudinary Cloud Storage
      let uploadedIdentityUrl = identityPhotoUrl || '';
      if (identityPhotoUrl && identityPhotoUrl.startsWith('data:image')) {
        uploadedIdentityUrl = await uploadImageToCloudinary(identityPhotoUrl, 'candidate_identities');
      }

      attempt = await AssessmentAttempt.create({
        organizationId: assessment.organizationId,
        invitationId: invitation._id,
        assessmentId: assessment._id,
        assessmentVersion: assessment.version,
        candidateName: invitation.candidateName,
        candidateEmail: invitation.candidateEmail,
        startedAt: now,
        expiresAt: expiresAt,
        status: 'IN_PROGRESS',
        frozenQuestions,
        identityVerified: !!uploadedIdentityUrl,
        identityPhotoUrl: uploadedIdentityUrl,
      });

      invitation.status = 'ACCEPTED';
      await invitation.save();
    }

    // Generate Candidate JWT Session Token
    const candidateSessionToken = jwt.sign(
      {
        attemptId: attempt._id,
        invitationId: invitation._id,
        assessmentId: assessment._id,
        organizationId: assessment.organizationId,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
      },
      CANDIDATE_JWT_SECRET,
      { expiresIn: `${assessment.duration + 30}m` }
    );

    // Calculate remaining seconds
    const nowMs = Date.now();
    const remainingSeconds = Math.max(0, Math.floor(((attempt.expiresAt as Date).getTime() - nowMs) / 1000));

    // Retrieve already saved candidate answers (for resume)
    const savedAnswersList = await Answer.find({ attemptId: attempt._id });
    const savedAnswersMap: Record<string, any> = {};
    savedAnswersList.forEach((ans) => {
      savedAnswersMap[ans.questionId.toString()] = ans.answer;
    });

    return res.json({
      token: candidateSessionToken,
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      remainingSeconds,
      assessment: {
        id: assessment._id,
        name: assessment.name,
        description: assessment.description,
        duration: assessment.duration,
        navigationMode: assessment.navigationMode,
        security: assessment.security,
      },
      questions: attempt.frozenQuestions, // Contains ZERO difficulty/correctAnswer/explanation!
      savedAnswers: savedAnswersMap,
    });
  } catch (error: any) {
    console.error('Start attempt error:', error);
    return res.status(500).json({ error: 'Failed to initialize assessment room.' });
  }
};

export const saveAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const candidateContext = req.candidateAttempt;
    if (!candidateContext) return res.status(401).json({ error: 'Unauthorized attempt context.' });

    const { questionId, questionVersion, answer, timeSpent } = req.body;
    const attempt = await AssessmentAttempt.findById(candidateContext.attemptId);

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Assessment is no longer in progress.' });
    }

    // Check timer expiration
    if (new Date() > (attempt.expiresAt as Date)) {
      attempt.status = 'EXPIRED';
      await attempt.save();
      await evaluateAttemptAnswers(attempt);
      return res.status(403).json({ error: 'Assessment duration expired.', isExpired: true });
    }

    // Process Candidate Answer media (code screenshots, drawing diagrams, image uploads) to Cloudinary
    const { answer: processedAnswer, mediaUrl: answerCloudinaryUrl } = await processAnswerCloudinaryMedia(answer);

    // Save or update answer doc
    await Answer.findOneAndUpdate(
      { attemptId: attempt._id, questionId },
      {
        attemptId: attempt._id,
        questionId,
        questionVersion: questionVersion || 1,
        answer: processedAnswer,
        mediaUrl: answerCloudinaryUrl,
        cloudinaryUrl: answerCloudinaryUrl,
        answeredAt: new Date(),
        $inc: { timeSpent: Math.max(0, parseInt(timeSpent, 10) || 1) },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, savedAt: new Date() });
  } catch (error: any) {
    return res.status(500).json({ error: 'Autosave answer error.' });
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const candidateContext = req.candidateAttempt;
    if (!candidateContext) return res.status(401).json({ error: 'Unauthorized attempt context.' });

    const attempt = await AssessmentAttempt.findById(candidateContext.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      return res.json({ message: 'Assessment was already submitted.', attempt });
    }

    attempt.submittedAt = new Date();
    attempt.status = 'SUBMITTED';

    // Calculate score using Scoring Service (NO NEGATIVE MARKING)
    await evaluateAttemptAnswers(attempt);
    await attempt.save();

    // Mark invitation completed
    await Invitation.findByIdAndUpdate(candidateContext.invitationId, {
      status: 'COMPLETED',
      usedAt: new Date(),
    });

    return res.json({
      message: 'Assessment submitted successfully.',
      submissionId: attempt._id,
      submittedAt: attempt.submittedAt,
    });
  } catch (error: any) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ error: 'Failed to submit assessment.' });
  }
};

export const getCurrentCandidateAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const candidateContext = req.candidateAttempt;
    if (!candidateContext) return res.status(401).json({ error: 'Unauthorized attempt context.' });

    const attempt = await AssessmentAttempt.findById(candidateContext.attemptId);
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'No active assessment attempt in progress.' });
    }

    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment configuration not found.' });

    const nowMs = Date.now();
    const remainingSeconds = Math.max(0, Math.floor(((attempt.expiresAt as Date).getTime() - nowMs) / 1000));

    const savedAnswersList = await Answer.find({ attemptId: attempt._id });
    const savedAnswersMap: Record<string, any> = {};
    savedAnswersList.forEach((ans) => {
      savedAnswersMap[ans.questionId.toString()] = ans.answer;
    });

    return res.json({
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      remainingSeconds,
      assessment: {
        id: assessment._id,
        name: assessment.name,
        description: assessment.description,
        duration: assessment.duration,
        navigationMode: assessment.navigationMode,
        security: assessment.security,
      },
      questions: attempt.frozenQuestions,
      savedAnswers: savedAnswersMap,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch active attempt session.' });
  }
};
