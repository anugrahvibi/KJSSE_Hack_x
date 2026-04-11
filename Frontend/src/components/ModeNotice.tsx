import React from 'react';
import { useAuth } from '../AuthContext';

export function ModeNotice() {
  const { simulationMode } = useAuth();

  if (simulationMode === 'DEMO') {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl pointer-events-auto">
        <div className="p-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg flex items-center justify-between">
          <div>
            <span className="uppercase">DEMO MODE ACTIVE</span>
            <div className="text-xs font-normal opacity-90">Simulated incidents are active — the UI will display alerts, dispatch instructions and evacuation notices. Use Demo controls to trigger scenarios.</div>
          </div>
          <div className="text-[11px] opacity-90">Data is simulated</div>
        </div>
      </div>
    );
  }

  // Live mode: peaceful
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl pointer-events-none">
      <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm flex items-center justify-between opacity-95">
        <div>
          <span className="uppercase">LIVE MODE — Peaceful</span>
          <div className="text-xs font-normal opacity-90">No threat data or operational instructions are shown in Live mode. Switch to Demo Mode to simulate incidents and see instructional dispatches.</div>
        </div>
        <div className="text-[11px] opacity-90">Real data view</div>
      </div>
    </div>
  );
}

export default ModeNotice;
