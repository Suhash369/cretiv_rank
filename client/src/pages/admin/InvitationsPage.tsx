import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCheck, Plus, Copy, Check, ExternalLink, Mail, Clock, Send, RefreshCw, Eye } from 'lucide-react';
import { EmailLogsModal } from '../../components/admin/EmailLogsModal';

export const InvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    jobRole: 'Data Analyst',
    assessmentId: '',
    expiryDays: 7,
    sendEmail: true,
  });

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const invRes = await api.getInvitations();
      const assRes = await api.getAssessments();
      setInvitations(invRes.invitations);
      setAssessments(assRes.assessments);
      if (assRes.assessments.length > 0) {
        setFormData((prev) => ({ ...prev, assessmentId: assRes.assessments[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createInvitation(formData);
      setShowModal(false);
      fetchInvitations();
      if (res.previewUrl) {
        window.open(res.previewUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate candidate invitation');
    }
  };

  const handleSendEmail = async (invitationId: string) => {
    setSendingEmailId(invitationId);
    try {
      const res = await api.sendInvitationEmail(invitationId);
      fetchInvitations();
      if (res.previewUrl) {
        window.open(res.previewUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation email.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const candidateUrl = `${window.location.origin}/candidate/invite/${token}`;
    navigator.clipboard.writeText(candidateUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Assessment Invitations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate single-use access tokens and send official candidate invitation emails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogsModal(true)}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Email Activity Logs</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Invite Candidate</span>
          </button>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading candidate invitations...</div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No active candidate invitations. Click "Invite Candidate" to issue an assessment link.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Assessment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Email Delivery</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invitations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{inv.candidateName}</div>
                      <div className="text-xs text-slate-400">{inv.candidateEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-brand-400">
                        {inv.assessmentId?.name || 'Assessment'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                          inv.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inv.status === 'ACCEPTED'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${
                            inv.emailSent
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <Mail className="w-3 h-3" />
                          <span>
                            {inv.emailSent
                              ? `Sent ${inv.emailSentCount && inv.emailSentCount > 1 ? `(${inv.emailSentCount}x)` : ''}`
                              : 'Not Sent'}
                          </span>
                        </span>
                        {inv.lastEmailPreviewUrl && (
                          <div>
                            <a
                              href={inv.lastEmailPreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View HTML Mail</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleSendEmail(inv._id)}
                        disabled={sendingEmailId === inv._id}
                        className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 border-indigo-500/20 hover:border-indigo-500/40"
                      >
                        {sendingEmailId === inv._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{inv.emailSent ? 'Resend Mail' : 'Send Mail'}</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(inv.token)}
                        className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1.5"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Candidate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Generate Candidate Invitation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Candidate Email</label>
                <input
                  type="email"
                  required
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                  className="input-field w-full"
                  placeholder="candidate@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Assessment</label>
                <select
                  value={formData.assessmentId}
                  onChange={(e) => setFormData({ ...formData, assessmentId: e.target.value })}
                  className="input-field w-full"
                >
                  {assessments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.jobRole})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Automatically dispatch email invitation to candidate</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Invitation & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Delivery & Logs Drawer Modal */}
      <EmailLogsModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} />
    </div>
  );
};
