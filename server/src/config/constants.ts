export const JWT_SECRET = process.env.JWT_SECRET || 'cretivrank-super-secret-production-jwt-key-2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const CANDIDATE_JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || 'cretivrank-candidate-assessment-token-secret-2026';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  INTERVIEWER: 'INTERVIEWER',
  CANDIDATE: 'CANDIDATE',
} as const;

export const QUESTION_TYPES = [
  'MCQ',
  'MULTIPLE_CHOICE',
  'NUMERICAL',
  'SHORT_ANSWER',
  'LONG_ANALYTICAL',
  'SQL',
  'PYTHON',
  'CODING',
  'CASE_STUDY',
  'DATA_INTERPRETATION',
] as const;

export const SECTIONS = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Probability',
  'Statistics',
  'Data Interpretation',
  'Business Analytics',
  'SQL',
  'Python',
  'Excel',
  'Power BI',
  'DAX',
  'Technical MCQs',
  'Coding Questions',
  'Case Studies',
] as const;

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'] as const;

export const NAVIGATION_MODES = ['FREE', 'NEXT_ONLY', 'SECTION_LOCKED', 'NO_RETURN'] as const;

export const ASSESSMENT_STATES = ['DRAFT', 'READY', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const;

export const ATTEMPT_STATES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'AUTO_SUBMITTED',
  'EXPIRED',
  'DISQUALIFIED',
] as const;

export const PROCTORING_EVENT_TYPES = [
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'WINDOW_FOCUS',
  'FULLSCREEN_EXIT',
  'FACE_NOT_VISIBLE',
  'MULTIPLE_FACES_DETECTED',
  'CAMERA_DISCONNECTED',
  'CANDIDATE_LEFT_FRAME',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CUT_ATTEMPT',
  'RIGHT_CLICK',
  'VPN_DETECTED',
  'PROXY_DETECTED',
] as const;

export const RECOMMENDATIONS = ['STRONG HIRE', 'HIRE', 'BORDERLINE', 'REJECT'] as const;
