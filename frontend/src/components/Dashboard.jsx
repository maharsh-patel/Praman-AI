import React, { useState } from 'react';
import { LayoutDashboard, FileSpreadsheet, BarChart3, Sparkles, LogOut, Download } from 'lucide-react';
import FileUpload from './FileUpload';
import DataPreview from './DataPreview';
import Visualizations from './Visualizations';
import InsightPanel from './InsightPanel';

export default function Dashboard() {
  const [dataset, setDataset] = useState(null); // { metadata, previewRows, fullData }
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'visualize', 'insights'

  const handleUploadSuccess = (data) => {
    setDataset(data);
    setActiveTab('preview');
  };

  const handleClear = () => {
    setDataset(null);
  };

  // Triggers print layout for report export
  const handleExport = () => {
    window.print();
  };

  const navigationItems = [
    { id: 'preview', name: 'Data Grid & Stats', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'visualize', name: 'Chart Sandbox', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'insights', name: 'AI Insights & Chat', icon: <Sparkles className="w-4 h-4 text-brand-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans pb-12 print:bg-white print:text-black print:pb-0">

      {/* Dynamic Background Glows (Hidden in print) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-950/20 rounded-full blur-[120px] -z-10 animate-pulse-slow print:hidden" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-sky-950/10 rounded-full blur-[100px] -z-10 animate-pulse-slow print:hidden" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between print:border-none print:bg-transparent print:relative">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-500/20">
            <LayoutDashboard className="w-6 h-6 animate-float" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Praman AI
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Upload. Analyze. Visualize. Ask.
            </p>
          </div>
        </div>

        {dataset && (
          <div className="flex items-center space-x-3 print:hidden">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-950/30 border border-red-900/30 hover:border-red-900/60 text-red-300 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Clear File
            </button>
          </div>
        )}
      </header>

      {/* Main Layout Area */}
      <main className="max-w-7xl w-full mx-auto px-6 mt-8 flex-1 flex flex-col">
        {!dataset ? (
          // File Upload Landing View
          <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-8">
            <div className="text-center space-y-3 max-w-lg">
              <span className="text-[10px] font-black tracking-widest text-brand-500 bg-brand-950/40 border border-brand-900/40 px-3 py-1 rounded-full uppercase">
                Next-Gen Data Agent
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Upload. Analyze. Visualize. Ask.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Provide a CSV or Excel sheet. Our AI agent workflows will parse, profile, visualize, and outline major actionable insights from your data instantly.
              </p>
            </div>

            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          // Dashboard Panel View
          <div className="space-y-8 flex-1 flex flex-col">

            {/* Tab navigation headers (Hidden in print) */}
            <div className="flex border-b border-slate-900 pb-px print:hidden">
              <div className="flex space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-900">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${activeTab === item.id
                      ? 'bg-brand-750 text-white shadow shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                  >
                    {item.icon}
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Display active tab content */}
            <div className="flex-1">
              {activeTab === 'preview' && (
                <DataPreview
                  metadata={dataset.metadata}
                  previewRows={dataset.previewRows}
                />
              )}
              {activeTab === 'visualize' && (
                <Visualizations
                  metadata={dataset.metadata}
                  fullData={dataset.fullData}
                />
              )}
              {activeTab === 'insights' && (
                <InsightPanel
                  metadata={dataset.metadata}
                  previewRows={dataset.previewRows}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
