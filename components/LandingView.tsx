import React, { useCallback, useState } from 'react';
import { UploadCloudIcon, FileAudioIcon, PenToolIcon } from './Icons';
import { UsageStats } from '../types';

interface LandingViewProps {
  onFileSelect: (file: File) => void;
  onTranscriptSubmit: (text: string) => void;
  usageStats: UsageStats;
  onUpgradeClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onFileSelect, onTranscriptSubmit, usageStats, onUpgradeClick }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'transcript'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');

  const isLimitReached = !usageStats.isPro && usageStats.used >= usageStats.limit;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isLimitReached) setIsDragging(true);
  }, [isLimitReached]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isLimitReached) return;

    if (activeTab === 'upload' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  }, [activeTab, onFileSelect, isLimitReached]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLimitReached) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
      e.target.value = '';
    }
  }, [onFileSelect, isLimitReached]);

  const validateAndUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { 
      alert("File is too large. Please upload a file smaller than 10MB.");
      return;
    }
    
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.webm'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const hasValidExtension = validExtensions.includes(ext);

    if (file.type.startsWith('audio/') || file.type.startsWith('video/') || hasValidExtension) {
       onFileSelect(file);
    } else {
        alert("Please upload a valid audio file (MP3, WAV, M4A, etc).");
    }
  };

  const handleTextSubmit = () => {
    if (isLimitReached) return;
    if (!transcriptText.trim()) {
      alert("Please enter a transcript first.");
      return;
    }
    onTranscriptSubmit(transcriptText);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-2xl mb-4">
            <span className="text-indigo-600 font-semibold px-2 py-1 text-sm rounded-full bg-white shadow-sm border border-indigo-100">AI-Powered</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Turn Meetings into <span className="text-indigo-600">Action</span>
        </h1>
        <p className="text-lg text-slate-600 mb-6">
          Instantly generate a full transcript, structured summary, decisions, and action items.
        </p>

        {/* Usage Bar */}
        {!usageStats.isPro && (
          <div className="max-w-xs mx-auto bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Free Plan Usage</span>
                <span className={isLimitReached ? "text-red-500" : "text-indigo-600"}>
                    {usageStats.used} / {usageStats.limit} Meetings
                </span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min((usageStats.used / usageStats.limit) * 100, 100)}%` }}
                ></div>
             </div>
             {isLimitReached ? (
                 <button onClick={onUpgradeClick} className="text-xs text-indigo-600 font-bold hover:underline">
                     Limit reached. Upgrade to Pro →
                 </button>
             ) : (
                 <p className="text-xs text-slate-400">Resets next month</p>
             )}
          </div>
        )}
      </div>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
        
        {/* Upgrade Overlay if limit reached */}
        {isLimitReached && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly Limit Reached</h3>
                <p className="text-slate-600 mb-6">You've used your 3 free meetings for this month. Upgrade to Pro for unlimited access.</p>
                <button 
                    onClick={onUpgradeClick}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                >
                    Upgrade to Unlimited
                </button>
            </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloudIcon className="w-5 h-5" />
            Upload Audio
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'transcript' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('transcript')}
          >
            <PenToolIcon className="w-4 h-4" />
            Paste Transcript
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'upload' ? (
            <div 
              className={`
                w-full p-10 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer group
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-inner' 
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLimitReached && document.getElementById('fileInput')?.click()}
            >
              <input 
                type="file" 
                id="fileInput" 
                className="hidden" 
                accept="audio/*,video/mp4,.m4a" 
                onChange={handleFileInput} 
                disabled={isLimitReached}
              />
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`
                  p-4 rounded-full transition-colors duration-300
                  ${isDragging ? 'bg-indigo-200 text-indigo-700' : 'bg-white text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110'}
                `}>
                  {isDragging ? <FileAudioIcon className="w-10 h-10" /> : <UploadCloudIcon className="w-10 h-10" />}
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    {isDragging ? 'Drop audio file here' : 'Click or drag audio file'}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Supports MP3, WAV, M4A (Max 10MB)
                  </p>
                </div>

                <button className="mt-4 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Select File
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <label htmlFor="transcript" className="sr-only">Paste Transcript</label>
              <textarea
                id="transcript"
                className="w-full h-64 p-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder-slate-400 custom-scrollbar mb-4"
                placeholder="Paste your meeting transcript or notes here..."
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                disabled={isLimitReached}
              />
              <button 
                onClick={handleTextSubmit}
                disabled={!transcriptText.trim() || isLimitReached}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                Generate Notes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl w-full">
        <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-100">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-slate-900">Full Transcript</h3>
            <p className="text-sm text-slate-500 mt-1">Accurate speech-to-text powered by Gemini 2.5</p>
        </div>
        <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-100">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-slate-900">Instant Summary</h3>
            <p className="text-sm text-slate-500 mt-1">Key points & decisions extracted automatically</p>
        </div>
        <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-100">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-slate-900">Action Items</h3>
            <p className="text-sm text-slate-500 mt-1">Detects owners and due dates for easy follow-up</p>
        </div>
      </div>
    </div>
  );
};

export default LandingView;