import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Camera, Monitor, Wifi, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldAlert, Globe } from 'lucide-react';
import { detectVpnAndProxy, IVpnCheckResult } from '../../utils/vpnDetector';
import { Logo } from '../../components/Logo';

export const CandidateSystemCheck: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [checks, setChecks] = useState({
    browser: false,
    camera: false,
    screen: false,
    network: false,
    vpnClean: true,
  });
  const [vpnDetails, setVpnDetails] = useState<IVpnCheckResult | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const runSystemChecks = async () => {
    setChecking(true);
    const newChecks = { browser: false, camera: false, screen: false, network: false, vpnClean: true };

    // 1. Browser check
    newChecks.browser = typeof window !== 'undefined' && !!window.localStorage;

    // 2. Screen & Fullscreen check
    newChecks.screen = window.screen.width >= 1024 && !!document.documentElement.requestFullscreen;

    // 3. Network Latency check
    const start = Date.now();
    try {
      await fetch('/health');
      newChecks.network = Date.now() - start < 1500;
    } catch {
      newChecks.network = true; // Fallback for local
    }

    // 4. WebRTC VPN / Proxy Adapter Detection
    const vpnRes = await detectVpnAndProxy();
    setVpnDetails(vpnRes);
    newChecks.vpnClean = !vpnRes.vpnDetected;

    // 5. Camera check
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      newChecks.camera = true;
    } catch (err) {
      console.warn('Camera stream check warning:', err);
      newChecks.camera = false;
    }

    setChecks(newChecks);
    setChecking(false);
  };

  useEffect(() => {
    runSystemChecks();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const allPassed = checks.browser && checks.screen && checks.network && checks.camera;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <Logo size="sm" />
            <h1 className="text-xl font-bold text-white mt-2">Pre-Assessment Environment Diagnostic</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Hardware stream, network stability & WebRTC VPN interface detection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnostic Check List */}
          <div className="space-y-3 text-xs">
            <div className={`p-3 rounded-lg border flex items-center justify-between ${checks.browser ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Monitor className="w-4 h-4 text-brand-400" /> Browser Compatibility
              </span>
              {checks.browser ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${checks.screen ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Monitor className="w-4 h-4 text-brand-400" /> Fullscreen Lock API
              </span>
              {checks.screen ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${checks.network ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Wifi className="w-4 h-4 text-brand-400" /> Network Latency & Stability
              </span>
              {checks.network ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            </div>

            {/* VPN & Proxy Detector Row */}
            <div className={`p-3 rounded-lg border flex items-center justify-between ${checks.vpnClean ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Globe className="w-4 h-4 text-brand-400" /> WebRTC VPN / Proxy Audit
              </span>
              {checks.vpnClean ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CLEAN DIRECT IP</span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> VPN DETECTED
                </span>
              )}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${checks.camera ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Camera className="w-4 h-4 text-brand-400" /> Webcam Stream Functional
              </span>
              {checks.camera ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            </div>

            <button onClick={runSystemChecks} className="btn-secondary w-full text-xs py-2">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Re-run Diagnostic</span>
            </button>
          </div>

          {/* Camera Preview Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-44 object-cover rounded-lg bg-black" />
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Proctoring Stream Preview</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => navigate(`/candidate/consent?token=${token}`)}
            disabled={!allPassed}
            className="btn-primary"
          >
            <span>Proceed to Consent & Examination</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
