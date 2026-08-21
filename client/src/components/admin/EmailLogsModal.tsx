import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Mail, RefreshCw, Send, ExternalLink, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({ isOpen, onClose }) => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('');
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEmailStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getEmailStatus();
      setStatusData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch email status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmailStatus();
    }
  }, [isOpen]);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setSendingTest(true);
    setTestSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.sendTestEmail(testEmail);
      setTestSuccessMsg(res.message);
      fetchEmailStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send test email.');
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Service & Delivery Logs</h3>
              <p className="text-xs text-slate-400">Nodemailer SMTP & Ethereal test delivery status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmailStatus}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2">
              ×
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Service Configuration Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transporter Mode</div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    statusData?.mode === 'CUSTOM_SMTP'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {statusData?.mode || 'ETHEREAL_TEST'}
                </span>
                <span className="text-xs text-slate-400">
                  {statusData?.mode === 'CUSTOM_SMTP' ? 'Live Custom SMTP (Real Inboxes)' : 'Ethereal Test Sandbox'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configured From Header</div>
              <div className="text-xs font-mono text-slate-200 truncate">
                {statusData?.configuredFrom || 'no-reply@cretivrank.internal'}
              </div>
            </div>
          </div>

          {/* Real Inbox SMTP Delivery Banner / Notice */}
          {(statusData?.mode === 'ETHEREAL_TEST' || statusData?.isPlaceholder) && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {statusData?.isPlaceholder
                    ? '⚠️ Placeholder SMTP Credentials Detected in Vercel'
                    : '🧪 Ethereal Test Sandbox Mode Active'}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {statusData?.isPlaceholder
                  ? 'Your Vercel deployment currently contains default placeholder credentials ("your_email@gmail.com"). Emails cannot be sent to real candidate inboxes until real SMTP/API credentials are set in Vercel.'
                  : 'In Test Sandbox mode, outgoing emails are captured safely in temporary test accounts and will NOT land in real candidate inboxes.'}
              </p>
              <div className="pt-2 border-t border-amber-500/20 space-y-2">
                <p className="font-semibold text-amber-300">How to enable REAL email delivery to candidate inboxes:</p>
                <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11.5px] leading-relaxed">
                  <li>
                    Open your <strong>Vercel Project Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                  </li>
                  <li>
                    Set <code className="text-amber-200">SMTP_HOST</code> = <code className="text-emerald-400">smtp.gmail.com</code> and <code className="text-amber-200">SMTP_PORT</code> = <code className="text-emerald-400">465</code>.
                  </li>
                  <li>
                    Set <code className="text-amber-200">SMTP_USER</code> = <i>your real Gmail address</i> (e.g. <code className="text-emerald-400">siva7305852@gmail.com</code>).
                  </li>
                  <li>
                    Set <code className="text-amber-200">SMTP_PASS</code> = <i>your 16-character Google App Password</i> (generated from your Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App passwords).
                  </li>
                  <li>
                    <strong>Check Spam/Junk folder:</strong> Real emails sent from new app passwords may initially be sorted into Gmail's <i>Spam</i> or <i>Promotions</i> tab.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Test Email Dispatch Form */}
          <form onSubmit={handleSendTestEmail} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Send Quick System Test Email</span>
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email (e.g. candidate@gmail.com)..."
                className="input-field flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={sendingTest}
                className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
            {testSuccessMsg && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{testSuccessMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Recent Delivery Logs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recent Dispatched Email Logs ({statusData?.recentLogs?.length || 0})
            </h4>

            {!statusData?.recentLogs || statusData.recentLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                No email dispatches logged yet. Send an invitation or test email to see logs.
              </div>
            ) : (
              <div className="space-y-2.5">
                {statusData.recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.type === 'INVITATION'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : log.type === 'RESULT'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="font-semibold text-slate-200">{log.recipientEmail}</span>
                        {log.recipientName && <span className="text-slate-400">({log.recipientName})</span>}
                      </div>
                      <div className="text-slate-400 font-medium">{log.subject}</div>
                      <div className="text-[11px] text-slate-500">
                        Sent at: {new Date(log.sentAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.previewUrl ? (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 text-indigo-400 border-indigo-500/30 hover:border-indigo-500"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View HTML Email (Preview)</span>
                        </a>
                      ) : (log.mode === 'ETHEREAL_TEST' || (!log.mode && statusData?.mode === 'ETHEREAL_TEST') || statusData?.isPlaceholder) ? (
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20" title="Captured in Test Sandbox mode. No real email was dispatched to candidate inbox.">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Captured (Test Sandbox)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1" title="Dispatched via SMTP/HTTP API. Check Spam/Junk folder if not in main inbox.">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Dispatched (Check Spam Inbox)</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
