import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, getCandidateToken } from '../../services/api';
import { Clock, ShieldAlert, CheckCircle2, Bookmark, ChevronLeft, ChevronRight, Send, AlertTriangle, Users, Eye } from 'lucide-react';
import { detectVpnAndProxy } from '../../utils/vpnDetector';
import { detectFacesInVideo } from '../../utils/faceDetector';

export const CandidateAssessmentRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [fullscreenWarning, setFullscreenWarning] = useState<boolean>(false);
  const [faceAnomalyWarning, setFaceAnomalyWarning] = useState<string | null>(null);
  const [faceCount, setFaceCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize Exam Session & Load Questions
  useEffect(() => {
    const token = getCandidateToken();

    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Request Webcam Stream
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {});

    if (!token) {
      setLoading(false);
      return;
    }

    // Re-verify session & fetch active attempt payload
    const initSession = async () => {
      setLoading(true);
      try {
        let sessionData = location.state;
        if (!sessionData) {
          const stored = sessionStorage.getItem('cretivrank_assessment_session');
          if (stored) {
            try { sessionData = JSON.parse(stored); } catch {}
          }
        }

        if (sessionData && sessionData.questions && sessionData.questions.length > 0) {
          setQuestions(sessionData.questions);
          setAssessment(sessionData.assessment || null);
          setRemainingSeconds(sessionData.remainingSeconds || 3600);
          if (sessionData.savedAnswers) setAnswers(sessionData.savedAnswers);
        } else {
          // Fetch from API directly if refreshed
          const res = await api.getCurrentCandidateAttempt();
          setQuestions(res.questions || []);
          setAssessment(res.assessment || null);
          setRemainingSeconds(res.remainingSeconds || 3600);
          if (res.savedAnswers) setAnswers(res.savedAnswers);
          sessionStorage.setItem('cretivrank_assessment_session', JSON.stringify(res));
        }

        // Non-blocking background VPN check
        detectVpnAndProxy().then((vpnRes) => {
          if (vpnRes.vpnDetected) {
            api.logProctoringEvent({
              eventType: 'VPN_DETECTED',
              severity: 'MEDIUM',
              metadata: { details: vpnRes.details, localIp: vpnRes.localIp },
            }).catch(() => {});
          }
        }).catch(() => {});
      } catch (err: any) {
        console.error('Session init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // ----------------------------------------------------
  // PROCTORING & SECURITY SIGNAL LISTENERS (Phase 15 & Rule 4)
  // ----------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        api.logProctoringEvent({
          eventType: 'TAB_SWITCH',
          severity: 'MEDIUM',
          metadata: { timestamp: new Date() },
        }).catch(() => {});
      }
    };

    const handleWindowBlur = () => {
      api.logProctoringEvent({
        eventType: 'WINDOW_BLUR',
        severity: 'LOW',
        metadata: { timestamp: new Date() },
      }).catch(() => {});
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenWarning(true);
        api.logProctoringEvent({
          eventType: 'FULLSCREEN_EXIT',
          severity: 'HIGH',
          metadata: { timestamp: new Date() },
        }).catch(() => {});
      } else {
        setFullscreenWarning(false);
      }
    };

    const handleCopy = () => {
      api.logProctoringEvent({ eventType: 'COPY_ATTEMPT', severity: 'LOW' }).catch(() => {});
    };

    const handlePaste = () => {
      api.logProctoringEvent({ eventType: 'PASTE_ATTEMPT', severity: 'LOW' }).catch(() => {});
    };

    const handleCut = () => {
      api.logProctoringEvent({ eventType: 'CUT_ATTEMPT', severity: 'LOW' }).catch(() => {});
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      api.logProctoringEvent({ eventType: 'RIGHT_CLICK', severity: 'LOW' }).catch(() => {});
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        api.logProctoringEvent({
          eventType: 'KEYBOARD_SHORTCUT',
          severity: 'HIGH',
          metadata: { shortcut: e.key, combination: 'DevTools/ViewSource' },
        }).catch(() => {});
      }
    };

    const handleResize = () => {
      if (window.outerWidth < window.screen.width * 0.85 || window.outerHeight < window.screen.height * 0.85) {
        api.logProctoringEvent({
          eventType: 'WINDOW_BLUR',
          severity: 'MEDIUM',
          metadata: { outerWidth: window.outerWidth, outerHeight: window.outerHeight, type: 'WINDOW_RESIZED' },
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ----------------------------------------------------
  // REAL-TIME MULTIPLE FACE & ABSENCE DETECTION SCANNER
  // ----------------------------------------------------
  useEffect(() => {
    const scanInterval = setInterval(async () => {
      if (!videoRef.current || loading) return;
      try {
        const result = await detectFacesInVideo(videoRef.current);
        setFaceCount(result.faceCount);

        if (result.multipleFacesDetected) {
          const warningText = `🚨 PROCTORING ANOMALY: MULTIPLE FACES DETECTED IN CAMERA FEED (${result.faceCount} Persons)`;
          setFaceAnomalyWarning(warningText);

          api.logProctoringEvent({
            eventType: 'MULTIPLE_FACES_DETECTED',
            severity: 'HIGH',
            metadata: { details: result.details, faceCount: result.faceCount },
          }).catch(() => {});
        } else if (result.noFaceDetected) {
          const warningText = '⚠️ PROCTORING ALERT: CANDIDATE FACE NOT DETECTED IN CAMERA FEED';
          setFaceAnomalyWarning(warningText);

          api.logProctoringEvent({
            eventType: 'NO_FACE_DETECTED',
            severity: 'MEDIUM',
            metadata: { details: result.details },
          }).catch(() => {});
        } else {
          setFaceAnomalyWarning(null);
        }
      } catch (err) {
        console.error('Face scanning error:', err);
      }
    }, 3500);

    return () => clearInterval(scanInterval);
  }, [loading]);

  // ----------------------------------------------------
  // SERVER-AUTHORITATIVE TIMER COUNTDOWN
  // ----------------------------------------------------
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  // ----------------------------------------------------
  // CONTINUOUS BACKGROUND AUTOSAVE (Phase 11)
  // ----------------------------------------------------
  const handleAnswerSelect = (questionId: string, questionVersion: number, val: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
    setSaveStatus('Saving...');

    api.saveAnswer({
      questionId,
      questionVersion,
      answer: val,
      timeSpent: 5,
    })
      .then(() => {
        setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`);
      })
      .catch((err) => {
        if (err.isExpired) {
          handleAutoSubmit();
        } else {
          setSaveStatus('Error saving');
        }
      });
  };

  const handleAutoSubmit = async () => {
    try {
      await api.submitAttempt();
      sessionStorage.removeItem('cretivrank_assessment_session');
      navigate('/candidate/success');
    } catch {
      sessionStorage.removeItem('cretivrank_assessment_session');
      navigate('/candidate/success');
    }
  };

  const handleSubmit = async () => {
    try {
      await api.submitAttempt();
      sessionStorage.removeItem('cretivrank_assessment_session');
      navigate('/candidate/success');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const handleReenterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setFullscreenWarning(false);
      }).catch(() => {});
    }
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || null;
  const activeAnswer = currentQ ? (answers[currentQ.questionId] || '') : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-slate-200 font-semibold text-sm">Launching Secure Examination Room...</div>
        <div className="text-xs text-slate-500">Decrypting question bank and syncing server countdown timer</div>
      </div>
    );
  }

  if (!currentQ || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="glass-panel p-8 max-w-lg space-y-5 border-amber-500/30">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Direct Assessment Room Access Not Permitted</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assessment examination rooms are cryptographically secured and must be initiated through your candidate single-use access link.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="font-semibold text-slate-300">How to access your assessment:</div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 text-[11px]">
              <li>Use the exact invitation link sent to your email.</li>
              <li>Or click below to test the platform using the sample candidate flow.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/candidate/invite/demo-candidate-token-2026')}
              className="btn-primary w-full sm:w-auto text-xs py-2.5 px-4"
            >
              Launch Demo Candidate Flow
            </button>
            <button
              onClick={() => navigate('/admin/invitations')}
              className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4"
            >
              Recruiter Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-none select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-white">Assessment Examination Room</h1>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>Autosave: <strong className="text-emerald-400">{saveStatus}</strong></span>
          </div>
        </div>

        {/* Server Countdown Clock */}
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-lg ${
              remainingSeconds < 300
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-brand-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>{formatTime(remainingSeconds || 3600)}</span>
          </div>

          <button onClick={() => setShowSubmitModal(true)} className="btn-primary py-2 text-xs bg-emerald-600 hover:bg-emerald-500">
            <Send className="w-3.5 h-3.5" />
            <span>Submit Assessment</span>
          </button>
        </div>
      </header>

      {/* Face Anomaly & Security Violation Alert Banner */}
      {faceAnomalyWarning && (
        <div className="bg-rose-600/90 text-white px-6 py-2 text-xs font-bold flex items-center justify-between animate-pulse border-b border-rose-500 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white shrink-0" />
            <span>{faceAnomalyWarning}</span>
          </div>
          <span className="text-[10px] bg-rose-950/80 px-2 py-0.5 rounded text-rose-200 uppercase font-mono">
            Proctoring Signal Logged
          </span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar: Question Palette & Proctoring PIP Video */}
        <aside className="w-72 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Question Navigator</h2>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((qObj, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[qObj.questionId];
                const isMarked = markedForReview[qObj.questionId];

                return (
                  <button
                    key={qObj.questionId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 w-full rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isMarked
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Picture-in-Picture Proctoring Feed */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> AI Face Scanner
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  faceCount > 1
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : faceCount === 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {faceCount > 1 ? `🚨 ${faceCount} Faces Detected!` : faceCount === 0 ? '⚠️ No Face' : '✓ 1 Face Verified'}
              </span>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-28 object-cover rounded-lg bg-black border ${
                faceCount > 1 ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800'
              }`}
            />
          </div>
        </aside>

        {/* Center Main Question Canvas */}
        <main className="flex-1 p-8 overflow-y-auto space-y-6 max-w-4xl mx-auto">
          {/* Question Metadata Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length || 15}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded font-medium">
                  {currentQ.section}
                </span>
                <span className="text-xs text-slate-400">{currentQ.skill}</span>
              </div>
            </div>

            <button
              onClick={() => setMarkedForReview({ ...markedForReview, [currentQ.questionId]: !markedForReview[currentQ.questionId] })}
              className={`btn-secondary text-xs py-1.5 ${markedForReview[currentQ.questionId] ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : ''}`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{markedForReview[currentQ.questionId] ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* Question Prompt */}
          <div className="text-base font-medium text-slate-100 leading-relaxed space-y-2">
            <p>{currentQ.question}</p>
          </div>

          {/* Question Answer Renderers */}
          {['MCQ', 'MULTIPLE_CHOICE'].includes(currentQ.questionType) && (
            <div className="space-y-3 pt-2">
              {currentQ.options?.map((opt: any) => {
                const isSelected = activeAnswer === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleAnswerSelect(currentQ.questionId, currentQ.questionVersion, opt.id)}
                    className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 text-white shadow-lg shadow-brand-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-brand-500 border-brand-400 text-white' : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <span>{opt.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {['NUMERICAL', 'SHORT_ANSWER'].includes(currentQ.questionType) && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Your Answer</label>
              <input
                type="text"
                value={activeAnswer}
                onChange={(e) => handleAnswerSelect(currentQ.questionId, currentQ.questionVersion, e.target.value)}
                className="input-field w-full text-base font-mono py-3"
                placeholder="Type numerical or short answer..."
              />
            </div>
          )}

          {['SQL', 'PYTHON', 'CODING', 'CASE_STUDY', 'LONG_ANALYTICAL'].includes(currentQ.questionType) && (
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">Solution Workspace ({currentQ.questionType})</label>
              <textarea
                rows={8}
                value={activeAnswer}
                onChange={(e) => handleAnswerSelect(currentQ.questionId, currentQ.questionVersion, e.target.value)}
                className="input-field w-full font-mono text-xs leading-relaxed bg-slate-950 border-slate-800 p-4"
                placeholder="Write your code or analytical answer here..."
              />
            </div>
          )}

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-800">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="btn-secondary text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <button
              disabled={questions.length === 0 || currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="btn-primary text-xs"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Fullscreen Exit Warning Overlay */}
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md text-center space-y-4 border-rose-500/50">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-white">Security Warning: Fullscreen Exited</h2>
            <p className="text-xs text-slate-400">
              Leaving full-screen mode has been recorded as a proctoring security event. Please re-enter full screen to continue your assessment.
            </p>
            <button onClick={handleReenterFullscreen} className="btn-danger w-full py-3 text-sm">
              Re-Enter Secure Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Confirm Assessment Submission</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to submit your assessment? Once submitted, your answers cannot be modified.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setShowSubmitModal(false)} className="btn-secondary text-xs">
                Return to Exam
              </button>
              <button onClick={handleSubmit} className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500">
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
