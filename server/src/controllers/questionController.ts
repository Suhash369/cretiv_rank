import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Question from '../models/Question';
import QuestionVersion from '../models/QuestionVersion';
import AuditLog from '../models/AuditLog';
import { processQuestionCloudinaryMedia } from '../config/cloudinary';

export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { section, skill, difficulty, search, questionType, status } = req.query;
    const orgId = req.user?.organizationId;

    const filter: any = {};
    if (orgId) filter.organizationId = orgId;
    if (status) filter.status = status;
    else filter.status = 'ACTIVE';

    if (section) filter.section = section;
    if (skill) filter.skill = skill;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;
    if (search) {
      filter.question = { $regex: String(search), $options: 'i' };
    }

    const questions = await Question.find(filter).sort({ updatedAt: -1 });
    return res.json({ questions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { question, questionType, options, correctAnswer, marks, section, skill, difficulty, explanation, tags, imageUrl, mediaUrl } =
      req.body;

    if (!question || !questionType || !section || !skill || !correctAnswer) {
      return res.status(400).json({ error: 'Missing required question fields.' });
    }

    const orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID missing from user context.' });
    }

    // Process Question Media and Upload to Cloudinary Cloud Storage
    const processed = await processQuestionCloudinaryMedia({
      question,
      options: options || [],
      imageUrl,
      mediaUrl,
    });

    const newQuestion = await Question.create({
      organizationId: orgId,
      question: processed.question,
      questionType,
      options: processed.options || [],
      correctAnswer,
      marks: Math.max(1, parseInt(marks, 10) || 1),
      section,
      skill,
      difficulty: difficulty || 'Medium',
      explanation: explanation || '',
      imageUrl: processed.imageUrl || '',
      mediaUrl: processed.mediaUrl || '',
      tags: tags || [],
      currentVersion: 1,
      createdBy: req.user?.id,
    });

    // Create Immutable Version 1
    await QuestionVersion.create({
      questionId: newQuestion._id,
      version: 1,
      question: newQuestion.question,
      questionType: newQuestion.questionType,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      marks: newQuestion.marks,
      section: newQuestion.section,
      skill: newQuestion.skill,
      difficulty: newQuestion.difficulty,
      explanation: newQuestion.explanation,
      createdBy: req.user?.id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'CREATE_QUESTION',
      entity: 'Question',
      entityId: (newQuestion._id as any).toString(),
      details: { questionText: newQuestion.question, section: newQuestion.section },
    });

    return res.status(201).json({ question: newQuestion });
  } catch (error: any) {
    console.error('Create question error:', error);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question, questionType, options, correctAnswer, marks, section, skill, difficulty, explanation, tags } =
      req.body;

    const existing = await Question.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    // Increment version
    const newVersionNumber = existing.currentVersion + 1;

    existing.question = question || existing.question;
    existing.questionType = questionType || existing.questionType;
    existing.options = options || existing.options;
    existing.correctAnswer = correctAnswer !== undefined ? correctAnswer : existing.correctAnswer;
    existing.marks = marks ? Math.max(1, parseInt(marks, 10)) : existing.marks;
    existing.section = section || existing.section;
    existing.skill = skill || existing.skill;
    existing.difficulty = difficulty || existing.difficulty;
    existing.explanation = explanation !== undefined ? explanation : existing.explanation;
    existing.tags = tags || existing.tags;
    existing.currentVersion = newVersionNumber;

    await existing.save();

    // Create Immutable Version record for audit tracking
    await QuestionVersion.create({
      questionId: existing._id,
      version: newVersionNumber,
      question: existing.question,
      questionType: existing.questionType,
      options: existing.options,
      correctAnswer: existing.correctAnswer,
      marks: existing.marks,
      section: existing.section,
      skill: existing.skill,
      difficulty: existing.difficulty,
      explanation: existing.explanation,
      createdBy: req.user?.id,
    });

    await AuditLog.create({
      organizationId: existing.organizationId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'UPDATE_QUESTION_VERSION',
      entity: 'Question',
      entityId: (existing._id as any).toString(),
      details: { version: newVersionNumber },
    });

    return res.json({ question: existing, versionCreated: newVersionNumber });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update question.' });
  }
};

export const getQuestionVersionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const versions = await QuestionVersion.find({ questionId: id }).sort({ version: -1 });
    return res.json({ versions });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve version history.' });
  }
};

export const archiveQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    question.status = 'ARCHIVED';
    await question.save();

    return res.json({ message: 'Question archived successfully.', question });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to archive question.' });
  }
};
