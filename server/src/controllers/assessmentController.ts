import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Assessment from '../models/Assessment';
import Question from '../models/Question';
import AuditLog from '../models/AuditLog';

export const getAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const filter: any = {};
    if (orgId) filter.organizationId = orgId;

    const assessments = await Assessment.find(filter).sort({ updatedAt: -1 });
    return res.json({ assessments });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve assessments.' });
  }
};

export const getAssessmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    return res.json({ assessment });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch assessment details.' });
  }
};

export const createAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      jobRole,
      duration,
      passingScorePercentage,
      navigationMode,
      questionRandomization,
      optionRandomization,
      sections,
      security,
    } = req.body;

    const orgId = req.user?.organizationId;

    if (!name || !jobRole || !duration) {
      return res.status(400).json({ error: 'Assessment name, job role, and duration are required.' });
    }

    const assessment = await Assessment.create({
      organizationId: orgId,
      name,
      description: description || '',
      jobRole,
      duration: parseInt(duration, 10) || 60,
      passingScorePercentage: parseInt(passingScorePercentage, 10) || 60,
      navigationMode: navigationMode || 'FREE',
      questionRandomization: questionRandomization !== undefined ? questionRandomization : true,
      optionRandomization: optionRandomization !== undefined ? optionRandomization : true,
      sections: sections || [],
      security: security || {
        webcamRequired: true,
        micRequired: false,
        identityVerification: true,
        fullscreenRequired: true,
      },
      state: 'DRAFT',
      version: 1,
      createdBy: req.user?.id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'CREATE_ASSESSMENT',
      entity: 'Assessment',
      entityId: (assessment._id as any).toString(),
      details: { name: assessment.name },
    });

    return res.status(201).json({ assessment });
  } catch (error: any) {
    console.error('Create assessment error:', error);
    return res.status(500).json({ error: 'Failed to create assessment.' });
  }
};

export const updateAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    if (assessment.state === 'PUBLISHED' || assessment.state === 'ACTIVE') {
      // Editing a published assessment increments version!
      assessment.version += 1;
    }

    Object.assign(assessment, req.body);
    await assessment.save();

    return res.json({ assessment });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update assessment.' });
  }
};

export const publishAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    // Validate Question Pools sufficiency (Rule 11)
    for (const sec of assessment.sections) {
      const parts = sec.name.split(/&|\/|and/).map((p) => p.trim()).filter(Boolean);
      const regexFilter = parts.join('|');

      const availableCount = await Question.countDocuments({
        organizationId: assessment.organizationId,
        status: 'ACTIVE',
        $or: [
          { section: sec.name },
          { section: { $regex: new RegExp(regexFilter, 'i') } },
        ],
      });

      if (availableCount < sec.questionCount) {
        return res.status(400).json({
          error: `Insufficient questions in question pool for section '${sec.name}'. Required: ${sec.questionCount}, Available in bank: ${availableCount}.`,
        });
      }
    }

    assessment.state = 'PUBLISHED';
    await assessment.save();

    await AuditLog.create({
      organizationId: assessment.organizationId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'PUBLISH_ASSESSMENT',
      entity: 'Assessment',
      entityId: (assessment._id as any).toString(),
      details: { name: assessment.name, version: assessment.version },
    });

    return res.json({ message: 'Assessment published successfully.', assessment });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to publish assessment.' });
  }
};
