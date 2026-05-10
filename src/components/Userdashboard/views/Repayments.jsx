import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useRepayments } from '../hooks/useRepayments';
import RepaymentRow from '../componentcards/RepaymentRow';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const FILTERS = ['all', 'upcoming', 'paid', 'overdue', 'missed'];

export default function Repayments() {
  const { repayments, nextDue, daysUntilNext, loading } = useRepayments();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? repayments
    : repayments.filter(r => r.status === filter);

  const nextPaymentColor =
    daysUntilNext < 0  ? 'bg-red-50/50 border-red-100'    :
    daysUntilNext <= 5 ? 'bg-amber-50/50 border-amber-100' :
                         'bg-cyan-50/50 border-cyan-100';

  const nextPaymentIcon =
    daysUntilNext < 0  ? 'text-red-500'    :
    daysUntilNext <= 5 ? 'text-amber-500'  :
                         'text-cyan-500';

  const nextPaymentText =
    daysUntilNext < 0   ? `${Math.abs(daysUntilNext)} days overdue` :
    daysUntilNext === 0 ? 'Due today' :
                          `In ${daysUntilNext} days`;

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 space-y-6">

      {/* ── Next payment banner ── */}
      {nextDue && !loading && (
        <div className={`p-6 rounded-[2rem] border flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 transition-all duration-300 ${nextPaymentColor} shadow-sm`}>
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Calendar size={22} className={nextPaymentIcon} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-[#0B1E3D] uppercase tracking-tight">
              Next payment: {fmt(nextDue.amount_due)}
            </p>
            <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wide opacity-80">
              {nextDue.loan_type}
              {nextDue.sub_type ? ` · ${nextDue.sub_type}` : ''}
              {' · '}Due {fmtDate(nextDue.due_date)}
              {' · '}<span className={nextPaymentIcon}>{nextPaymentText}</span>
            </p>
          </div>
          <button className="px-6 py-2.5 bg-[#0B1E3D] text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-cyan-600 transition-colors shadow-lg shadow-navy-900/10">
            Pay Now
          </button>
        </div>
      )}

      {/* ── Filter pills ── */}
      <div className="flex justify-center sm:justify-start gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all capitalize tracking-widest border ${
              filter === f
                ? 'bg-[#0B1E3D] border-[#0B1E3D] text-white shadow-md shadow-navy-900/20'
                : 'bg-white border-gray-100 text-gray-400 hover:border-cyan-200 hover:text-cyan-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Repayments list ── */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 border-b border-gray-50 last:border-b-0 animate-pulse bg-gray-50/50"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Calendar size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-black text-[#0B1E3D] uppercase tracking-widest">No matching records</p>
            <p className="text-xs text-gray-400 mt-2 font-bold max-w-[280px] mx-auto leading-relaxed">
              {filter !== 'all'
                ? 'No payments found for this status. Adjust your filters to see more results.'
                : 'Your repayment schedule will automatically generate once a loan is disbursed.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r, i) => (
              <RepaymentRow
                key={r.id}
                repayment={r}
                showLoanType={true}
                isLast={i === filtered.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Summary totals footer ── */}
      {!loading && repayments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total settled',
              value: fmt(
                repayments
                  .filter(r => r.status === 'paid')
                  .reduce((sum, r) => sum + (r.amount_due ?? 0), 0)
              ),
              color: 'text-emerald-600',
              bg: 'bg-emerald-50/30'
            },
            {
              label: 'Total Upcoming',
              value: fmt(
                repayments
                  .filter(r => r.status === 'upcoming')
                  .reduce((sum, r) => sum + (r.amount_due ?? 0), 0)
              ),
              color: 'text-[#22D3EE]',
              bg: 'bg-cyan-50/30'
            },
            {
              label: 'Outstanding',
              value: fmt(
                repayments
                  .filter(r => r.status === 'overdue' || r.status === 'missed')
                  .reduce((sum, r) => sum + (r.amount_due ?? 0), 0)
              ),
              color: 'text-red-500',
              bg: 'bg-red-50/30'
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border border-gray-100 p-5 text-center transition-all hover:shadow-md ${bg}`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{label}</p>
              <p className={`text-xl font-black tracking-tighter ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}