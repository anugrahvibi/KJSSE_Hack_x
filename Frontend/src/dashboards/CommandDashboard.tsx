import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchPredictions, fetchActiveAlerts, fetchInfrastructure } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import { MapView } from '../components/MapView';
import { ProgressBar } from '../components/common/ProgressBar';
import { TacticalCard, TacticalMetric, TacticalAlertRow, TacticalBadge, Label, LabelButton } from '../components/tactical/TacticalLibrary';
import { BrainCircuit, Maximize2, ChevronUp, History } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';

export function CommandDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>("H-East");

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    async function init() {
      const [zData, iData, pData, aData] = await Promise.all([
        fetchZones(),
        fetchInfrastructure(),
        fetchPredictions(),
        fetchActiveAlerts('NDRF'),
      ]);
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
    }
    init();
    const interval = setInterval(init, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-40 sm:pt-44 lg:pt-48 flex flex-col lg:flex-row gap-8 p-10 overflow-y-auto custom-scrollbar overflow-visible">
      
      <div className="flex-[0.65] flex flex-col gap-10">
        {/* Map Panel (Top Left) */}
        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
          <MapView
            zonesGeoJson={zones}
            infrastructureNodes={infra}
            predictions={predictions}
            onZoneClick={setSelectedZone}
            selectedZoneId={selectedZone}
          />
           <Label
             label="Mumbai Ward Map - Live Flood Status"
             as="div"
             variant="block"
             className="absolute top-6 left-6 z-[1000] glass-card text-gray-600 border border-black/5 max-w-[260px] leading-tight"
           />
          
           <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-3 glass-card px-4 py-3 rounded-full border border-white/10">
             <LegendItem color="bg-red-600" label="Critical (0%)" />
             <LegendItem color="bg-orange-500" label="Warning (20-60%)" />
             <LegendItem color="bg-emerald-500" label="Clear (>60%)" />
          </div>
        </div>

        {/* Status Ward Panel (Bottom Left) */}
        <TacticalCard 
          title={`Status - Ward ${selectedZone || 'H-East'} Active Event`}
          icon={<Maximize2 size={16} className="text-gray-400" />}
          className="p-0"
        >
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <TacticalMetric label="Tide height" value="4.6m" sub="Outfall: 4.2m · LOCKED" color="text-red-600" />
              <TacticalMetric label="Rainfall" value="87mm/hr" sub="IMD extreme threshold: 65" color="text-red-600" />
              <TacticalMetric label="Drain capacity" value="0%" sub="Tidal lock active" color="text-red-600" />
              <TacticalMetric label="Tide direction" value="Rising" sub="Peak in ~4 hrs" color="text-orange-500" icon={<ChevronUp size={28} className="text-orange-500" />} />
           </div>
        </TacticalCard>

        {/* Deadline Footer (Footer Left) */}
          <div className="glass-card p-6 rounded-full border border-red-200/50 bg-red-50/10 flex items-center justify-between px-10 shadow-xl overflow-visible">
           <div className="flex items-center gap-6 flex-1 max-w-xl">
              <Label label="BMC Deadline" as="div" className="text-[11px] text-red-600 shrink-0" />
                <ProgressBar
                  value={65}
                  className="flex-1 h-3"
                  trackClassName="bg-red-600/10"
                  fillClassName="bg-red-600"
                  animated
                />
              <span className="text-[12px] font-black text-gray-900 brand-font">06:12 REMAINING</span>
           </div>
            <Label label="Dispatched" as="div" className="bg-red-600 text-[10px] text-white ml-10 shadow-lg shadow-red-500/20" />
        </div>
      </div>

      {/* RIGHT COLUMN (35%) */}
      <div className="flex-[0.35] flex flex-col gap-6">
        
        {/* RIVA Reasoning Panel (Top Right) */}
        <TacticalCard
          title="Riva Agent - Reasoning"
          subtitle="Active"
          icon={<BrainCircuit size={18} className="text-blue-600" />}
          className="flex-[0.55]"
          dark={false} // Switch to light as per previous request
        >
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="flex flex-wrap gap-2 mb-8 relative z-10">
              <TacticalBadge label="Critical" color="red" variant="filled" />
              <TacticalBadge label="Tide ↑ Rising" color="orange" variant="outline" />
              <TacticalBadge label="09:07 · Peak Hour" color="gray" variant="outline" />
           </div>

           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-dark mb-8 relative z-10 max-h-[200px]">
              {[
                "Peak commute. 3.5M on WR right now.",
                "Tide still rising - 4 hrs zero drainage.",
                "Sion underpass closes in ~15 min. NDRF default route blocked.",
                "Rerouting Bn4 via 60 Feet Road instead.",
                "KEM at 65% - surge protocol viable now."
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 group-hover:scale-150 transition-all shadow-glow-blue" />
                   <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">"{text}"</p>
                </div>
              ))}
           </div>

           <div className="pt-6 border-t border-black/5 flex flex-col gap-5 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">
                 <span>5 DISPATCHED · 1.8S · LLAMA-3.3-70B</span>
                 <span className="text-blue-600">DISPATCHED</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <LabelButton label="Ack All" tone="neutral" className="text-[12px]" />
                  <LabelButton label="Escalate" tone="danger-soft" className="text-[12px]" />
              </div>
           </div>
        </TacticalCard>

        {/* Alert Feed Log (Bottom Right) */}
        <TacticalCard 
          title="Alert Feed - Live Log"
          icon={<History size={18} className="text-slate-700" />}
          className="flex-[0.45]"
        >
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {alerts.map((alert, idx) => (
                <TacticalAlertRow 
                  key={idx}
                  status={idx === 0 ? 'OVERDUE' : (idx === 1 ? 'ACK' : 'SENT')}
                  title={`${alert.department || 'OFFICER'}`}
                  description={alert.action}
                  time={`09:${27 - idx * 10}`}
                />
              ))}
           </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pill-badge bg-white/50 border border-white/20">
       <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-lg`} />
       <span className="text-[10px] font-black text-gray-950 uppercase">{label}</span>
    </div>
  );
}

