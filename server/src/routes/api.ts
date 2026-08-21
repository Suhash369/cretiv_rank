import { Router } from 'express';
import multer from 'multer';
import { login, getMe } from '../controllers/authController';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  getQuestionVersionHistory,
  archiveQuestion,
} from '../controllers/questionController';
import { validateQuestionUpload, confirmQuestionImport } from '../controllers/uploadController';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  publishAssessment,
} from '../controllers/assessmentController';
import {
  getInvitations,
  createInvitation,
  bulkInviteCandidates,
} from '../controllers/invitationController';
import {
  getInvitationByToken,
  startAttempt,
  saveAnswer,
  submitAttempt,
} from '../controllers/candidateController';
import { recordProctoringEvent, getAttemptProctoringEvents } from '../controllers/proctoringController';
import {
  getAssignedInterviews,
  getCandidateInterviewDetails,
  submitVerificationInterview,
} from '../controllers/interviewController';
import { getDashboardSummary, getCandidateResults } from '../controllers/reportController';
import { getAuditLogs } from '../controllers/auditLogController';
import {
  sendInvitationEmailHandler,
  sendResultEmailHandler,
  getEmailStatusHandler,
  sendTestEmailHandler,
} from '../controllers/emailController';
import { authenticateAdmin, authenticateCandidate, authorizeRoles } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes
router.post('/auth/login', login);
router.get('/auth/me', authenticateAdmin, getMe);

// Admin Question Bank Routes
router.get('/questions', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getQuestions);
router.post('/questions', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), createQuestion);
router.put('/questions/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), updateQuestion);
router.get('/questions/:id/versions', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), getQuestionVersionHistory);
router.put('/questions/:id/archive', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), archiveQuestion);

// Bulk CSV/Excel Upload Routes
router.post('/questions/upload-validate', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), upload.single('file'), validateQuestionUpload);
router.post('/questions/confirm-import', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), confirmQuestionImport);

// Assessment Builder Routes
router.get('/assessments', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getAssessments);
router.get('/assessments/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getAssessmentById);
router.post('/assessments', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), createAssessment);
router.put('/assessments/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), updateAssessment);
router.put('/assessments/:id/publish', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), publishAssessment);

// Invitation Routes
router.get('/invitations', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), getInvitations);
router.post('/invitations', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), createInvitation);
router.post('/invitations/bulk', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), bulkInviteCandidates);

// Email & Notification Routes
router.post('/invitations/:id/send-email', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), sendInvitationEmailHandler);
router.post('/reports/candidates/:attemptId/send-result-email', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), sendResultEmailHandler);
router.get('/email/status', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getEmailStatusHandler);
router.post('/email/send-test', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), sendTestEmailHandler);

// Candidate Flow Routes (STRICTLY SEPARATED)
router.get('/candidate/invitation/:token', getInvitationByToken);
router.post('/candidate/start', startAttempt);
router.get('/candidate/current-attempt', authenticateCandidate, getCurrentCandidateAttempt);
router.post('/candidate/save-answer', authenticateCandidate, saveAnswer);
router.post('/candidate/submit', authenticateCandidate, submitAttempt);
router.post('/candidate/proctoring-event', authenticateCandidate, recordProctoringEvent);

// Admin Proctoring Timeline Review
router.get('/proctoring/attempt/:attemptId', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getAttemptProctoringEvents);

// Verification Interview Routes
router.get('/interviews/assigned', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getAssignedInterviews);
router.get('/interviews/candidate/:attemptId', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getCandidateInterviewDetails);
router.post('/interviews/submit', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), submitVerificationInterview);

// Analytics & Reports Routes
router.get('/reports/dashboard', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), getDashboardSummary);
router.get('/reports/candidates', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'), getCandidateResults);

// Audit Logs Route
router.get('/audit-logs', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'ORG_ADMIN'), getAuditLogs);

export default router;
