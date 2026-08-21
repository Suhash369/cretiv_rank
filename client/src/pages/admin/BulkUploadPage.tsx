import React, { useState } from 'react';
import { api } from '../../services/api';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BulkUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReport(null);
    }
  };

  const handleValidateUpload = async () => {
    if (!file) return;
    setValidating(true);
    try {
      const res = await api.uploadValidateFile(file);
      setReport(res.report);
    } catch (err: any) {
      alert(err.message || 'Failed to validate uploaded file');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!report || !report.validatedRows) return;
    setImporting(true);
    try {
      const validRowsToImport = report.validatedRows
        .filter((r: any) => r.isValid)
        .map((r: any) => r.data);

      const res = await api.confirmImport(validRowsToImport);
      alert(res.message);
      navigate('/admin/questions');
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!report || !report.errorReportCsv) return;
    const blob = new Blob([report.errorReportCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `question_upload_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Bulk Excel / CSV Question Upload</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload bulk questions via structured CSV or Excel template. Validation performs dry-run inspection before import.
        </p>
      </div>

      {/* Upload Box */}
      <div className="glass-panel p-8 text-center space-y-4 border-2 border-dashed border-slate-700/80 hover:border-brand-500/50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-6 h-6" />
        </div>

        <div>
          <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Select CSV / XLSX File</span>
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" />
          </label>
          {file && (
            <p className="text-sm font-medium text-brand-400 mt-2">
              Selected File: <span className="text-slate-200">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Template format headers: <code>question, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, section, skill, difficulty, explanation</code>.
        </div>

        {file && !report && (
          <button onClick={handleValidateUpload} disabled={validating} className="btn-primary mx-auto">
            {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{validating ? 'Validating Columns & Rows...' : 'Dry-Run Validate File'}</span>
          </button>
        )}
      </div>

      {/* Validation Summary Report */}
      {report && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">Upload Validation Audit Report</h2>
            <div className="flex items-center gap-3">
              {report.invalidRows > 0 && (
                <button onClick={handleDownloadErrorReport} className="btn-secondary text-xs">
                  <Download className="w-4 h-4 text-rose-400" />
                  <span>Download Error Report CSV</span>
                </button>
              )}
              {report.validRows > 0 && (
                <button onClick={handleConfirmImport} disabled={importing} className="btn-primary text-xs">
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm & Import {report.validRows} Valid Rows</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics summary breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-center">
              <span className="text-xs text-slate-400 uppercase">Total Rows</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">{report.totalRows}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-400 uppercase">Valid Rows</span>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{report.validRows}</p>
            </div>
            <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-500/20 text-center">
              <span className="text-xs text-rose-400 uppercase">Invalid Rows</span>
              <p className="text-2xl font-bold text-rose-300 mt-1">{report.invalidRows}</p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 text-center">
              <span className="text-xs text-amber-400 uppercase">Duplicates</span>
              <p className="text-2xl font-bold text-amber-300 mt-1">{report.duplicateRows}</p>
            </div>
          </div>

          {/* Validation Rows Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Row #</th>
                  <th className="px-4 py-3">Question Prompt</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validation Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {report.validatedRows.map((r: any) => (
                  <tr key={r.rowNumber} className={!r.isValid ? 'bg-rose-500/5' : ''}>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.rowNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{r.data.question || '(Empty)'}</td>
                    <td className="px-4 py-3 text-slate-400">{r.data.section}</td>
                    <td className="px-4 py-3">
                      {r.isValid ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          VALID
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          INVALID
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.errors.length > 0 && (
                        <div className="text-rose-400 font-medium">{r.errors.join(' | ')}</div>
                      )}
                      {r.warnings.length > 0 && (
                        <div className="text-amber-400 text-[11px]">{r.warnings.join(' | ')}</div>
                      )}
                      {r.isValid && r.warnings.length === 0 && (
                        <span className="text-slate-500">Clean record</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
