import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Award, ShieldAlert, Eye, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CandidateResultsPage: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.getCandidateResults();
        setAttempts(res.attempts);
      } catch (err) {
        console.error('Failed to load candidate results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Assessment Performance</h1>
        <p className="text-slate-400 text-sm mt-1">
          Server-evaluated candidate attempt records, section accuracy breakdowns & security audit signals.
        </p>
      </div>

      {/* Results Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading candidate attempt records...</div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No candidate submissions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Assessment</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Percentage</th>
                  <th className="px-5 py-3.5">Accuracy</th>
                  <th className="px-5 py-3.5">Suspicious Score</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{att.candidateName}</div>
                      <div className="text-xs text-slate-400">{att.candidateEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-brand-400">{att.assessmentId?.name}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-slate-200">
                      {att.score} / {att.maxScore}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-100">{att.percentage}%</td>
                    <td className="px-5 py-4 text-xs text-slate-400">{att.accuracy}%</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          att.suspiciousActivityScore > 40
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : att.suspiciousActivityScore > 15
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        Score: {att.suspiciousActivityScore || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedAttempt(att)}
                        className="text-xs btn-secondary py-1 px-2.5"
                      >
                        Section Breakdown
                      </button>
                      <Link
                        to={`/admin/proctoring/${att._id}`}
                        className="text-xs btn-primary py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section Breakdown Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Section Performance: {selectedAttempt.candidateName}
              </h3>
              <button onClick={() => setSelectedAttempt(null)} className="text-slate-400 hover:text-slate-200">
                ×
              </button>
            </div>

            <div className="space-y-3">
              {selectedAttempt.sectionScores?.map((sec: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span>{sec.section}</span>
                    <span className="font-mono text-brand-400">
                      {sec.score} / {sec.maxScore} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="text-emerald-400 font-medium">Correct: {sec.correctCount}</span>
                    <span className="text-rose-400 font-medium">Incorrect: {sec.incorrectCount}</span>
                    <span className="text-slate-500">Unanswered: {sec.unansweredCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
