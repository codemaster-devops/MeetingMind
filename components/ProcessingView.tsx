import React, { useEffect, useState } from 'react';

const TIPS = [
  "Did you know? Gemini 2.5 Flash can process audio natively without external transcription services.",
  "Tip: Clear audio recordings yield the best action item detection.",
  "Processing... We are analyzing decisions and assigning owners.",
  "Generating a structured summary from your conversation...",
  "Looking for key dates and deliverables..."
];

const ProcessingView: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-6 rounded-full shadow-xl border-4 border-indigo-50">
           <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Meeting...</h2>
      <p className="text-slate-500 max-w-md text-center h-12 transition-all duration-500">
        {TIPS[tipIndex]}
      </p>
    </div>
  );
};

export default ProcessingView;
