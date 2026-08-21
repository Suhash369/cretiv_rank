import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  History,
  Archive,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { SECTIONS, QUESTION_TYPES, DIFFICULTIES } from '../../constants';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[] | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    question: '',
    questionType: 'MCQ',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1,
    section: 'Quantitative Aptitude',
    skill: 'General',
    difficulty: 'Medium',
    explanation: '',
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (selectedSection) query.append('section', selectedSection);
      if (selectedDifficulty) query.append('difficulty', selectedDifficulty);

      const res = await api.getQuestions(query.toString());
      setQuestions(res.questions);
    } catch (err) {
      console.error('Error fetching question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSection, selectedDifficulty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      questionType: 'MCQ',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      marks: 1,
      section: 'Quantitative Aptitude',
      skill: 'General',
      difficulty: 'Medium',
      explanation: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQuestion(q);
    const optA = q.options?.find((o: any) => o.id === 'A')?.text || '';
    const optB = q.options?.find((o: any) => o.id === 'B')?.text || '';
    const optC = q.options?.find((o: any) => o.id === 'C')?.text || '';
    const optD = q.options?.find((o: any) => o.id === 'D')?.text || '';

    setFormData({
      question: q.question,
      questionType: q.questionType,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : 'A',
      marks: q.marks,
      section: q.section,
      skill: q.skill,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    });
    setShowCreateModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options = [];
      if (formData.optionA) options.push({ id: 'A', text: formData.optionA });
      if (formData.optionB) options.push({ id: 'B', text: formData.optionB });
      if (formData.optionC) options.push({ id: 'C', text: formData.optionC });
      if (formData.optionD) options.push({ id: 'D', text: formData.optionD });

      const payload = {
        question: formData.question,
        questionType: formData.questionType,
        options,
        correctAnswer: formData.correctAnswer,
        marks: formData.marks,
        section: formData.section,
        skill: formData.skill,
        difficulty: formData.difficulty,
        explanation: formData.explanation,
      };

      if (editingQuestion) {
        await api.updateQuestion(editingQuestion._id, payload);
      } else {
        await api.createQuestion(payload);
      }

      setShowCreateModal(false);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to save question');
    }
  };

  const handleViewVersions = async (qId: string) => {
    try {
      const res = await api.getQuestionVersions(qId);
      setVersionHistory(res.versions);
    } catch (err) {
      alert('Failed to load version history');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Question Bank Repository</h1>
          <p className="text-slate-400 text-sm mt-1">
            Admin-owned question truth repository. Every question is uploaded or created manually.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search questions by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="input-field text-xs"
          >
            <option value="">All Sections</option>
            {SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input-field text-xs"
          >
            <option value="">Internal Difficulty (Admin-Only)</option>
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Data Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No questions found. Click "Add New Question" or use "Bulk Upload" to import questions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Question Text</th>
                  <th className="px-5 py-3.5">Section</th>
                  <th className="px-5 py-3.5">Skill</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Marks</th>
                  <th className="px-5 py-3.5">Internal Difficulty</th>
                  <th className="px-5 py-3.5">Version</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-100 max-w-md truncate">
                      {q.question}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs px-2.5 py-1 rounded-md font-medium">
                        {q.section}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{q.skill}</td>
                    <td className="px-5 py-4 text-xs font-mono">{q.questionType}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-200">{q.marks} pt</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {q.difficulty} (Admin)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">v{q.currentVersion}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="text-slate-400 hover:text-brand-400 p-1.5 rounded hover:bg-slate-800"
                        title="Edit Version"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewVersions(q._id)}
                        className="text-slate-400 hover:text-purple-400 p-1.5 rounded hover:bg-slate-800"
                        title="Version Audit"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {editingQuestion ? `Edit Question (Increments to v${editingQuestion.currentVersion + 1})` : 'Create New Question'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter clear, concise question prompt..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="input-field w-full"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Skill Tag</label>
                  <input
                    type="text"
                    required
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g. Percentage, SQL Joins, DAX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Question Type</label>
                  <select
                    value={formData.questionType}
                    onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                    className="input-field w-full"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value, 10) || 1 })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Internal Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input-field w-full"
                  >
                    {DIFFICULTIES.map((diff) => (
                      <option key={diff} value={diff}>
                        {diff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MCQ Options inputs */}
              {['MCQ', 'MULTIPLE_CHOICE'].includes(formData.questionType) && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 uppercase">Multiple Choice Options</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-brand-400 font-bold">Option A:</span>
                      <input
                        type="text"
                        value={formData.optionA}
                        onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                        className="input-field w-full mt-1"
                        placeholder="Option A text..."
                      />
                    </div>
                    <div>
                      <span className="text-xs text-brand-400 font-bold">Option B:</span>
                      <input
                        type="text"
                        value={formData.optionB}
                        onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                        className="input-field w-full mt-1"
                        placeholder="Option B text..."
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold">Option C:</span>
                      <input
                        type="text"
                        value={formData.optionC}
                        onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                        className="input-field w-full mt-1"
                        placeholder="Option C text..."
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold">Option D:</span>
                      <input
                        type="text"
                        value={formData.optionD}
                        onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                        className="input-field w-full mt-1"
                        placeholder="Option D text..."
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Correct Answer Choice</label>
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      className="input-field w-full border-emerald-500/40 focus:border-emerald-500"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Explanation (ADMIN-ONLY) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Internal Explanation (Admin-Only)</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="input-field w-full"
                  placeholder="Rationale or solution breakdown..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingQuestion ? 'Save Version' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Question Preview</h3>
              <button onClick={() => setPreviewQuestion(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-100">{previewQuestion.question}</div>

              {previewQuestion.options?.map((opt: any) => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                    opt.id === previewQuestion.correctAnswer
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span>
                    <strong className="mr-2">{opt.id}.</strong> {opt.text}
                  </span>
                  {opt.id === previewQuestion.correctAnswer && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      Correct Choice (Admin View)
                    </span>
                  )}
                </div>
              ))}

              {previewQuestion.explanation && (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400">
                  <strong className="text-slate-200">Explanation:</strong> {previewQuestion.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Immutable Question Version Audit</h3>
              <button onClick={() => setVersionHistory(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {versionHistory.map((ver: any) => (
                <div key={ver._id} className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-400 font-mono">Version {ver.version}</span>
                    <span className="text-slate-500">{new Date(ver.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{ver.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
