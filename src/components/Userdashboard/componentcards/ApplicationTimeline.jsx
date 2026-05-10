import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

// The 5 stages every loan application goes through.
const STAGES = [
  { key: 'submitted',    label: 'Application submitted',  desc: 'Your details have been received' },
  { key: 'identity',     label: 'Identity verified',       desc: 'KYC check complete' },
  { key: 'under_review', label: 'AI credit review',        desc: 'Our engine is assessing your profile' },
  { key: 'approved',     label: 'Offer generated',         desc: 'Your personalised rate is ready' },
  { key: 'active',       label: 'Funds disbursed',         desc: 'Money sent to your account' },
];

const STATUS_TO_STAGE = {
  pending:       0,
  under_review: 2,
  approved:      3,
  active:        4,
  rejected:      -1,
  closed:        4,
};

function getStageIndex(status) {
  return STATUS_TO_STAGE[status] ?? 0;
}

export default function ApplicationTimeline({ loan }) {
  if (!loan) return null;

  const currentStage = getStageIndex(loan.status);
  const isRejected = loan.status === 'rejected';

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="space-y-0">
      {isRejected && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          This application was not approved. You can apply again with updated information.
        </div>
      )}

      {STAGES.map((stage, index) => {
        const isDone = !isRejected && index < currentStage;
        const isCurrent = !isRejected && index === currentStage;
        const isUpcoming = isRejected || index > currentStage;
        const isLast = index === STAGES.length - 1;

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Dot + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500 ${
                isDone     ? 'bg-[#22D3EE] shadow-lg shadow-cyan-500/20' :
                isCurrent  ? 'bg-[#0B1E3D] ring-4 ring-cyan-500/10' :
                             'bg-white border-2 border-gray-100'
              }`}>
                {isDone     && <CheckCircle2 size={16} className="text-[#0B1E3D]" strokeWidth={3} />}
                {isCurrent  && <Loader2 size={14} className="text-[#22D3EE] animate-spin" strokeWidth={3} />}
                {isUpcoming && <Circle size={10} className="text-gray-200 fill-gray-50" />}
              </div>
              
              {!isLast && (
                <div className={`w-[2px] flex-1 my-1.5 min-h-[24px] rounded-full transition-colors duration-500 ${
                  isDone ? 'bg-[#22D3EE]' : 'bg-gray-100'
                }`} />
              )}
            </div>

            {/* Content Area */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-sm font-black tracking-tight leading-none transition-colors ${
                isDone || isCurrent ? 'text-[#0B1E3D]' : 'text-gray-300'
              }`}>
                {stage.label}
              </p>
              
              <div className="flex flex-col gap-1 mt-1.5">
                <p className={`text-[11px] font-medium leading-relaxed ${
                  isCurrent ? 'text-[#0891B2] font-bold' : 
                  isDone    ? 'text-gray-500' : 
                              'text-gray-300'
                }`}>
                  {isCurrent ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      In progress...
                    </span>
                  ) : stage.desc}
                </p>

                {/* Timestamps */}
                {isDone && (
                  <div className="flex items-center gap-2">
                    {index === 0 && loan.created_at && (
                      <span className="text-[9px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md font-bold uppercase tracking-wider">
                        {formatDate(loan.created_at)}
                      </span>
                    )}
                    {index === 4 && loan.funded_at && (
                      <span className="text-[9px] px-2 py-0.5 bg-cyan-50 text-[#0891B2] rounded-md font-bold uppercase tracking-wider">
                        {formatDate(loan.funded_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}