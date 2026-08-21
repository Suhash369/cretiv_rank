import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Download, FileSpreadsheet, BarChart3, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const res = await api.getCandidateResults();
        setCandidates(res.attempts);
      } catch (err) {
        console.error('Failed to load candidate results for export:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  const handleExportCSV = () => {
    if (candidates.length === 0) return;
    const exportData = candidates.map((c) => ({
      Candidate_Name: c.candidateName,
      Candidate_Email: c.candidateEmail,
      Assessment_Name: c.assessmentId?.name || 'Assessment',
      Score: c.score,
      Max_Score: c.maxScore,
      Percentage: `${c.percentage}%`,
      Accuracy: `${c.accuracy}%`,
      Suspicious_Activity_Score: c.suspiciousActivityScore,
      Submitted_At: new Date(c.submittedAt || c.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Results');
    XLSX.writeFile(workbook, `CretivRank_Candidate_Results_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Report Export Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            Export comprehensive candidate assessment results, section breakdown analytics, and security scores to CSV/Excel.
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn-primary">
          <Download className="w-4 h-4" />
          <span>Export Excel / CSV Report</span>
        </button>
      </div>

      {/* Report Preview Data Table */}
      <div className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Export Dataset Preview ({candidates.length} Records)</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading export preview...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Score / Max</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Security Score</th>
                  <th className="px-4 py-3">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-semibold text-slate-100">{c.candidateName}</td>
                    <td className="px-4 py-3 text-slate-400">{c.assessmentId?.name}</td>
                    <td className="px-4 py-3 font-mono font-bold">{c.score} / {c.maxScore}</td>
                    <td className="px-4 py-3 font-bold text-brand-400">{c.percentage}%</td>
                    <td className="px-4 py-3 font-mono">{c.suspiciousActivityScore} / 100</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
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
