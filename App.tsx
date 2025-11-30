import React, { useState, useEffect } from 'react';
import LandingView from './components/LandingView';
import ProcessingView from './components/ProcessingView';
import ResultsView from './components/ResultsView';
import AuthView from './components/AuthView';
import PricingView from './components/PricingView';
import { AlertCircleIcon } from './components/Icons';
import { AppState, MeetingAnalysis, ProcessingError, UserProfile, UsageStats } from './types';
import { analyzeMeetingAudio, analyzeMeetingTranscript } from './services/geminiService';
import { createMeetingRecord, updateMeetingSuccess, updateMeetingError } from './services/meetingService';
import { getUserProfile, getMonthlyUsage, FREE_LIMIT } from './services/subscriptionService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<MeetingAnalysis | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  
  // Subscription State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);

  // Auth Listener & Initial Data Fetch
  useEffect(() => {
    if (supabase) {
        const fetchUserData = async (userId: string) => {
            const [profile, usage] = await Promise.all([
                getUserProfile(userId),
                getMonthlyUsage(userId)
            ]);
            setUserProfile(profile);
            setUsageCount(usage);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchUserData(session.user.id);
            }
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchUserData(session.user.id);
            } else {
                setUserProfile(null);
                setUsageCount(0);
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    } else {
        setAuthLoading(false);
    }
  }, []);

  const refreshUsage = async () => {
      if (session?.user) {
          const usage = await getMonthlyUsage(session.user.id);
          setUsageCount(usage);
      }
  };

  const handleFileSelect = async (file: File) => {
    // Check Limits
    const isPro = userProfile?.is_pro || false;
    if (!isPro && usageCount >= FREE_LIMIT) {
        setAppState(AppState.PRICING);
        return;
    }

    setAppState(AppState.PROCESSING);
    setError(null);
    
    // 1. Create DB Record (with user ID)
    const userId = session?.user?.id;
    const meetingRecord = await createMeetingRecord(userId, file.name, 'audio');
    if (meetingRecord) {
        setCurrentMeetingId(meetingRecord.id);
        // Optimistically increment usage for UI
        setUsageCount(prev => prev + 1);
    }

    try {
      // 2. Process with AI
      const result = await analyzeMeetingAudio(file);
      
      // 3. Update DB Record (Success)
      if (meetingRecord) {
        await updateMeetingSuccess(meetingRecord.id, result);
      }

      setAnalysisResult(result);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      
      let message = "We couldn't process this meeting audio. Please ensure the file is valid and try again.";
      if (err.message && (err.message.includes("400") || err.message.includes("413"))) {
          message = "The file is too large or invalid for the API. Please try a shorter recording (under 10MB) or check the file format.";
      } else if (err.message) {
          message = err.message;
      }

      // 4. Update DB Record (Error)
      if (meetingRecord) {
        await updateMeetingError(meetingRecord.id, message);
      }

      setAppState(AppState.ERROR);
      setError({
        title: "Processing Failed",
        message: message
      });
    }
  };

  const handleTranscriptSubmit = async (text: string) => {
    // Check Limits
    const isPro = userProfile?.is_pro || false;
    if (!isPro && usageCount >= FREE_LIMIT) {
        setAppState(AppState.PRICING);
        return;
    }

    setAppState(AppState.PROCESSING);
    setError(null);

    // 1. Create DB Record (with user ID)
    const userId = session?.user?.id;
    const meetingRecord = await createMeetingRecord(userId, `Transcript - ${new Date().toLocaleTimeString()}`, 'text');
    if (meetingRecord) {
        setCurrentMeetingId(meetingRecord.id);
        // Optimistically increment usage for UI
        setUsageCount(prev => prev + 1);
    }

    try {
      // 2. Process with AI
      const result = await analyzeMeetingTranscript(text);
      
      // 3. Update DB Record (Success)
      if (meetingRecord) {
        await updateMeetingSuccess(meetingRecord.id, result);
      }

      setAnalysisResult(result);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      
      const message = err.message || "We couldn't process the transcript. Please try again.";

      // 4. Update DB Record (Error)
      if (meetingRecord) {
        await updateMeetingError(meetingRecord.id, message);
      }

      setAppState(AppState.ERROR);
      setError({
        title: "Processing Failed",
        message: message
      });
    }
  };

  const handleReset = async () => {
    await refreshUsage(); // Ensure usage stats are sync'd before going back
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setError(null);
    setCurrentMeetingId(null);
  };

  const handleSignOut = async () => {
      if (supabase) await supabase.auth.signOut();
  };

  if (authLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
  }

  // FORCE AUTH: If no session, show Auth View or Error
  if (!session) {
      if (supabase) {
          return <AuthView />;
      } else {
          return (
              <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-md">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircleIcon />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">Configuration Error</h2>
                      <p className="text-slate-600">
                          Supabase credentials are missing. The application cannot start without a database connection.
                      </p>
                  </div>
              </div>
          );
      }
  }

  // Prepare Usage Stats for Landing View
  const usageStats: UsageStats = {
      used: usageCount,
      limit: FREE_LIMIT,
      isPro: userProfile?.is_pro || false
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Navbar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.IDLE)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Meeting<span className="text-indigo-600">Mind</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
             <span className="hidden md:inline">Powered by Gemini 2.5</span>
             {session && (
                 <div className="flex items-center gap-4">
                     {userProfile?.is_pro ? (
                         <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">PRO</span>
                     ) : (
                         <button onClick={() => setAppState(AppState.PRICING)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">Upgrade</button>
                     )}
                     <span className="text-xs text-slate-400 hidden sm:inline">{session.user.email}</span>
                     <button onClick={handleSignOut} className="hover:text-red-600 transition-colors">
                         Sign Out
                     </button>
                 </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="transition-all duration-500 ease-in-out">
        {appState === AppState.IDLE && (
          <LandingView 
            onFileSelect={handleFileSelect} 
            onTranscriptSubmit={handleTranscriptSubmit}
            usageStats={usageStats}
            onUpgradeClick={() => setAppState(AppState.PRICING)}
          />
        )}

        {appState === AppState.PRICING && session && (
            <PricingView 
                userId={session.user.id} 
                onBack={() => setAppState(AppState.IDLE)} 
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