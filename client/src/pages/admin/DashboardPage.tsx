import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  FileCheck2,
  Users,
  Award,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Mic,
  ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.getDashboardSummary();
        setSummary(res.summary);
        setDistribution(res.distribution);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading dashboard metrics...
      </div>
    );
  }

  const cards = [
    { title: 'Total Assessments', value: summary?.totalAssessments || 0, icon: FileCheck2, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { title: 'Active Assessments', value: summary?.activeAssessments || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Total Candidates', value: summary?.totalCandidates || 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Average Score', value: `${summary?.averageScore || 0}%`, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Pass Rate', value: `${summary?.passRate || 0}%`, icon: BarChart2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { title: 'Pending Verifications', value: summary?.pendingVerifications || 0, icon: Mic, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Suspicious Attempts', value: summary?.suspiciousAttempts || 0, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recruitment Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of assessment performance, candidate submissions, proctoring signals & verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/assessments" className="btn-primary">
            + New Assessment
          </Link>
          <Link to="/admin/upload" className="btn-secondary">
            Bulk Question Upload
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{card.value}</h3>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-200">Candidate Score Distribution</h2>
            <span className="text-xs text-slate-400">Percentages bucketed in 20% intervals</span>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#0c8ef2" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Security Alert Box */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-200">System Security Engine</h2>
            <p className="text-xs text-slate-400 mt-1">
              Server-authoritative timer enforcement active. Difficulty levels strictly hidden from candidates.
            </p>

            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-400">
                <ShieldAlert className="w-4 h-4" /> Proctored Security Signals
              </span>
              <p className="text-[11px] text-rose-200/80">
                Candidates with suspicious scores &gt; 20 are flagged for post-assessment verification interviews.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <Link
              to="/admin/interviews"
              className="w-full btn-secondary text-xs flex items-center justify-between"
            >
              <span>Review Verification Interviews</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/results"
              className="w-full btn-secondary text-xs flex items-center justify-between"
            >
              <span>View Candidate Performance</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
