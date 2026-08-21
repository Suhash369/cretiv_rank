import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, Shield, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await api.getAuditLogs();
        setLogs(res.logs);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Immutable Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cryptographically tracked audit entries for all administrative actions, question updates & candidate submissions.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading audit log stream...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No audit log records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3 font-sans text-slate-200 font-medium">{log.actorEmail || 'System'}</td>
                    <td className="px-5 py-3 text-brand-400 text-[10px] uppercase font-bold">{log.actorRole}</td>
                    <td className="px-5 py-3 text-emerald-400 font-bold">{log.action}</td>
                    <td className="px-5 py-3 text-slate-400">{log.entity}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
