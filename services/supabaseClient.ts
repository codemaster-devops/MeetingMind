import { createClient } from '@supabase/supabase-js';

// Access environment variables for Supabase configuration.
// We use fallbacks here to ensure the app works in preview environments where .env might be missing.
const supabaseUrl = process.env.SUPABASE_URL || "https://rzgbugoxfxdcuyeswjvj.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Z2J1Z294ZnhkY3V5ZXN3anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODQwNDYsImV4cCI6MjA4MDA2MDA0Nn0.9kFSOmMpANV8TGUJk96tmRkk4WhOswn-98KHvUegfAg";

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Authentication and database features will be disabled.');
}

// Export the client if keys are present, otherwise null.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;