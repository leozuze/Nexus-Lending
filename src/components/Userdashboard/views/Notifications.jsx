// ─── Notifications.jsx ───────────────────────────────────────────────────────
import React from 'react';
import { CheckCheck, BellRing } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from '../componentcards/NotificationItem';

export function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-2 space-y-6">
      
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
            <BellRing size={16} className="text-cyan-600" />
          </div>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em]">
            {unreadCount > 0 ? `${unreadCount} New Notifications` : 'Inbox Cleared'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-cyan-600 bg-cyan-50/50 hover:bg-cyan-100 transition-all uppercase tracking-widest"
          >
            <CheckCheck size={14} strokeWidth={3} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List Container */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-4 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50/50 rounded-2xl animate-pulse border border-gray-50" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <BellRing size={32} className="text-gray-200" />
            </div>
            <p className="text-sm font-black text-[#0B1E3D] uppercase tracking-widest">No activity found</p>
            <p className="text-xs text-gray-400 mt-2 font-bold max-w-[260px] leading-relaxed uppercase tracking-tight">
              We'll update you here regarding loan approvals, security alerts, and payment schedules.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="transition-transform duration-200 hover:scale-[1.005]">
                <NotificationItem notification={n} onRead={markAsRead} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;