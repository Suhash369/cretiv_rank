import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileCheck2, Plus, CheckCircle2, Shield, Clock, AlertCircle, X, HelpCircle, Layers } from 'lucide-react';
import { SECTIONS, NAVIGATION_MODES } from '../../constants';

export const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    jobRole: 'Data Analyst',
    duration: 60,
    passingScorePercentage: 60,
    navigationMode: 'FREE',
    questionRandomization: true,
    optionRandomization: true,
    sections: [
      { name: 'Quantitative Aptitude', questionCount: 5 },
      { name: 'Probability & Statistics', questionCount: 5 },
      { name: 'Data Interpretation', questionCount: 5 },
      { name: 'Logical Reasoning', questionCount: 5 },
      { name: 'SQL & Python', questionCount: 5 },
    ],
    security: {
      webcamRequired: true,
      micRequired: false,
      identityVerification: true,
      fullscreenRequired: true,
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const assRes = await api.getAssessments();
      const qRes = await api.getQuestions();
      setAssessments(assRes.assessments);
      setQuestionBank(qRes.questions || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate total questions in current assessment draft
  const totalQuestionsCount = formData.sections.reduce((sum, sec) => sum + (sec.questionCount || 0), 0);

  // Count available questions in Question Bank for a specific section
  const getAvailableCountForSection = (sectionName: string) => {
    return questionBank.filter((q) => q.section === sectionName && q.status !== 'ARCHIVED').length;
  };

  const handleAddSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { name: 'Business Analytics', questionCount: 5 }],
    });
  };

  const handleRemoveSection = (index: number) => {
    if (formData.sections.length <= 1) {
      alert('Assessment must contain at least 1 section.');
      return;
    }
    const updated = [...formData.sections];
    updated.splice(index, 1);
    setFormData({ ...formData, sections: updated });
  };

  const handleSectionNameChange = (index: number, newName: string) => {
    const updated = [...formData.sections];
    updated[index].name = newName;
    setFormData({ ...formData, sections: updated });
  };

  const handleSectionQuestionCountChange = (index: number, count: number) => {
    const updated = [...formData.sections];
    updated[index].questionCount = Math.max(1, count);
    setFormData({ ...formData, sections: updated });
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssessment(formData);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create assessment');
    }
  };

  const handlePublishAssessment = async (id: string) => {
    try {
      const res = await api.publishAssessment(id);
      alert(res.message);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish assessment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Assessment Suite Builder</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure section question counts, section pool rules, server timers & proctoring security levels.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {/* Assessment List */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No assessments created yet. Click "Create New Assessment" to build one.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {assessments.map((a) => {
              const totalQ = a.sections?.reduce((sum: number, s: any) => sum + (s.questionCount || 0), 0) || 0;

              return (
                <div key={a._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900/40 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{a.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          a.state === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {a.state} (v{a.version})
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 max-w-xl">{a.description || 'No description provided.'}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        Job Role: <span className="text-brand-400">{a.jobRole}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-200 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        <Layers className="w-3.5 h-3.5 text-brand-400" />
                        Total Questions: <span className="text-emerald-400 font-mono text-sm ml-1">{totalQ}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {a.duration} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        {a.security?.webcamRequired ? 'Webcam On' : 'No Webcam'} | Fullscreen Locked
                      </span>
                    </div>

                    {/* Section Breakdown Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {a.sections?.map((sec: any, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                        >
                          <span className="font-medium text-slate-200">{sec.name}:</span>
                          <strong className="text-brand-400 font-mono">{sec.questionCount} Qs</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {a.state !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublishAssessment(a._id)}
                        className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validate & Publish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assessment Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Assessment Builder Wizard</h2>
                <p className="text-xs text-slate-400">Configure parameters & section question distribution.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-6">
              {/* General Parameters */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">1. Assessment Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assessment Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field w-full"
                      placeholder="e.g. Data Analyst Hiring Round 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Job Role</label>
                    <input
                      type="text"
                      required
                      value={formData.jobRole}
                      onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                      className="input-field w-full"
                      placeholder="e.g. Data Analyst"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={10}
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 60 })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Passing Score (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.passingScorePercentage}
                      onChange={(e) => setFormData({ ...formData, passingScorePercentage: parseInt(e.target.value, 10) || 60 })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Navigation Mode</label>
                    <select
                      value={formData.navigationMode}
                      onChange={(e) => setFormData({ ...formData, navigationMode: e.target.value as any })}
                      className="input-field w-full text-xs"
                    >
                      {NAVIGATION_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode} Navigation
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Question Count Selection Area */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                      2. Section Question Count Configuration
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Specify exactly how many questions each section should contain in candidate attempts.
                    </p>
                  </div>
                  <button type="button" onClick={handleAddSection} className="btn-secondary text-xs py-1 px-3">
                    + Add Section
                  </button>
                </div>

                {/* Total Questions Counter Banner */}
                <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-400" /> Total Questions in Assessment:
                  </span>
                  <span className="text-base font-extrabold text-brand-400 font-mono">
                    {totalQuestionsCount} Questions
                  </span>
                </div>

                {/* Section Input Rows */}
                <div className="space-y-3">
                  {formData.sections.map((sec, idx) => {
                    const availableInBank = getAvailableCountForSection(sec.name);
                    const isSufficient = availableInBank >= sec.questionCount;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Section Dropdown */}
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                              Section Name
                            </label>
                            <select
                              value={sec.name}
                              onChange={(e) => handleSectionNameChange(idx, e.target.value)}
                              className="input-field w-full text-xs font-semibold"
                            >
                              {SECTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* How many questions in this section input */}
                          <div className="w-full sm:w-48">
                            <label className="block text-[10px] font-semibold text-emerald-400 uppercase mb-1">
                              Questions in this Section
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                value={sec.questionCount}
                                onChange={(e) =>
                                  handleSectionQuestionCountChange(idx, parseInt(e.target.value, 10) || 1)
                                }
                                className="input-field w-full text-xs font-bold text-center font-mono border-emerald-500/40 focus:border-emerald-500"
                              />
                              <span className="text-xs text-slate-400 font-medium shrink-0">Qs</span>
                            </div>
                          </div>

                          {/* Delete Section Action */}
                          <div className="flex items-end justify-end pt-4 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                              title="Remove section"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Section Bank Availability Footer */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400">
                            Question Bank Availability:{' '}
                            <strong className={isSufficient ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                              {availableInBank} questions available in bank
                            </strong>
                          </span>

                          {!isSufficient && (
                            <span className="text-rose-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Needs {sec.questionCount - availableInBank} more in bank
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security & Proctoring Settings */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">3. Proctoring & Security Rules</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.webcamRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, webcamRequired: e.target.checked },
                        })
                      }
                    />
                    <span>Webcam Monitoring</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.fullscreenRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, fullscreenRequired: e.target.checked },
                        })
                      }
                    />
                    <span>Fullscreen Lock</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.identityVerification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, identityVerification: e.target.checked },
                        })
                      }
                    />
                    <span>Pre-Exam Photo ID Check</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Assessment Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
