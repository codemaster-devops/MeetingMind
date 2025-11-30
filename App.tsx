import React, { useState } from 'react';
import LandingView from './components/LandingView';
import ProcessingView from './components/ProcessingView';
import ResultsView from './components/ResultsView';
import { AlertCircleIcon } from './components/Icons';
import { AppState, MeetingAnalysis, ProcessingError } from './types';
import { analyzeMeetingAudio, analyzeMeetingTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<MeetingAnalysis | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const result = await analyzeMeetingAudio(file);
      setAnalysisResult(result);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      
      let message = "We couldn't process this meeting audio. Please ensure the file is valid and try again.";
      if (err.message && (err.message.includes("400") || err.message.includes("413"))) {
          message = "The file is too large or invalid for the API. Please try a shorter recording (under 10MB) or check the file format.";
      } else if (err.message) {
          message = err.message;
      }

      setError({
        title: "Processing Failed",
        message: message
      });
    }
  };

  const handleTranscriptSubmit = async (text: string) => {
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const result = await analyzeMeetingTranscript(text);
      setAnalysisResult(result);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setError({
        title: "Processing Failed",
        message: err.message || "We couldn't process the transcript. Please try again."
      });
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Navbar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Meeting<span className="text-indigo-600">Mind</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
             <span>Powered by Gemini 2.5</span>
             <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="transition-all duration-500 ease-in-out">
        {appState === AppState.IDLE && (
          <LandingView 
            onFileSelect={handleFileSelect} 
            onTranscriptSubmit={handleTranscriptSubmit}
          />
        )}

        {appState === AppState.PROCESSING && (
          <ProcessingView />
        )}

        {appState === AppState.COMPLETED && analysisResult && (
          <ResultsView data={analysisResult} onReset={handleReset} />
        )}

        {appState === AppState.ERROR && error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{error.title}</h2>
              <p className="text-slate-600 mb-6">{error.message}</p>
              <button 
                onClick={handleReset}
                className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default App;