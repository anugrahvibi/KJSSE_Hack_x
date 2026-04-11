import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function AccountabilityBanner({ dispatchTime }: { dispatchTime?: string }) {
  return (
    <div className="w-full bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between gap-4 border border-white/10 shadow-xl mb-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-500/20 rounded-xl">
           <ShieldCheck size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1">Accountability Ledger</p>
          <p className="text-[14px] font-bold leading-tight">Your response is being logged in the append-only crisis audit trail.</p>
        </div>
      </div>
      {dispatchTime && (
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Dispatched At</p>
          <p className="text-[14px] font-black text-white brand-font uppercase">
            {new Date(dispatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}
