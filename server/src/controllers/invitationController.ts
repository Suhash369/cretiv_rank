import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Invitation from '../models/Invitation';
import Assessment from '../models/Assessment';
import { v4 as uuidv4 } from 'uuid';
import AuditLog from '../models/AuditLog';
import { emailService } from '../services/emailService';

export const getInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const invitations = await Invitation.find({ organizationId: orgId })
      .populate('assessmentId', 'name jobRole duration')
      .sort({ createdAt: -1 });
    return res.json({ invitations });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch invitations.' });
  }
};

export const createInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateName, candidateEmail, jobRole, assessmentId, expiryDays, sendEmail = true } = req.body;
    const orgId = req.user?.organizationId;

    if (!candidateName || !candidateEmail || !assessmentId) {
      return res.status(400).json({ error: 'Candidate name, email, and assessment ID are required.' });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Selected assessment not found.' });

    const token = uuidv4();
    const days = parseInt(expiryDays, 10) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      token,
      organizationId: orgId,
      assessmentId,
      candidateName,
      candidateEmail: candidateEmail.toLowerCase().trim(),
      jobRole: jobRole || assessment.jobRole,
      expiresAt,
      status: 'PENDING',
      createdBy: req.user?.id,
    });

    let previewUrl: string | undefined;
    if (sendEmail) {
      try {
        const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
        const invitationUrl = `${origin}/candidate/invite/${invitation.token}`;
        const mailResult = await emailService.sendInvitationEmail({
          candidateName: invitation.candidateName,
          candidateEmail: invitation.candidateEmail,
          assessmentName: assessment.name,
          jobRole: invitation.jobRole,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          invitationUrl,
        });

        invitation.emailSent = true;
        invitation.emailSentCount = 1;
        invitation.lastEmailSentAt = new Date();
        if (mailResult.previewUrl) {
          invitation.lastEmailPreviewUrl = mailResult.previewUrl as string;
          previewUrl = mailResult.previewUrl as string;
        }
        await invitation.save();
      } catch (err) {
        console.error('Auto-email dispatch failed during invitation creation:', err);
      }
    }

    await AuditLog.create({
      organizationId: orgId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'CREATE_INVITATION',
      entity: 'Invitation',
      entityId: (invitation._id as any).toString(),
      details: { candidateEmail: invitation.candidateEmail, token, emailSent: invitation.emailSent },
    });

    return res.status(201).json({ invitation, previewUrl });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    return res.status(500).json({ error: 'Failed to generate candidate invitation.' });
  }
};

export const bulkInviteCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { candidates, assessmentId, expiryDays, sendEmail = true } = req.body; // Array of { name, email, jobRole }
    const orgId = req.user?.organizationId;

    if (!Array.isArray(candidates) || candidates.length === 0 || !assessmentId) {
      return res.status(400).json({ error: 'Candidates list and assessment ID are required.' });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    const days = parseInt(expiryDays, 10) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const createdInvitations = [];
    const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;

    for (const c of candidates) {
      if (!c.email || !c.name) continue;
      const token = uuidv4();
      const inv = await Invitation.create({
        token,
        organizationId: orgId,
        assessmentId,
        candidateName: c.name,
        candidateEmail: c.email.toLowerCase().trim(),
        jobRole: c.jobRole || assessment.jobRole,
        expiresAt,
        status: 'PENDING',
        createdBy: req.user?.id,
      });

      if (sendEmail) {
        try {
          const invitationUrl = `${origin}/candidate/invite/${inv.token}`;
          const mailResult = await emailService.sendInvitationEmail({
            candidateName: inv.candidateName,
            candidateEmail: inv.candidateEmail,
            assessmentName: assessment.name,
            jobRole: inv.jobRole,
            token: inv.token,
            expiresAt: inv.expiresAt,
            invitationUrl,
          });

          inv.emailSent = true;
          inv.emailSentCount = 1;
          inv.lastEmailSentAt = new Date();
          if (mailResult.previewUrl) {
            inv.lastEmailPreviewUrl = mailResult.previewUrl as string;
          }
          await inv.save();
        } catch (err) {
          console.error(`Auto-email failed for bulk candidate ${c.email}:`, err);
        }
      }

      createdInvitations.push(inv);
    }

    return res.status(201).json({
      message: `Generated ${createdInvitations.length} candidate invitations.`,
      invitations: createdInvitations,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to process bulk candidate invitations.' });
  }
};
