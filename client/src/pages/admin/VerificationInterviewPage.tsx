import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Mic, CheckCircle2, Award, ShieldAlert, Star, FileText } from 'lucide-react';
import { RECOMMENDATIONS } from '../../constants';

export const VerificationInterviewPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<any | null>(null);

  // Verification Form State
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState({
    technicalUnderstanding: 4,
    problemSolving: 4,
    communication: 4,
    confidence: 4,
  });
  const [recommendation, setRecommendation] = useState<string>('HIRE');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAssignedInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.getAssignedInterviews();
      setCandidates(res.candidates);
    } catch (err) {
      console.error('Failed to load assigned interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedInterviews();
  }, []);

  const handleSelectCandidate = async (cand: any) => {
    setSelectedCandidate(cand);
    try {
      const res = await api.getCandidateInterviewDetails(cand.attemptId);
      setAttemptDetails(res);
      const frozen = res.attempt?.frozenQuestions || [];
      // Pick first 3 questions by default
      setSelectedQIds(frozen.slice(0, 3).map((q: any) => q.questionId));
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  };

  const toggleQuestionSelection = (qId: string) => {
    if (selectedQIds.includes(qId)) {
      if (selectedQIds.length === 1) {
        alert('Please keep at least 1 question selected for verification defense.');
        return;
      }
      setSelectedQIds(selectedQIds.filter((id) => id !== qId));
    } else {
      if (selectedQIds.length >= 5) {
        alert('Maximum 5 questions can be selected for verbal verification.');
        return;
      }
      setSelectedQIds([...selectedQIds, qId]);
    }
  };

  const handleSubmitInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setSubmitting(true);

    try {
      const payload = {
        attemptId: selectedCandidate.attemptId,
        selectedQuestionIds: selectedQIds,
        ratings,
        recommendation,
        notes,
      };

      const res = await api.submitVerificationInterview(payload);
      alert(res.message);
      setSelectedCandidate(null);
      fetchAssignedInterviews();
    } catch (err: any) {
      alert(err.message || 'Failed to submit interview report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Post-Assessment Verification Interviews</h1>
        <p className="text-slate-400 text-sm mt-1">
          Conduct verbal defense interviews on candidate attempt questions & submit final hiring recommendations.
        </p>
      </div>

      {/* Candidate Queue List */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading interview queue...</div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No completed candidate submissions requiring verification.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Assessment</th>
                  <th className="px-5 py-3.5">Assessment Score</th>
                  <th className="px-5 py-3.5">Security Score</th>
                  <th className="px-5 py-3.5">Verification Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.map((cand) => (
                  <tr key={cand.attemptId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{cand.candidateName}</div>
                      <div className="text-xs text-slate-400">{cand.candidateEmail}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-brand-400 font-medium">
                      {cand.assessmentName} ({cand.jobRole})
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-200">{cand.percentage}%</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {cand.suspiciousActivityScore} / 100
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                          cand.interviewStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {cand.interviewStatus === 'COMPLETED'
                          ? `COMPLETED (${cand.verificationDetails?.recommendation})`
                          : 'PENDING VERIFICATION'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleSelectCandidate(cand)}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Conduct Defense</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Interview Execution Modal */}
      {selectedCandidate && attemptDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Verification Interview: {selectedCandidate.candidateName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Role: {selectedCandidate.jobRole} | Candidate Score: {selectedCandidate.percentage}%
                </p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-200">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitInterview} className="space-y-6">
              {/* Question Selection for Verbal Defense */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                    1. Select 3–5 Assessment Questions for Candidate Verbal Defense
                  </h3>
                  <span className="text-xs text-slate-400">Selected: {selectedQIds.length} / 5</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {attemptDetails.attempt?.frozenQuestions?.map((fq: any) => {
                    const isSelected = selectedQIds.includes(fq.questionId);
                    return (
                      <div
                        key={fq.questionId}
                        onClick={() => toggleQuestionSelection(fq.questionId)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/40 text-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{fq.section}</span>
                          <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                            {fq.questionType}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-300 font-medium">{fq.question}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rubric Evaluation Sliders */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  2. Interviewer Verification Ratings (1 to 5)
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Technical Understanding: <strong className="text-brand-400">{ratings.technicalUnderstanding}/5</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.technicalUnderstanding}
                      onChange={(e) => setRatings({ ...ratings, technicalUnderstanding: parseInt(e.target.value, 10) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Problem Solving: <strong className="text-brand-400">{ratings.problemSolving}/5</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.problemSolving}
                      onChange={(e) => setRatings({ ...ratings, problemSolving: parseInt(e.target.value, 10) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Communication: <strong className="text-brand-400">{ratings.communication}/5</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.communication}
                      onChange={(e) => setRatings({ ...ratings, communication: parseInt(e.target.value, 10) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Confidence: <strong className="text-brand-400">{ratings.confidence}/5</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.confidence}
                      onChange={(e) => setRatings({ ...ratings, confidence: parseInt(e.target.value, 10) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation & Notes */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  3. Final Recommendation & Interview Notes
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Hiring Recommendation</label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      className="input-field w-full font-bold text-xs"
                    >
                      {RECOMMENDATIONS.map((rec) => (
                        <option key={rec} value={rec}>
                          {rec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Interviewer Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter specific candidate strengths, verbal explanations, or concerns..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setSelectedCandidate(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting Report...' : 'Submit Final Verification Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
