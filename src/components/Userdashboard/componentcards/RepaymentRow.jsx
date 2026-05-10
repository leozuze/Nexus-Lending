import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Ban } from 'lucide-react';

// Reusable repayment row used in both the Repayments view (full table)
// and any snapshot summaries elsewhere in the dashboard.

const STATUS_CONFIG = {
  paid: {
    label: 'PAID',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  upcoming: {
    label: 'UPCOMING',
    icon: Clock,
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
    textColor: 'text-cyan-700',
    border: 'border-cyan-100',
  },
  overdue: {
    label: 'OVERDUE',
    icon: AlertTriangle,
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
    border: 'border-red-100',
  },
  missed: {
    label: 'MISSED',
    icon: Ban,
    bg: 'bg-red-50',
    iconColor: 'text-red-400',
    textColor: 'text-red-600',
    border: 'border-red-100',
  },
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export default function RepaymentRow({ repayment, showLoanType = true, isLast = false }) {
  const config = STATUS_CONFIG[repayment.status] ?? STATUS_CONFIG.upcoming;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-5 px-6 py-5 transition-all duration-200 hover:bg-gray-50/80 ${
        !isLast ? 'border-b border-gray-100/60' : ''
      }`}
    >
      {/* Status icon container */}
      <div
        className={`w-10 h-10 rounded-2xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        <Icon size={16} className={config.iconColor} strokeWidth={2.5} />
      </div>

      {/* Loan details & schedule */}
      <div className="flex-1 min-w-0">
        {showLoanType && (
          <p className="text-sm font-black text-[#0B1E3D] truncate tracking-tight uppercase">
            {repayment.loan_type}
            {repayment.sub_type ? (
              <span className="text-gray-400 font-bold ml-1.5 opacity-60">· {repayment.sub_type}</span>
            ) : null}
          </p>
        )}
        <div className={`flex items-center gap-2 ${showLoanType ? 'mt-1' : ''}`}>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Due <span className="text-gray-500">{fmtDate(repayment.due_date)}</span>
          </p>
          {repayment.status === 'paid' && repayment.paid_at && (
             <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-black uppercase tracking-tighter">
               Settled {fmtDate(repayment.paid_at)}
             </span>
          )}
        </div>
      </div>

      {/* Financials & Status Badge */}
      <div className="text-right flex-shrink-0">
        <p className="text-base font-black text-[#0B1E3D] tracking-tighter">
          {fmt(repayment.amount_due)}
        </p>
        <div className="flex justify-end mt-1">
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest ${config.bg} ${config.textColor} ${config.border}`}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}