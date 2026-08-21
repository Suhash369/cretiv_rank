import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ShieldAlert, AlertTriangle, Camera, Clock, ArrowLeft, ShieldCheck, Info } from 'lucide-react';

export const ProctoringReviewPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!attemptId) return;
      try {
        const res = await api.getProctoringTimeline(attemptId);
        setData(res);
      } catch (err) {
        console.error('Failed to load proctoring timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [attemptId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading candidate security timeline...</div>;
  }

  const events = (data?.events || []).filter((e: any) =>
    severityFilter ? e.severity === severityFilter : true
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/results" className="text-slate-400 hover:text-slate-200 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Proctoring Timeline Audit: {data?.candidateName}</h1>
            <p className="text-xs text-slate-400">Timestamped security events recorded during assessment attempt.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Suspicious Activity Score</div>
            <div
              className={`text-xl font-black ${
                data?.suspiciousActivityScore > 40
                  ? 'text-rose-400'
                  : data?.suspiciousActivityScore > 15
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {data?.suspiciousActivityScore || 0} / 100
            </div>
          </div>
        </div>
      </div>

      {/* Layered Security Disclaimer (Rule 4) */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Layered Security Evidence Model:</strong>
          <p className="text-[11px] mt-0.5 text-slate-400">
            Browser monitoring captures window focus, tab switches, full-screen events, and camera connectivity signals. Security scores serve as investigation evidence for recruiter review and post-assessment verification interviews.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase">Proctoring Events Log ({events.length})</span>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input-field text-xs"
        >
          <option value="">All Severities</option>
          <option value="HIGH">High Severity</option>
          <option value="MEDIUM">Medium Severity</option>
          <option value="LOW">Low Severity</option>
        </select>
      </div>

      {/* Timeline Stream */}
      <div className="glass-panel p-6">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span>No proctoring anomalies or suspicious events recorded for this candidate.</span>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {events.map((evt: any, i: number) => (
              <div key={evt._id || i} className="relative pl-6">
                <div
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 ${
                    evt.severity === 'HIGH'
                      ? 'bg-rose-500'
                      : evt.severity === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-brand-500'
                  }`}
                />

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        evt.severity === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : evt.severity === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                      }`}
                    >
                      {evt.severity} SEVERITY
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white">{evt.eventType}</div>

                  {evt.duration > 0 && (
                    <div className="text-xs text-slate-400">Duration: {evt.duration} seconds</div>
                  )}

                  {evt.metadata && (
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-950/60 p-2 rounded border border-slate-800/80 mt-2">
                      {JSON.stringify(evt.metadata)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
