import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ShieldCheck, Clock, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

import { Logo } from '../../components/Logo';

export const CandidateInviteLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduledFuture, setIsScheduledFuture] = useState<boolean>(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [scheduleStartTime, setScheduleStartTime] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInv = async () => {
      if (!token) return;
      try {
        const res = await api.getInvitationByToken(token);
        setInvitation(res.invitation);
        if (res.isScheduledFuture) {
          setIsScheduledFuture(true);
          setRemainingSecs(res.remainingSecondsUntilStart || 0);
          setScheduleStartTime(res.scheduleStartTime);
        }
      } catch (err: any) {
        setError(err.message || 'Invalid assessment invitation token.');
      } finally {
        setLoading(false);
      }
    };
    fetchInv();
  }, [token]);

  // Live countdown timer for future scheduled exam link
  useEffect(() => {
    if (!isScheduledFuture || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsScheduledFuture(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isScheduledFuture, remainingSecs]);

  const formatFutureCountdown = (totalSec: number) => {
    const days = Math.floor(totalSec / (3600 * 24));
    const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}h : ${mins
      .toString()
      .padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Validating candidate invitation...
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-lg font-bold text-white">Invitation Link Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'This link is invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  const assessment = invitation.assessmentId;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <Logo size="sm" />
            <h1 className="text-xl font-bold text-white mt-2">{assessment.name}</h1>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>

        {/* Scheduled Future Window Banner */}
        {isScheduledFuture && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" /> Scheduled Examination Window
            </div>
            <p className="text-xs text-slate-300">
              This assessment is scheduled for <strong className="text-white">{scheduleStartTime ? new Date(scheduleStartTime).toLocaleString() : 'Future Date'}</strong>.
            </p>
            <div className="font-mono text-2xl font-black text-amber-400 tracking-wider pt-1">
              {formatFutureCountdown(remainingSecs)}
            </div>
            <p className="text-[11px] text-slate-400">The test link will automatically unlock when the countdown reaches 0.</p>
          </div>
        )}

        <div className="space-y-3 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Candidate Name</span>
              <strong className="text-slate-100 font-semibold">{invitation.candidateName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Target Position</span>
              <strong className="text-brand-400 font-semibold">{invitation.jobRole}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Duration Limit</span>
              <strong className="text-slate-100 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {assessment.duration} Minutes
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Security Checks</span>
              <strong className="text-emerald-400 font-semibold">Webcam & Fullscreen Required</strong>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-semibold text-slate-200 uppercase text-[11px]">Assessment Instructions</h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
              <li>You must complete mandatory browser, webcam, and fullscreen system checks.</li>
              <li>Once initiated, the countdown timer is server-controlled and runs continuously.</li>
              <li>Your answers are saved automatically in real-time.</li>
              <li>Do not leave full-screen mode or switch windows during the examination.</li>
            </ul>
          </div>
        </div>

        <button
          disabled={isScheduledFuture}
          onClick={() => navigate(`/candidate/system-check?token=${token}`)}
          className={`w-full py-3 text-sm mt-4 ${
            isScheduledFuture
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2'
              : 'btn-primary'
          }`}
        >
          <span>
            {isScheduledFuture
              ? `Link Opens on ${scheduleStartTime ? new Date(scheduleStartTime).toLocaleDateString() : 'Scheduled Date'}`
              : 'Begin Pre-Assessment System Check'}
          </span>
          {!isScheduledFuture && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
