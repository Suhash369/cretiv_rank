import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, setCandidateToken } from '../../services/api';
import { ShieldCheck, Camera, Check, ArrowRight, Lock } from 'lucide-react';

import { Logo } from '../../components/Logo';

export const CandidateConsent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [photoCaptured, setPhotoCaptured] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((st) => {
      if (videoRef.current) videoRef.current.srcObject = st;
    }).catch(() => {});
  }, []);

  const handleStartAssessment = async () => {
    if (!token || !hasConsented) return;
    setLoading(true);
    try {
      const res = await api.startCandidateAttempt({
        token,
        identityPhotoUrl: photoCaptured ? 'captured_photo_data_url' : '',
      });

      setCandidateToken(res.token);
      sessionStorage.setItem('cretivrank_assessment_session', JSON.stringify(res));
      navigate('/candidate/assessment-room', { state: res });
    } catch (err: any) {
      alert(err.message || 'Failed to initialize assessment room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl p-8 space-y-6">
        <div>
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mt-3 mb-1">
            <Lock className="w-4 h-4" /> Identity Verification & Privacy Disclosure
          </div>
          <h1 className="text-xl font-bold text-white">Proctoring Consent & Identity Snapshot</h1>
        </div>

        {/* Video feed snapshot */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover rounded-lg bg-black mx-auto" />
          <button
            onClick={() => setPhotoCaptured(true)}
            type="button"
            className="btn-secondary text-xs py-1.5 mx-auto inline-flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{photoCaptured ? '✓ Identity Photo Captured' : 'Take Verification Snapshot'}</span>
          </button>
        </div>

        {/* Consent terms */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-2">
          <h3 className="font-semibold text-slate-200">Consent & Privacy Overview:</h3>
          <p className="leading-relaxed">
            By proceeding, you explicitly grant consent for webcam activity signals, window focus monitoring, and full-screen proctoring during the assessment duration. Data is securely retained strictly for recruiter review.
          </p>
        </div>

        <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer text-xs text-slate-200">
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(e) => setHasConsented(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded border-slate-700 bg-slate-950 focus:ring-brand-500"
          />
          <span className="font-medium">I have read, understood, and explicitly grant proctoring consent.</span>
        </label>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleStartAssessment}
            disabled={!hasConsented || loading}
            className="btn-primary w-full py-3 text-sm"
          >
            <span>{loading ? 'Launching Secure Examination Room...' : 'Enter Secure Assessment Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
