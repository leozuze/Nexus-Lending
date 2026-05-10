import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Fetches all loan applications for the current user from Supabase.
// Returns: { loans, loading, error, refetch }
//
// `loans` is an array of objects with this shape:
// {
//   id, user_id, loan_type, sub_type, amount, term_months,
//   apr, monthly_payment, total_repayment, total_interest,
//   status,        → 'pending' | 'under_review' | 'approved' | 'active' | 'rejected' | 'closed'
//   created_at,
//   funded_at,
//   amount_repaid  → calculated from repayments table via Supabase view or SUM query
// }

export function useLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoans = async (uid) => {
    if (!uid) {
      setLoans([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Main loan application data
      const { data: loanData, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (loanError) throw loanError;

      // For each active loan, calculate how much has been repaid
      // by summing the `amount` column from repayments where status = 'paid'
      const enriched = await Promise.all(
        loanData.map(async (loan) => {
          if (loan.status !== 'active') return { ...loan, amount_repaid: 0 };

          const { data: repayData, error: repayError } = await supabase
            .from('repayments')
            .select('amount_paid')
            .eq('loan_id', loan.id)
            .eq('status', 'paid');

          if (repayError) return { ...loan, amount_repaid: 0 };

          const amount_repaid = repayData.reduce(
            (sum, r) => sum + (r.amount_paid ?? 0), 0
          );
          return { ...loan, amount_repaid };
        })
      );

      setLoans(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchLoans(firebaseUser.uid);
      } else {
        setLoans([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Derived stats used by Overview + Repayments
  const stats = {
    totalBorrowed: loans
      .filter(l => ['active', 'approved'].includes(l.status))
      .reduce((sum, l) => sum + (l.amount ?? 0), 0),

    activeCount: loans.filter(l => l.status === 'active').length,
    pendingCount: loans.filter(l => ['pending', 'under_review'].includes(l.status)).length,
    totalCount: loans.length,
  };

  return { loans, stats, loading, error, refetch: () => fetchLoans(auth.currentUser?.uid) };
}