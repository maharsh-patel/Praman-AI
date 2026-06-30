import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndUploadFile = async (file) => {
    setError(null);
    setSuccess(null);

    // Validate size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    // Validate extension
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError('Invalid file format. Please upload a CSV or Excel file.');
      return;
    }

    // Prepare upload
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Connects to the local Express backend
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server error uploading file.');
      }

      setSuccess(`Successfully parsed "${file.name}"!`);
      // Propagate data to parent component
      onUploadSuccess({
        metadata: result.metadata,
        previewRows: result.previewRows,
        fullData: result.fullData,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to the backend server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-brand-500 bg-brand-950/20 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv, .xlsx, .xls"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-4 animate-pulse">
            <Loader className="w-16 h-16 text-brand-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-lg font-medium text-slate-200">Parsing Dataset...</p>
              <p className="text-sm text-slate-400">Extracting columns & executing statistical profiling...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-brand-500 animate-float">
              <FileSpreadsheet className="w-12 h-12" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-200">
                Drag & drop your dataset here, or <span className="text-brand-500 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Supports CSV, XLSX, XLS files up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload State Alerts */}
      {error && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-green-950/30 border border-green-900/50 rounded-xl text-green-200 text-sm">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p>{success}</p>
        </div>
      )}
    </div>
  );
}
