import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches the current user's profile from Supabase.
// FIX 1: .single() → .maybeSingle() — .single() throws 406 when row is missing.
// FIX 2: Falls back to Firebase Auth displayName/email so dashboard never shows "User".
// Returns: { user, loading, error, refetch }

export function useUser() {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const fetchUser = async (uid, fbUser) => {
    if (!uid) { setUser(null); setLoading(false); return; }

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle(); // ← was .single() — 406 killer

      if (fetchError) throw fetchError;

      if (data) {
        setUser(data);
      } else {
        // Row missing (race condition on first login) — use Firebase as fallback
        const displayName = fbUser?.displayName ?? '';
        const parts       = displayName.split(' ');
        setUser({
          id:                     uid,
          first_name:             parts[0] || fbUser?.email?.split('@')[0] || 'User',
          last_name:              parts.slice(1).join(' ') || '',
          email:                  fbUser?.email ?? '',
          province:               '',
          loan_application_count: 0,
          created_at:             new Date().toISOString(),
          last_login:             new Date().toISOString(),
          _fromFallback:          true,
        });
      }
    } catch (err) {
      setError(err.message);
      // Even on hard error keep UI alive with Firebase data
      const parts = (fbUser?.displayName ?? '').split(' ');
      setUser({
        id:         uid,
        first_name: parts[0] || fbUser?.email?.split('@')[0] || 'User',
        last_name:  parts.slice(1).join(' ') || '',
        email:      fbUser?.email ?? '',
        province:   '',
        loan_application_count: 0,
        _fromFallback: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        fetchUser(fbUser.uid, fbUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: () => firebaseUser && fetchUser(firebaseUser.uid, firebaseUser),
  };
}