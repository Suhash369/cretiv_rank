import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { QuestionBankPage } from './pages/admin/QuestionBankPage';
import { BulkUploadPage } from './pages/admin/BulkUploadPage';
import { AssessmentsPage } from './pages/admin/AssessmentsPage';
import { InvitationsPage } from './pages/admin/InvitationsPage';
import { CandidateResultsPage } from './pages/admin/CandidateResultsPage';
import { ProctoringReviewPage } from './pages/admin/ProctoringReviewPage';
import { VerificationInterviewPage } from './pages/admin/VerificationInterviewPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

import { CandidateInviteLanding } from './pages/candidate/CandidateInviteLanding';
import { CandidateSystemCheck } from './pages/candidate/CandidateSystemCheck';
import { CandidateConsent } from './pages/candidate/CandidateConsent';
import { CandidateAssessmentRoom } from './pages/candidate/CandidateAssessmentRoom';
import { CandidateSuccessPage } from './pages/candidate/CandidateSuccessPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Platform */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="questions" element={<QuestionBankPage />} />
            <Route path="upload" element={<BulkUploadPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="invitations" element={<InvitationsPage />} />
            <Route path="results" element={<CandidateResultsPage />} />
            <Route path="proctoring/:attemptId" element={<ProctoringReviewPage />} />
            <Route path="interviews" element={<VerificationInterviewPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Candidate Platform */}
          <Route path="/candidate/invite/:token" element={<CandidateInviteLanding />} />
          <Route path="/candidate/system-check" element={<CandidateSystemCheck />} />
          <Route path="/candidate/consent" element={<CandidateConsent />} />
          <Route path="/candidate/assessment-room" element={<CandidateAssessmentRoom />} />
          <Route path="/candidate/success" element={<CandidateSuccessPage />} />

          {/* Default Catch All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
