import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  BrainCircuit,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  File,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from './Toast';

export function DocumentHub({
  documents,
  onRefreshDocuments,
  onSelectDocumentForAnalysis,
  showToast,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'pdf' | 'docx' | 'txt'
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const uploadFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      showToast?.('error', 'Unsupported File Type', 'Please upload a PDF (.pdf), Word (.docx), or Text (.txt) file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast?.('error', 'File Too Large', 'Maximum allowed file size is 25MB.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.documents.upload(file, true);
      showToast?.('success', 'Document Processed', `Successfully extracted text from ${file.name} (${res.word_count} words).`);
      onRefreshDocuments?.();
    } catch (err) {
      showToast?.('error', 'Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId, filename, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete '${filename}'? This will also remove associated AI analysis.`)) return;

    try {
      await api.documents.delete(docId);
      showToast?.('info', 'Document Removed', `${filename} deleted from knowledge base.`);
      if (selectedDocPreview?.id === docId) {
        setSelectedDocPreview(null);
      }
      onRefreshDocuments?.();
    } catch (err) {
      showToast?.('error', 'Delete Failed', err.message);
    }
  };

  const handleViewPreview = async (doc, e) => {
    e?.stopPropagation();
    setIsLoadingPreview(true);
    try {
      const fullDoc = await api.documents.get(doc.id);
      setSelectedDocPreview(fullDoc);
    } catch (err) {
      showToast?.('error', 'Preview Error', err.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const filteredDocs = (documents || []).filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.file_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-950/30 scale-[1.01]'
            : 'border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {isUploading ? 'Extracting & Ingesting Handover Document...' : 'Upload Handover Document'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-3">
            Drag & drop PDF, Word (.docx), or Text (.txt) transition notes, runbooks, or architecture briefs.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">PyMuPDF</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">python-docx</span>
            <span>•</span>
            <span>Max 25MB</span>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <LoadingSpinner text="Extracting text and running Gemini AI analysis..." />
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'pdf', 'docx', 'txt'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      doc.file_type === 'pdf'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : doc.file_type === 'docx'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {doc.file_type?.toUpperCase()}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 truncate" title={doc.filename}>
                  {doc.filename}
                </h4>

                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Words:</span>
                    <span className="text-slate-200 font-mono">{doc.word_count?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Characters:</span>
                    <span className="text-slate-200 font-mono">{doc.char_count?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="text-slate-200 font-mono">{(doc.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleViewPreview(doc, e)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  title="Inspect extracted text"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => onSelectDocumentForAnalysis?.(doc)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  title="View AI Analysis"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Analysis</span>
                </button>

                <a
                  href={api.documents.getDownloadUrl(doc.id)}
                  download
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={(e) => handleDelete(doc.id, doc.filename, e)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents match your filter"
          description="Try clearing your search query or upload a new transition document."
          actionText="Upload Document"
          onAction={() => fileInputRef.current?.click()}
        />
      )}

      {/* Extracted Text Inspector Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>{selectedDocPreview.filename}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted via {selectedDocPreview.file_type === 'pdf' ? 'PyMuPDF' : selectedDocPreview.file_type === 'docx' ? 'python-docx' : 'text parser'} • {selectedDocPreview.word_count} words
                </p>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extracted Content Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/70 border-b border-slate-800 leading-relaxed">
              {selectedDocPreview.extracted_text || '(Empty document)'}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 flex items-center justify-between">
              <a
                href={api.documents.getDownloadUrl(selectedDocPreview.id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original</span>
              </a>

              <button
                onClick={() => {
                  onSelectDocumentForAnalysis?.(selectedDocPreview);
                  setSelectedDocPreview(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Full Structured Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

