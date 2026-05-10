// src/supabaseClient.js
// Place this in your src/ folder alongside App.jsx and firebase.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Add these to your .env file:\n' +
    'VITE_SUPABASE_URL=https://xoagmesizrbrnldaueml.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=sb_publishable_...'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // We handle auth via Firebase, not Supabase Auth.
    // This stops Supabase from trying to manage its own session.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
//supabase database password  zYEHhnCXEb4hxS82