import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a typed client with auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Disable auto-detection from URL fragments to avoid conflicts with HashRouter
    // (when the app uses hash-based routing, Supabase parsing of the URL fragment
    // can interfere with navigation on refresh). We rely on persisted session
    // in local storage instead.
    detectSessionInUrl: false,
    storageKey: "open_to_work_auth"
  }
});
