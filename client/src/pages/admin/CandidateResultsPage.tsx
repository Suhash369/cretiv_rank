import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Award, ShieldAlert, Eye, CheckCircle2, ChevronRight, Mail, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CandidateResultsPage: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [sendingResultMailId, setSendingResultMailId] = useState<string | null>(null);
  const [viewingAnswersData, setViewingAnswersData] = useState<any | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState<boolean>(false);

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

  const handleSendResultMail = async (attemptId: string) => {
    setSendingResultMailId(attemptId);
    try {
      const res = await api.sendCandidateResultEmail(attemptId);
      alert(`Result email sent successfully to candidate!`);
      if (res.previewUrl) {
        window.open(res.previewUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send result email.');
    } finally {
      setSendingResultMailId(null);
    }
  };

  const handleViewAnswers = async (attemptId: string) => {
    setLoadingAnswers(true);
    try {
      const res = await api.getCandidateInterviewDetails(attemptId);
      setViewingAnswersData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch candidate answers.');
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleSaveManualGrade = async (questionId: string, score: number, isCorrect: boolean) => {
    if (!viewingAnswersData?.attempt?._id) return;
    try {
      const attemptId = viewingAnswersData.attempt._id;
      const res = await api.gradeCandidateAnswer(attemptId, { questionId, score, isCorrect });
      setViewingAnswersData((prev: any) => ({
        ...prev,
        attempt: res.attempt,
        answers: res.answers,
      }));
      // Refresh overall candidate results list
      const updatedRes = await api.getCandidateResults();
      setAttempts(updatedRes.attempts);
    } catch (err: any) {
      alert(err.message || 'Failed to save manual grade.');
    }
  };

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
                        onClick={() => handleViewAnswers(att._id)}
                        className="text-xs btn-secondary py-1 px-2.5 inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 border-indigo-500/20"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View & Grade Answers</span>
                      </button>
                      <button
                        onClick={() => handleSendResultMail(att._id)}
                        disabled={sendingResultMailId === att._id}
                        className="text-xs btn-secondary py-1 px-2.5 inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 border-sky-500/20 hover:border-sky-500/40"
                      >
                        {sendingResultMailId === att._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        <span>Email Result</span>
                      </button>
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

      {/* Submitted Answers & Manual Grading Inspector Modal */}
      {viewingAnswersData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Candidate Submitted Answers & Manual Evaluation: {viewingAnswersData.attempt?.candidateName}
                </h3>
                <p className="text-xs text-slate-400">
                  {viewingAnswersData.attempt?.candidateEmail} | Score: <strong className="text-emerald-400">{viewingAnswersData.attempt?.score} / {viewingAnswersData.attempt?.maxScore} pts ({viewingAnswersData.attempt?.percentage}%)</strong>
                </p>
              </div>
              <button onClick={() => setViewingAnswersData(null)} className="text-slate-400 hover:text-white text-xl px-2">
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {viewingAnswersData.attempt?.frozenQuestions?.map((fq: any, idx: number) => {
                const ansObj = viewingAnswersData.answers?.find((a: any) => (a.questionId?._id || a.questionId) === fq.questionId);
                const candidateAnswer = ansObj ? ansObj.answer : 'No answer submitted';
                const currentScore = ansObj ? ansObj.score || 0 : 0;
                const currentIsCorrect = ansObj ? !!ansObj.isCorrect : false;

                return (
                  <ManualAnswerRow
                    key={fq.questionId}
                    idx={idx}
                    fq={fq}
                    candidateAnswer={candidateAnswer}
                    currentScore={currentScore}
                    currentIsCorrect={currentIsCorrect}
                    onSaveGrade={(newScore, newIsCorrect) => handleSaveManualGrade(fq.questionId, newScore, newIsCorrect)}
                  />
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button onClick={() => setViewingAnswersData(null)} className="btn-secondary text-xs">
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual manual answer grading
const ManualAnswerRow: React.FC<{
  idx: number;
  fq: any;
  candidateAnswer: any;
  currentScore: number;
  currentIsCorrect: boolean;
  onSaveGrade: (score: number, isCorrect: boolean) => void;
}> = ({ idx, fq, candidateAnswer, currentScore, currentIsCorrect, onSaveGrade }) => {
  const [scoreVal, setScoreVal] = useState<number>(currentScore);
  const [isCorrectVal, setIsCorrectVal] = useState<boolean>(currentIsCorrect);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setScoreVal(currentScore);
    setIsCorrectVal(currentIsCorrect);
  }, [currentScore, currentIsCorrect]);

  const handleSave = async () => {
    setSaving(true);
    await onSaveGrade(scoreVal, isCorrectVal);
    setSaving(false);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-brand-400">
          Q{idx + 1}. {fq.section} (Max {fq.marks} pts)
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 uppercase">
          {fq.questionType}
        </span>
      </div>

      <p className="text-slate-200 text-sm font-medium">{fq.question}</p>

      {/* Candidate Submitted Response */}
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Candidate Response:</div>
        <div className="font-mono text-slate-200 text-xs whitespace-pre-wrap">
          {typeof candidateAnswer === 'object' ? JSON.stringify(candidateAnswer, null, 2) : String(candidateAnswer)}
        </div>
      </div>

      {/* Recruiter Manual Grading & Override Bar */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Manual Mark:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={fq.marks}
              value={scoreVal}
              onChange={(e) => {
                const val = Math.max(0, Math.min(fq.marks, Number(e.target.value) || 0));
                setScoreVal(val);
                setIsCorrectVal(val > 0);
              }}
              className="w-16 input-field py-1 px-2 text-center text-xs font-mono font-bold text-emerald-400"
            />
            <span className="text-xs text-slate-400">/ {fq.marks} pts</span>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => {
                setIsCorrectVal(true);
                if (scoreVal === 0) setScoreVal(fq.marks);
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                isCorrectVal ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ✓ Correct
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCorrectVal(false);
                setScoreVal(0);
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                !isCorrectVal ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ✕ Incorrect
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary py-1 px-3 text-xs"
        >
          {saving ? 'Saving...' : 'Save Mark'}
        </button>
      </div>
    </div>
  );
};
