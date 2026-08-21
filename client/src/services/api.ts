const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = () => localStorage.getItem('cretivrank_token');
export const setAuthToken = (token: string) => localStorage.setItem('cretivrank_token', token);
export const removeAuthToken = () => localStorage.removeItem('cretivrank_token');

export const getCandidateToken = () => localStorage.getItem('cretivrank_candidate_token');
export const setCandidateToken = (token: string) => localStorage.setItem('cretivrank_candidate_token', token);
export const removeCandidateToken = () => localStorage.removeItem('cretivrank_candidate_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data as T;
}

export async function candidateRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getCandidateToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Candidate Request Failed');
  }

  return data as T;
}

// API Endpoint calls
export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request<any>('/auth/me'),

  // Questions
  getQuestions: (params: string = '') => request<any>(`/questions?${params}`),
  createQuestion: (data: any) => request<any>('/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id: string, data: any) => request<any>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getQuestionVersions: (id: string) => request<any>(`/questions/${id}/versions`),
  archiveQuestion: (id: string) => request<any>(`/questions/${id}/archive`, { method: 'PUT' }),

  // Upload
  uploadValidateFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/questions/upload-validate`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload validation failed');
    return data;
  },
  confirmImport: (rowsToImport: any[]) => request<any>('/questions/confirm-import', { method: 'POST', body: JSON.stringify({ rowsToImport }) }),

  // Assessments
  getAssessments: () => request<any>('/assessments'),
  getAssessmentById: (id: string) => request<any>(`/assessments/${id}`),
  createAssessment: (data: any) => request<any>('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssessment: (id: string, data: any) => request<any>(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishAssessment: (id: string) => request<any>(`/assessments/${id}/publish`, { method: 'PUT' }),

  // Invitations
  getInvitations: () => request<any>('/invitations'),
  createInvitation: (data: any) => request<any>('/invitations', { method: 'POST', body: JSON.stringify(data) }),
  bulkInvite: (data: any) => request<any>('/invitations/bulk', { method: 'POST', body: JSON.stringify(data) }),
  sendInvitationEmail: (id: string) => request<any>(`/invitations/${id}/send-email`, { method: 'POST' }),

  // Email System
  sendCandidateResultEmail: (attemptId: string) => request<any>(`/reports/candidates/${attemptId}/send-result-email`, { method: 'POST' }),
  getEmailStatus: () => request<any>('/email/status'),
  sendTestEmail: (toEmail: string) => request<any>('/email/send-test', { method: 'POST', body: JSON.stringify({ toEmail }) }),

  // Candidate
  getInvitationByToken: (token: string) => request<any>(`/candidate/invitation/${token}`),
  startCandidateAttempt: (payload: any) => request<any>('/candidate/start', { method: 'POST', body: JSON.stringify(payload) }),
  saveAnswer: (payload: any) => candidateRequest<any>('/candidate/save-answer', { method: 'POST', body: JSON.stringify(payload) }),
  submitAttempt: () => candidateRequest<any>('/candidate/submit', { method: 'POST' }),
  logProctoringEvent: (payload: any) => candidateRequest<any>('/candidate/proctoring-event', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin Proctoring Timeline Review
  getProctoringTimeline: (attemptId: string) => request<any>(`/proctoring/attempt/${attemptId}`),

  // Verification Interviews
  getAssignedInterviews: () => request<any>('/interviews/assigned'),
  getCandidateInterviewDetails: (attemptId: string) => request<any>(`/interviews/candidate/${attemptId}`),
  submitVerificationInterview: (payload: any) => request<any>('/interviews/submit', { method: 'POST', body: JSON.stringify(payload) }),

  // Reports & Analytics
  getDashboardSummary: () => request<any>('/reports/dashboard'),
  getCandidateResults: () => request<any>('/reports/candidates'),

  // Audit Logs
  getAuditLogs: () => request<any>('/audit-logs'),
};
