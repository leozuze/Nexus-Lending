import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches all repayment records for the current user.
// Returns: { repayments, nextDue, loading, error, refetch }
//
// `repayments` shape:
// {
//   id, loan_id, user_id,
//   amount_due, amount_paid,
//   due_date,   paid_at,
//   status      → 'upcoming' | 'paid' | 'overdue' | 'missed'
//   loan_type   → joined from loan_applications (e.g. 'Personal Loans')
// }

export function useRepayments() {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepayments = async (uid) => {
    if (!uid) {
      setRepayments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Join repayments with loan_applications to get loan_type
      const { data, error } = await supabase
        .from('repayments')
        .select(`
          *,
          loan_applications (
            loan_type,
            sub_type
          )
        `)
        .eq('user_id', uid)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Flatten the joined data for easy use in components
      const flat = data.map(r => ({
        ...r,
        loan_type: r.loan_applications?.loan_type ?? 'Loan',
        sub_type: r.loan_applications?.sub_type ?? '',
      }));

      setRepayments(flat);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchRepayments(firebaseUser.uid);
      } else {
        setRepayments([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Next upcoming payment (closest future due date, not yet paid)
  const nextDue = repayments
    .filter(r => r.status === 'upcoming' || r.status === 'overdue')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] ?? null;

  // Days until next payment (negative = overdue)
  const daysUntilNext = nextDue
    ? Math.ceil((new Date(nextDue.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    repayments,
    nextDue,
    daysUntilNext,
    loading,
    error,
    refetch: () => fetchRepayments(auth.currentUser?.uid),
  };
}