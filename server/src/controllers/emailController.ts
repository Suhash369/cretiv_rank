import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Invitation from '../models/Invitation';
import AssessmentAttempt from '../models/AssessmentAttempt';
import { emailService } from '../services/emailService';
import AuditLog from '../models/AuditLog';

export const sendInvitationEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id).populate('assessmentId');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const assessment = invitation.assessmentId as any;
    const assessmentName = assessment?.name || 'Recruitment Assessment';

    // Build absolute URL for candidate invitation link
    const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    const invitationUrl = `${origin}/candidate/invite/${invitation.token}`;

    const mailResult = await emailService.sendInvitationEmail({
      candidateName: invitation.candidateName,
      candidateEmail: invitation.candidateEmail,
      assessmentName,
      jobRole: invitation.jobRole,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      invitationUrl,
    });

    invitation.emailSent = true;
    invitation.emailSentCount = (invitation.emailSentCount || 0) + 1;
    invitation.lastEmailSentAt = new Date();
    if (mailResult.previewUrl) {
      invitation.lastEmailPreviewUrl = mailResult.previewUrl as string;
    }
    await invitation.save();

    await AuditLog.create({
      organizationId: req.user?.organizationId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'SEND_INVITATION_EMAIL',
      entity: 'Invitation',
      entityId: (invitation._id as any).toString(),
      details: {
        candidateEmail: invitation.candidateEmail,
        previewUrl: mailResult.previewUrl,
      },
    });

    return res.json({
      message: `Invitation email sent successfully to ${invitation.candidateEmail}`,
      invitation,
      previewUrl: mailResult.previewUrl,
    });
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    return res.status(500).json({ error: error.message || 'Failed to send invitation email.' });
  }
};

export const sendResultEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const attempt = await AssessmentAttempt.findById(attemptId).populate('assessmentId');

    if (!attempt) {
      return res.status(404).json({ error: 'Candidate attempt record not found.' });
    }

    const assessment = attempt.assessmentId as any;
    const assessmentName = assessment?.name || 'Recruitment Assessment';

    const mailResult = await emailService.sendResultEmail({
      candidateName: attempt.candidateName,
      candidateEmail: attempt.candidateEmail,
      assessmentName,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      accuracy: attempt.accuracy,
    });

    await AuditLog.create({
      organizationId: req.user?.organizationId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'SEND_RESULT_EMAIL',
      entity: 'AssessmentAttempt',
      entityId: (attempt._id as any).toString(),
      details: {
        candidateEmail: attempt.candidateEmail,
        percentage: attempt.percentage,
      },
    });

    return res.json({
      message: `Assessment result email dispatched to ${attempt.candidateEmail}`,
      previewUrl: mailResult.previewUrl,
    });
  } catch (error: any) {
    console.error('Failed to send result email:', error);
    return res.status(500).json({ error: error.message || 'Failed to send assessment result email.' });
  }
};

export const getEmailStatusHandler = async (req: AuthRequest, res: Response) => {
  try {
    const statusData = await emailService.getStatusAndLogs();
    return res.json(statusData);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch email status and delivery logs.' });
  }
};

export const sendTestEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { toEmail } = req.body;
    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email address (toEmail) is required.' });
    }

    const result = await emailService.sendTestEmail(toEmail);
    return res.json({
      message: `Test email sent successfully to ${toEmail}`,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to send test email.' });
  }
};
