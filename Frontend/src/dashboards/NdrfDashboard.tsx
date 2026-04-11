import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { StakeholderAction, InfrastructureNode, ZonePrediction } from '@schema';
import { Navigation, ShieldAlert, Target, Clock, AlertTriangle } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { MapView } from '../components/MapView';
import { TacticalCard, TacticalBadge, Label } from '../components/tactical/TacticalLibrary';

export function NdrfDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
   const [zones, setZones] = useState<any>(null);
   const [infra, setInfra] = useState<InfrastructureNode[]>([]);
   const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
   const [selectedZone, setSelectedZone] = useState<string | null>('H-East');

  useGsapAnimations(containerRef, [alerts]);

  useEffect(() => {
    async function init() {
         const [zData, iData, pData, aData] = await Promise.all([
            fetchZones(),
            fetchInfrastructure(),
            fetchPredictions(),
            fetchActiveAlerts('NDRF'),
         ]);
         setZones(zData);
         setInfra((iData.nodes || []).filter((node: InfrastructureNode) => node.type === 'road' || node.type === 'comm_tower'));
         setPredictions(pData);
      setAlerts(aData);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-28 sm:pt-32 lg:pt-36 flex flex-col gap-6 p-8 overflow-y-auto custom-scrollbar overflow-visible">
      <AccountabilityBanner />
      
      {/* Top Urgent Alert Bar */}
      <div className="glass-card p-6 rounded-[2rem] border border-red-200 bg-red-50/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-visible">
         <div className="flex-1 space-y-1">
            <p className="text-[13px] font-black text-red-600 uppercase flex items-center gap-2">
               <AlertTriangle size={16} /> Alert Dispatched 09:07
            </p>
            <p className="text-[15px] font-bold text-gray-900 leading-tight">
               Deploy Battalion 4 to Dharavi Sector B via 60 Feet Road · Deadline: 09:37 · Response logged — action required now
            </p>
         </div>
         <div className="flex gap-4">
            <button className="px-8 py-3 bg-gray-950 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl shadow-black/20">ACK + deploying</button>
            <button className="px-8 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all">Cannot deploy</button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Mission Context (65%) */}
        <div className="flex-[0.65] flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deployment Order (Green Card Content) */}
            <TacticalCard 
               title="Deployment Order" 
               icon={<Target size={18} className="text-emerald-600" />}
               className="bg-emerald-50/10 border-emerald-200"
            >
               <div className="space-y-4">
                  <p className="text-[18px] font-black text-emerald-700 leading-snug">Deploy Battalion 4 immediately to Dharavi Sector B.</p>
                  <p className="text-[15px] font-bold text-orange-600 uppercase">Avoid Sion underpass - BMC closing it now.</p>
                  <p className="text-[15px] font-bold text-emerald-800">Use 60 Feet Road northbound approach only.</p>
                  <p className="text-[15px] font-bold text-gray-700">Estimated travel: <span className="font-black">18 min</span>.</p>
                  <p className="text-[15px] font-black text-emerald-600">Flood peak T+90 min - you have time.</p>
               </div>
            </TacticalCard>

            {/* Sector Assessment (Status Grid) */}
            <TacticalCard title="Sector Assessment - H-East" icon={<ShieldAlert size={18} className="text-blue-600" />}>
               <div className="grid grid-cols-2 gap-4">
                  <SectorBlock label="Sector B - RED" desc="Dharavi near 90 Feet Rd · Water rising · 1,200 at risk · Evacuate priority" color="red" />
                  <SectorBlock label="Sector A - AMBER" desc="Dharavi north · Monitor only · 340 residents" color="orange" />
                  <SectorBlock label="Sector C - CLEAR" desc="Mahim side · No action needed" color="emerald" />
                  <SectorBlock label="Sector D - WATCH" desc="Near Sion border · Monitor if rain persists" color="blue" />
               </div>
            </TacticalCard>
          </div>

          {/* Route Map */}
          <div className="flex-1 min-h-[400px] glass-card rounded-[2.5rem] border border-white/40 shadow-xl relative overflow-hidden bg-slate-50/50">
             <MapView
               zonesGeoJson={zones}
               infrastructureNodes={infra}
               predictions={predictions}
               onZoneClick={setSelectedZone}
               selectedZoneId={selectedZone}
             />
             <Label
               label="Route Map - Live Avoidances"
               as="div"
               variant="block"
               className="absolute top-6 left-6 z-10 glass-card text-gray-500 border border-black/5"
             />
             <Label
               label="18 min ETA - avoid Sion underpass (closed)"
               as="div"
               className="absolute bottom-6 left-6 z-10 bg-red-100 text-red-600"
             />
          </div>
        </div>

        {/* RIGHT COLUMN: Estimates & Deadlines (35%) */}
        <div className="flex-[0.35] flex flex-col gap-6">
          
          {/* Casualty Estimate */}
          <TacticalCard title="Casualty Estimate IF Delayed" icon={<Clock size={16} className="text-gray-400" />}>
             <div className="space-y-6">
                <EstimateRow time="T+0" label="Deploy now - 340 people evacuated safely" badge="TARGET" badgeColor="emerald" />
                <EstimateRow time="T+30" label="60 Feet Rd starts flooding - route compromised" badge="RISK" badgeColor="orange" />
                <EstimateRow time="T+90" label="Sector B fully submerged - rescue only, no evac" badge="CRITICAL" badgeColor="red" />
             </div>
          </TacticalCard>

          {/* Response Deadline */}
          <TacticalCard title="Response Deadline" className="flex-1">
             <div className="space-y-8 flex flex-col justify-between h-full">
                <div className="space-y-2">
                   <div className="text-6xl font-black text-orange-500 brand-font tracking-tighter">28:14</div>
                   <p className="text-[12px] font-bold text-gray-400 uppercase italic">remaining before OVERDUE flag</p>
                </div>
                <div className="space-y-3 pt-8 border-t border-black/5">
                   <p className="text-[13px] font-bold text-gray-600 leading-tight">All actions timestamped.</p>
                   <p className="text-[13px] font-bold text-gray-600 leading-tight">No response = OVERDUE in log.</p>
                   <p className="text-[13px] font-bold text-gray-600 leading-tight">Post-event report will flag gaps.</p>
                </div>
             </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
}

function SectorBlock({ label, desc, color }: { label: string; desc: string; color: 'red' | 'orange' | 'emerald' | 'blue' | 'gray' }) {
  const borderColors = {
    red: 'border-red-500/30 bg-red-50/50',
    orange: 'border-orange-500/30 bg-orange-50/50',
    emerald: 'border-emerald-500/30 bg-emerald-50/50',
    blue: 'border-blue-500/30 bg-blue-50/50',
    gray: 'border-gray-500/30 bg-gray-50/50'
  };
  const textColors = {
    red: 'text-red-700',
    orange: 'text-orange-700',
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    gray: 'text-gray-700'
  };
  return (
    <div className={`p-4 rounded-2xl border ${borderColors[color]}`}>
       <p className={`text-[11px] font-black uppercase mb-1 ${textColors[color]}`}>{label}</p>
       <p className="text-[10px] font-bold text-gray-600 leading-tight">{desc}</p>
    </div>
  );
}

function EstimateRow({ time, label, badge, badgeColor }: { time: string; label: string; badge: string; badgeColor: any }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-black/5 last:border-0">
       <span className="w-10 text-[12px] font-black text-gray-400">{time}</span>
       <p className="flex-1 text-[13px] font-bold text-gray-700 leading-tight">{label}</p>
       <TacticalBadge label={badge} color={badgeColor} variant="filled" className="shrink-0" />
    </div>
  );
}
