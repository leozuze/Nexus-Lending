import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import LoanCard from '../componentcards/LoanCard';
import ApplicationTimeline from '../componentcards/ApplicationTimeline';

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Approved', 'Rejected', 'Closed'];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

export default function MyLoans() {
  const { loans, loading, error } = useLoans();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = loans.filter(loan => {
    const matchesStatus = statusFilter === 'All'
      || loan.status === statusFilter.toLowerCase()
      || (statusFilter === 'Pending' && loan.status === 'under_review');
    const matchesSearch = search === ''
      || loan.loan_type.toLowerCase().includes(search.toLowerCase())
      || (loan.sub_type ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (error) {
    return (
      <div className="flex justify-center p-8">
        <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-[2rem] text-center shadow-sm">
          <p className="text-sm text-red-700 font-black uppercase tracking-wider">Authentication Error</p>
          <p className="text-xs text-red-600 mt-2 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-2 space-y-6">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by loan type or reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-gray-50/50 border border-transparent rounded-2xl text-sm font-bold text-[#0B1E3D] outline-none focus:bg-white focus:border-cyan-200 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B1E3D] transition-colors">
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border ${
                statusFilter === f
                  ? 'bg-[#0B1E3D] border-[#0B1E3D] text-white shadow-lg shadow-navy-900/20'
                  : 'bg-white border-gray-100 text-gray-400 hover:border-cyan-200 hover:text-cyan-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-6 transition-all duration-500 ${selectedLoan ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
        
        {/* Loan List Column */}
        <div className={`space-y-4 ${selectedLoan ? 'lg:col-span-7' : 'w-full'}`}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-black text-[#0B1E3D] uppercase tracking-widest">No matching records</p>
              <p className="text-xs text-gray-400 mt-2 font-bold">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map(loan => (
                <div key={loan.id} className={`transition-all duration-300 ${selectedLoan?.id === loan.id ? 'ring-2 ring-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/10 scale-[1.02]' : 'opacity-100 hover:scale-[1.01]'}`}>
                  <LoanCard
                    loan={loan}
                    onClick={() => setSelectedLoan(selectedLoan?.id === loan.id ? null : loan)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Inspection Panel */}
        {selectedLoan && (
          <div className="lg:col-span-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-xl shadow-navy-900/5 sticky top-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-base font-black text-[#0B1E3D] uppercase tracking-tight">Loan Analytics</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ref: {selectedLoan.id.slice(0,8)}</p>
                </div>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-all group"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: 'Principal',       value: fmt(selectedLoan.amount), primary: true },
                  { label: 'Interest Rate',    value: selectedLoan.apr ? `${selectedLoan.apr}%` : '—' },
                  { label: 'Installment',     value: fmt(selectedLoan.monthly_payment), primary: true },
                  { label: 'Tenure',           value: selectedLoan.term_months ? `${selectedLoan.term_months} Months` : '—' },
                  { label: 'Total Payable',    value: fmt(selectedLoan.total_repayment) },
                  { label: 'Total Cost',       value: fmt(selectedLoan.total_interest) },
                ].map(({ label, value, primary }) => (
                  <div key={label} className={`rounded-2xl p-4 border transition-colors ${primary ? 'bg-cyan-50/30 border-cyan-100/50' : 'bg-gray-50/50 border-gray-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-[0.12em] mb-1.5 ${primary ? 'text-cyan-600' : 'text-gray-400'}`}>{label}</p>
                    <p className="text-sm font-black text-[#0B1E3D] tracking-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Application Lifecycle */}
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-4 bg-cyan-500 rounded-full" />
                  <p className="text-[11px] font-black text-[#0B1E3D] uppercase tracking-widest">Application Lifecycle</p>
                </div>
                <ApplicationTimeline loan={selectedLoan} />
              </div>

              <div className="mt-8 flex justify-center">
                 <button className="w-full py-4 bg-[#0B1E3D] text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all shadow-lg shadow-navy-900/10 active:scale-95">
                    Download Documents
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}