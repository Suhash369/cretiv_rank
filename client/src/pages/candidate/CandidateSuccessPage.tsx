import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '../../components/Logo';

export const CandidateSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 text-center space-y-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white">Assessment Submitted Successfully</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your answers have been recorded and securely submitted for recruiter review. You may close this browser window now.
        </p>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          <Logo size="sm" showSubtitle={true} />
        </div>
      </div>
    </div>
  );
};
