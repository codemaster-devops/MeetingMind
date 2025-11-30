
import { supabase } from './supabaseClient';
import { MeetingAnalysis } from '../types';

export const createMeetingRecord = async (userId: string | undefined, title: string, type: 'audio' | 'text') => {
  if (!supabase) return null;

  try {
    const payload: any = { 
      title: title || `Meeting - ${new Date().toLocaleString()}`,
      status: 'processing',
      metadata: { type } 
    };

    if (userId) {
        payload.user_id = userId;
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating meeting record:", error);
    return null;
  }
};

export const updateMeetingSuccess = async (id: string, result: MeetingAnalysis) => {
  if (!supabase || !id) return;

  try {
    const { error } = await supabase
      .from('meetings')
      .update({
        status: 'completed',
        transcript: result.transcript,
        summary_points: result.summary_points,
        decisions: result.decisions,
        action_items: result.action_items,
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating meeting record:", error);
  }
};

export const updateMeetingError = async (id: string, errorMessage: string) => {
  if (!supabase || !id) return;

  try {
    const { error } = await supabase
      .from('meetings')
      .update({
        status: 'error',
        error_message: errorMessage
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error logging meeting error:", error);
  }
};
