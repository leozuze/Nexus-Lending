import React from 'react';
import { Clock, CheckCircle2, XCircle, Shield, Bell } from 'lucide-react';

const TYPE_STYLES = {
  payment_due: { icon: Clock,         bg: 'bg-amber-50',   iconColor: 'text-amber-600' },
  approved:    { icon: CheckCircle2,  bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  rejected:    { icon: XCircle,       bg: 'bg-red-50',     iconColor: 'text-red-600' },
  identity:    { icon: Shield,        bg: 'bg-[#E6F1FB]',   iconColor: 'text-[#185FA5]' },
  general:     { icon: Bell,          bg: 'bg-gray-100',   iconColor: 'text-gray-500' },
};

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function NotificationItem({ notification, onRead, compact = false }) {
  const style = TYPE_STYLES[notification.type] ?? TYPE_STYLES.general;
  const Icon = style.icon;

  const handleClick = () => {
    if (!notification.is_read && onRead) {
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 ${
        !notification.is_read
          ? 'bg-cyan-50/30 hover:bg-cyan-50/50 cursor-pointer border border-cyan-100/50'
          : 'hover:bg-gray-50 cursor-default border border-transparent'
      }`}
    >
      {/* Icon Container */}
      <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
        <Icon size={16} className={style.iconColor} strokeWidth={2.5} />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] leading-snug tracking-tight ${
          notification.is_read 
            ? 'text-gray-500 font-medium' 
            : 'text-[#0B1E3D] font-black'
        }`}>
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {timeAgo(notification.created_at)}
          </p>
          {!notification.is_read && (
            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500 text-white font-black rounded uppercase tracking-tighter">
              New
            </span>
          )}
        </div>
      </div>

      {/* Unread dot indicator */}
      {!notification.is_read && (
        <div className="relative flex h-2 w-2 mt-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22D3EE]"></span>
        </div>
      )}
    </div>
  );
}