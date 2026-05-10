import React from 'react';
import { User, Car, HeartPulse, Home, GraduationCap, Clock, CheckCircle2, XCircle, Eye, RefreshCw } from 'lucide-react';

// Maps loan_type to icon + color scheme
const LOAN_STYLES = {
  'Personal Loans':     { icon: User,           bg: 'bg-cyan-50',     iconColor: 'text-cyan-600',    label: 'Personal' },
  'Car Loans':           { icon: Car,            bg: 'bg-blue-50',     iconColor: 'text-blue-600',    label: 'Car' },
  'Health & Insurance': { icon: HeartPulse,     bg: 'bg-rose-50',     iconColor: 'text-rose-600',    label: 'Health' },
  'Mortgage':           { icon: Home,           bg: 'bg-indigo-50',   iconColor: 'text-indigo-600',  label: 'Mortgage' },
  'Student Loans':      { icon: GraduationCap,  bg: 'bg-violet-50',   iconColor: 'text-violet-600',  label: 'Student' },
};

const STATUS_STYLES = {
  pending:       { label: 'Pending',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',  icon: Clock },
  under_review: { label: 'In Review',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',   icon: RefreshCw },
  approved:      { label: 'Approved',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2 },
  active:        { label: 'Active',       bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-100',    icon: CheckCircle2 },
  rejected:      { label: 'Rejected',     bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-100',     icon: XCircle },
  closed:        { label: 'Closed',       bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',    icon: CheckCircle2 },
};

export default function LoanCard({ loan, compact = false, onClick }) {
  const style = LOAN_STYLES[loan.loan_type] ?? LOAN_STYLES['Personal Loans'];
  const status = STATUS_STYLES[loan.status] ?? STATUS_STYLES.pending;
  const Icon = style.icon;
  const StatusIcon = status.icon;

  const progress = loan.status === 'active' && loan.total_repayment > 0
    ? Math.min(100, Math.round((loan.amount_repaid / loan.total_repayment) * 100))
    : 0;

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-xl hover:shadow-navy-900/5 hover:border-cyan-200 hover:-translate-y-0.5' : ''
      } ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-start gap-4">
        {/* Loan Type Icon */}
        <div className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center flex-shrink-0 transition-transform`}>
          <Icon size={22} className={style.iconColor} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#0B1E3D] tracking-tight leading-none uppercase">
                {loan.loan_type}
              </p>
              {loan.sub_type && (
                <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{loan.sub_type}</p>
              )}
            </div>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${status.bg} ${status.text} ${status.border} flex-shrink-0`}>
              <StatusIcon size={12} strokeWidth={3} />
              {status.label}
            </span>
          </div>

          {!compact && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100/50">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1">Principal</p>
                <p className="text-sm font-black text-[#0B1E3D]">{formatCurrency(loan.amount)}</p>
              </div>
              <div className="bg-cyan-50/30 rounded-2xl p-3 border border-cyan-100/30">
                <p className="text-[9px] text-cyan-600 font-black uppercase tracking-[0.1em] mb-1">Interest</p>
                <p className="text-sm font-black text-cyan-600">{loan.apr ? `${loan.apr}%` : '—'}</p>
              </div>
              <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100/50">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1">Monthly</p>
                <p className="text-sm font-black text-[#0B1E3D]">{formatCurrency(loan.monthly_payment)}</p>
              </div>
            </div>
          )}

          {compact && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-base font-black text-[#0B1E3D]">{formatCurrency(loan.amount)}</p>
              <p className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                {formatDate(loan.created_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Active Loans */}
      {loan.status === 'active' && !compact && (
        <div className="mt-6 pt-5 border-t border-gray-50">
          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-wider mb-2">
            <span className="text-gray-400">Repayment Progress</span>
            <span className="text-[#0B1E3D]">
              {formatCurrency(loan.amount_repaid)} <span className="text-gray-300 mx-1">/</span> {formatCurrency(loan.total_repayment)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(34,211,238,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-[10px] font-black text-cyan-600">{progress}%</span>
          </div>
        </div>
      )}

      {/* View Details CTA */}
      {onClick && !compact && (
        <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-cyan-600 font-black uppercase tracking-widest">
          <span>View Detailed Analytics</span>
          <Eye size={12} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}