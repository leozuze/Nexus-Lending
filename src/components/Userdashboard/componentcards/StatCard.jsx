import React from 'react';

// Generic summary metric card used across Overview and other views.
const SUB_COLORS = {
  default: 'text-gray-400',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger:  'text-red-600',
};

export default function StatCard({ label, value, sub, subVariant = 'default', icon: Icon, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-3 w-20 bg-gray-100 rounded-full" />
          <div className="h-8 w-8 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-8 w-32 bg-gray-100 rounded-lg mb-2" />
        <div className="h-3 w-24 bg-gray-100 rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-navy-900/5 hover:border-cyan-100 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors flex items-center justify-center">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-black text-[#0B1E3D] tracking-tighter leading-none">
          {value}
        </p>
        
        {sub && (
          <div className="flex items-center gap-1.5 pt-1">
            <p className={`text-[11px] font-black uppercase tracking-tight ${SUB_COLORS[subVariant]}`}>
              {sub}
            </p>
            {subVariant === 'success' && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
        )}
      </div>

      {/* Decorative accent visible on hover */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}