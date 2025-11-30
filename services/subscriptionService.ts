import { supabase } from './supabaseClient';
import { UserProfile, UsageStats } from '../types';

export const FREE_LIMIT = 3;

/**
 * Fetch the user's profile to check Pro status.
 * Includes a self-healing mechanism: if the profile is missing (e.g. trigger failed),
 * it attempts to create one on the fly.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!supabase) return null;
  
  // 1. Try to get the profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If found, return it
  if (!error && data) {
    return data as UserProfile;
  }

  // 2. If not found (PGRST116 is 'Row not found'), attempt to create it lazily.
  // This makes the app robust against missing triggers or legacy users.
  console.log("Profile not found, attempting to create default profile...");
  
  const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{ id: userId, is_pro: false }])
      .select()
      .single();

  if (createError) {
      console.warn("Failed to create profile fallback:", createError);
      // Fallback object so app doesn't crash, even if DB write failed
      return { id: userId, is_pro: false }; 
  }

  return newProfile as UserProfile;
};

/**
 * Count meetings created by the user in the current calendar month.
 */
export const getMonthlyUsage = async (userId: string): Promise<number> => {
  if (!supabase) return 0;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth);

  if (error) {
    console.error("Error fetching usage:", error);
    return 0;
  }

  return count || 0;
};

/**
 * Initiate Stripe Checkout.
 * NOTE: In a production app, this should call a Supabase Edge Function
 * to create the session securely on the server side.
 */
export const initiateCheckout = async (userId: string) => {
    // 1. In a real app, invoke Supabase function:
    // const { data, error } = await supabase.functions.invoke('create-checkout-session', { priceId: 'price_xxx' });
    
    // 2. For this demo, we will alert the user since we don't have a backend function deployed.
    // If you have a backend, you would use:
    // const stripe = await (window as any).Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
    // stripe.redirectToCheckout({ sessionId: data.sessionId });

    console.log(`Initiating checkout for user ${userId}...`);
    
    // Simulator for the prompt's context
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
             // Simulate "upgrading" the user in the DB for demo purposes
             // This is INSECURE for production (client shouldn't update is_pro), but allows testing the UI flow now.
             if (supabase) {
                 await supabase.from('profiles').update({ is_pro: true }).eq('id', userId);
                 window.location.reload(); // Reload to pick up new state
                 resolve(true);
             } else {
                 reject("Supabase not connected");
             }
        }, 1500);
    });
};