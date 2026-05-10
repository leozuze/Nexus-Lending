import React from 'react';
import { FileStack, Coins, CalendarClock, ArrowRight, Zap } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { useRepayments } from '../hooks/useRepayments';
import { useNotifications } from '../hooks/useNotifications';
import StatCard from '../componentcards/StatCard';
import LoanCard from '../componentcards/LoanCard';
import ApplicationTimeline from '../componentcards/ApplicationTimeline';
import NotificationItem from '../componentcards/NotificationItem';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

export default function Overview({ onNavigate }) {
  const { loans, stats, loading: loansLoading } = useLoans();
  const { nextDue, daysUntilNext, loading: repayLoading } = useRepayments();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const trackingLoan = loans.find(l => ['pending', 'under_review'].includes(l.status))
    ?? loans.find(l => l.status === 'approved')
    ?? loans[0]
    ?? null;

  const nextPaymentLabel = nextDue
    ? daysUntilNext < 0
      ? `${Math.abs(daysUntilNext)}d overdue`
      : daysUntilNext === 0
        ? 'Due today'
        : `Due in ${daysUntilNext}d`
    : 'No payments due';

  const nextPaymentVariant = nextDue
    ? daysUntilNext < 0 ? 'danger' : daysUntilNext <= 5 ? 'warning' : 'success'
    : 'default';

  const recentNotifs = notifications.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      
      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Applications"
          value={loansLoading ? '—' : String(stats.totalCount)}
          sub={`${stats.activeCount} active · ${stats.pendingCount} pending`}
          icon={FileStack}
          loading={loansLoading}
        />
        <StatCard
          label="Total borrowed"
          value={loansLoading ? '—' : fmt(stats.totalBorrowed)}
          sub="Across all active facilities"
          icon={Coins}
          loading={loansLoading}
        />
        <StatCard
          label="Next payment"
          value={repayLoading ? '—' : nextDue ? fmt(nextDue.amount_due) : '—'}
          sub={repayLoading ? '' : nextPaymentLabel}
          subVariant={nextPaymentVariant}
          icon={CalendarClock}
          loading={repayLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── MY LOANS (Main Snapshot) ── */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[#0B1E3D] tracking-tight uppercase">My Loans</h2>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Snapshot of your lending status</p>
            </div>
            <button
              onClick={() => onNavigate('loans')}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black text-cyan-600 bg-cyan-50/50 hover:bg-cyan-50 transition-all uppercase tracking-widest"
            >
              View Dashboard <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loansLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-50/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <EmptyLoans onNavigate={onNavigate} />
          ) : (
            <div className="space-y-4">
              {loans.slice(0, 3).map(loan => (
                <LoanCard key={loan.id} loan={loan} compact />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: STATUS & ALERTS ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Application Timeline Track */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-[#0B1E3D] uppercase tracking-widest">Tracking</h2>
              {trackingLoan && (
                <span className="text-[9px] font-black bg-cyan-50 text-cyan-600 px-2 py-1 rounded-md uppercase tracking-tighter">
                  {trackingLoan.loan_type?.split(' ')[0]}
                </span>
              )}
            </div>
            {loansLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : trackingLoan ? (
              <div className="flex justify-center py-2">
                <ApplicationTimeline loan={trackingLoan} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No active tracker</p>
              </div>
            )}
          </div>

          {/* Activity/Notifications */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-black text-[#0B1E3D] uppercase tracking-widest">Alerts</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center text-[10px] font-black bg-red-500 text-white rounded-full ring-4 ring-red-50">
                    {unreadCount}
                  </span>
                )}
                <button
                  onClick={() => onNavigate('notifications')}
                  className="p-1.5 rounded-lg hover:bg-gray-50 text-cyan-600 transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
            {recentNotifs.length === 0 ? (
              <p className="text-[11px] font-bold text-gray-400 text-center py-4 uppercase tracking-wider">Zero new alerts</p>
            ) : (
              <div className="space-y-2">
                {recentNotifs.map(n => (
                  <NotificationItem key={n.id} notification={n} onRead={markAsRead} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyLoans({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-cyan-50 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner shadow-cyan-200/50">
        <Zap size={28} className="text-cyan-500 fill-cyan-500/20" />
      </div>
      <h3 className="text-lg font-black text-[#0B1E3D] mb-2 uppercase">Unlock Capital</h3>
      <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed font-bold uppercase tracking-tight mb-8">
        Your credit score won't be impacted by checking your rate.
      </p>
      <button
        onClick={() => window.location.href = '/check-rate'}
        className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#0B1E3D] text-white text-xs font-black rounded-2xl hover:bg-[#22D3EE] hover:text-[#0B1E3D] transition-all shadow-xl shadow-navy-900/10 active:scale-95 uppercase tracking-widest"
      >
        <Zap size={14} className="fill-current" />
        Apply Now
      </button>
    </div>
  );
}