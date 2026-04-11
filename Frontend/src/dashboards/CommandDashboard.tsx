import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchPredictions, fetchActiveAlerts, fetchInfrastructure } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { MapView } from '../components/MapView';
import { ZonePanel } from '../components/ZonePanel';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Droplet, 
  Wind, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  Signal,
  LayoutGrid,
  BarChart3,
  Layers,
  BrainCircuit,
  Maximize2,
  ChevronUp,
  History
} from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';

export function CommandDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>("H-East");
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
      setLastUpdated(new Date().toLocaleTimeString());
    }
    init();
    const interval = setInterval(init, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentZoneData = predictions.find(p => p.zone_id === selectedZone);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-20 sm:pt-24 lg:pt-26 flex flex-col lg:flex-row gap-6 p-8 overflow-y-auto custom-scrollbar">
      
      {/* LEFT COLUMN (65%) */}
      <div className="flex-[0.65] flex flex-col gap-6">
        {/* Map Panel (Top Left) */}
        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
          <MapView
            zonesGeoJson={zones}
            infrastructureNodes={infra}
            predictions={predictions}
            onZoneClick={setSelectedZone}
            selectedZoneId={selectedZone}
          />
          <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-white/80 uppercase border border-white/10 flex items-center gap-2">
             MUMBAI WARD MAP — LIVE FLOOD STATUS
          </div>
          
          {/* Map Legend (Bottom Left) */}
          <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-4 glass-card px-5 py-3 rounded-2xl border border-white/10">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                <span className="text-[10px] font-black text-white uppercase">Critical (0%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                <span className="text-[10px] font-black text-white uppercase">Warning (20-60%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-white uppercase">Clear (&gt;60%)</span>
             </div>
          </div>
        </div>

        {/* Status Ward Panel (Bottom Left) */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/40 shadow-xl space-y-6">
           <header className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <span>Status — Ward {selectedZone || 'H-East (Dharavi)'} Active Event</span>
              <Maximize2 size={14} className="opacity-40" />
           </header>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <MetricItem 
                label="Tide height" 
                value="4.6m" 
                sub="Outfall: 4.2m · LOCKED" 
                color="text-red-500"
              />
              <MetricItem 
                label="Rainfall" 
                value="87mm/hr" 
                sub="IMD extreme threshold: 65" 
                color="text-red-500"
              />
              <MetricItem 
                label="Drain capacity" 
                value="0%" 
                sub="Tidal lock active" 
                color="text-red-500"
              />
              <MetricItem 
                label="Tide direction" 
                value="Rising" 
                sub="Peak in ~4 hrs" 
                icon={<ChevronUp size={28} className="text-orange-500" />}
                color="text-orange-500"
              />
           </div>
        </div>

        {/* Deadline Footer (Footer Left) */}
        <div className="glass-card p-6 rounded-full border border-red-200/50 bg-red-50/10 flex items-center justify-between px-10">
           <div className="flex items-center gap-6 flex-1 max-w-xl">
              <span className="text-[11px] font-black text-red-600 uppercase shrink-0">BMC DEADLINE</span>
              <div className="flex-1 h-3 bg-red-600/10 rounded-full overflow-hidden border border-red-600/20">
                 <div className="h-full bg-red-600 w-[65%] animate-pulse" />
              </div>
              <span className="text-[12px] font-black text-gray-900 brand-font">06:12 REMAINING</span>
           </div>
           <span className="px-5 py-2 bg-red-600 rounded-xl text-[10px] font-black text-white uppercase ml-10 shadow-lg shadow-red-500/20">DISPATCHED</span>
        </div>
      </div>

      {/* RIGHT COLUMN (35%) */}
      <div className="flex-[0.35] flex flex-col gap-6">
        
        {/* RIVA Reasoning Panel (Top Right) */}
        <div className="glass-card flex-[0.55] p-8 rounded-[3rem] border border-white/40 shadow-xl bg-white/40 text-gray-950 overflow-hidden relative flex flex-col">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full" />
           <header className="flex justify-between items-start mb-6 relative z-10">
              <div className="space-y-1">
                 <h3 className="text-[14px] font-black uppercase flex items-center gap-3 text-gray-900">
                    <BrainCircuit size={18} className="text-blue-600" /> Riva Agent — Reasoning
                 </h3>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
                 </div>
              </div>
           </header>

           <div className="flex flex-wrap gap-2 mb-8 relative z-10">
              <span className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-xl text-[10px] font-black text-red-400 uppercase">Critical</span>
              <span className="px-3 py-1 bg-orange-600/20 border border-orange-500/30 rounded-xl text-[10px] font-black text-orange-400 uppercase">Tide ↑ Rising</span>
              <span className="px-3 py-1 bg-white/50 border border-black/5 rounded-xl text-[10px] font-black text-gray-600 uppercase">09:07 · Peak Hour</span>
              <span className="px-3 py-1 bg-white/50 border border-black/5 rounded-xl text-[10px] font-black text-gray-600 uppercase">KEM 65%</span>
              <span className="px-3 py-1 bg-white/50 border border-black/5 rounded-xl text-[10px] font-black text-gray-600 uppercase">Bn4 Nearby</span>
           </div>

           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-dark mb-8 relative z-10">
              {[
                "Peak commute. 3.5M on WR right now.",
                "Tide still rising — 4 hrs zero drainage.",
                "Sion underpass closes in ~15 min. NDRF default route blocked.",
                "Rerouting Bn4 via 60 Feet Road instead.",
                "KEM at 65% — surge protocol viable now."
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 group-hover:scale-150 transition-all shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                   <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">"{text}"</p>
                </div>
              ))}
           </div>

           <div className="pt-6 border-t border-black/5 flex flex-col gap-5 relative z-10">
              <div className="flex justify-between items-center">
                 <div className="text-[10px] font-black text-gray-400 uppercase">5 DISPATCHED · 1.8S · LLAMA-3.3-70B</div>
                 <span className="text-[11px] font-black text-blue-600 uppercase">DISPATCHED</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 bg-white/80 border border-black/5 hover:bg-white rounded-2xl font-black text-[12px] uppercase transition-all text-gray-900 shadow-sm">Ack All</button>
                 <button className="py-4 bg-red-600/10 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[12px] uppercase transition-all">Escalate</button>
              </div>
           </div>
        </div>

        {/* Alert Feed Log (Bottom Right) */}
        <div className="glass-card flex-[0.45] p-8 rounded-[3rem] border border-white/40 shadow-xl overflow-hidden flex flex-col">
           <header className="flex justify-between items-center mb-6">
              <h3 className="text-[14px] font-black text-gray-950 uppercase flex items-center gap-3">
                 <History size={18} className="text-slate-700" /> Alert Feed — Live Log
              </h3>
           </header>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 p-4 hover:bg-black/5 rounded-2xl transition-all group">
                   <div className="flex items-start gap-4 flex-1">
                      <span className={`w-[80px] text-[10px] font-black py-1 px-2 rounded-lg text-center ${
                         idx === 0 ? 'bg-red-600 text-white' : (idx === 1 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white')
                      }`}>
                         {idx === 0 ? 'OVERDUE' : (idx === 1 ? 'ACK' : 'SENT')}
                      </span>
                      <div className="min-w-0">
                         <p className="text-[13px] font-black text-gray-900 uppercase leading-none mb-1">{alert.department || 'OFFICER'} · <span className="font-bold lowercase opacity-60 text-[12px] normal-case truncate">{alert.action}</span></p>
                      </div>
                   </div>
                   <span className="text-[11px] font-bold text-gray-400">09:{27 - idx * 10}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1 group">
       <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</div>
       <div className="flex items-center gap-3">
          <div className={`text-4xl font-black brand-font ${color} group-hover:scale-105 transition-transform`}>{value}</div>
          {icon}
       </div>
       <div className="text-[10px] font-bold text-gray-600 uppercase italic opacity-80">{sub}</div>
    </div>
  );
}
