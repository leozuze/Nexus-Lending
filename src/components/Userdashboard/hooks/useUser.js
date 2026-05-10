import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches the current user's profile from the Supabase `users` table.
// Returns: { user, loading, error, refetch }
// `user` shape: { id, first_name, last_name, email, province, created_at, loan_application_count }

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async (uid) => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for Firebase auth state to get the uid,
    // then use that uid to query Supabase.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchUser(firebaseUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, error, refetch: () => fetchUser(auth.currentUser?.uid) };
}