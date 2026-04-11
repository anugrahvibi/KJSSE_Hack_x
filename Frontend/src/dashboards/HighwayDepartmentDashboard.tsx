import React, { useState, useEffect, useRef } from 'react';
import { TrainFront, Activity, Zap, StopCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { fetchZones, fetchInfrastructure, fetchActiveAlerts, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, InfrastructureNode, ZonePrediction } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { MapView } from '../components/MapView';
import { TacticalCard, TacticalBadge, Label } from '../components/tactical/TacticalLibrary';

export function HighwayDepartmentDashboard() {
   const [zones, setZones] = useState<any>(null);
   const [infra, setInfra] = useState<InfrastructureNode[]>([]);
   const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
   const [selectedZone, setSelectedZone] = useState<string | null>('H-East');
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(containerRef, [alerts]);

  useEffect(() => {
    async function init() {
         const [zData, iData, pData, aData] = await Promise.all([
            fetchZones(),
            fetchInfrastructure(),
            fetchPredictions(),
            fetchActiveAlerts('WESTERN_RAILWAY'),
         ]);
         setZones(zData);
         setInfra((iData.nodes || []).filter((node: InfrastructureNode) => node.type === 'road' || node.type === 'comm_tower'));
         setPredictions(pData);
      setAlerts(aData);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} className="pt-28 sm:pt-32 lg:pt-36 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-8 py-6">
        <AccountabilityBanner />

        {/* OVERDUE Alert Bar */}
        <div className="glass-card p-6 rounded-[2.25rem] border border-red-300 bg-red-600 shadow-xl overflow-visible flex flex-col md:flex-row items-center justify-between gap-6 group">
            <div className="flex-1 space-y-1">
               <p className="text-[13px] font-black text-white uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> OVERDUE — 09:27
               </p>
               <p className="text-[16px] font-bold text-white leading-tight uppercase">
                  Station prep at Kurla + Sion not acknowledged · This silence is logged · Deadline passed
               </p>
            </div>
            <div className="flex gap-4">
               <button className="px-8 py-3 bg-white text-red-600 rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl">ACK now</button>
               <button className="px-8 py-3 border border-white/40 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all">Escalate</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* LEFT COLUMN */}
           <div className="space-y-8 flex flex-col">
              
            {/* Rail Route Risk Map */}
              <div className="flex-1 min-h-[400px] glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-900/5 relative overflow-hidden flex flex-col">
                 <MapView
                   zonesGeoJson={zones}
                   infrastructureNodes={infra}
                   predictions={predictions}
                   onZoneClick={setSelectedZone}
                   selectedZoneId={selectedZone}
                 />
                 <Label
                   label="Rail Route Risk Map - Kurla to Dadar Corridor"
                   as="div"
                   variant="block"
                   className="absolute top-6 left-6 z-10 glass-card text-gray-500 border border-black/5 max-w-[320px]"
                 />
                 <Label
                   label="Western Railway main line - Harbour branch - RIVA overlay"
                   as="div"
                   className="absolute bottom-6 left-6 z-10 bg-white/80 text-gray-500"
                 />
              </div>

              {/* Station Risk List */}
              <TacticalCard title="Station Risk - At-Risk Stations" icon={<Zap size={16} className="text-orange-600" />}>
                 <div className="space-y-4">
                    <RiskRow label="Kurla (WR Main line)" status="HIGH RISK" sub="Submerge T+60" color="red" />
                    <RiskRow label="Sion station" status="MEDIUM" sub="Watch T+90" color="orange" />
                    <RiskRow label="Matunga Road" status="MEDIUM" sub="Monitor" color="orange" />
                    <RiskRow label="Dadar (WR)" status="LOW" sub="Clear" color="emerald" />
                 </div>
              </TacticalCard>
           </div>

           {/* RIGHT COLUMN */}
           <div className="space-y-8 flex flex-col">
              
              {/* Crowd Management Checklist */}
              <TacticalCard title="Crowd Management Checklist - Kurla" className="flex-[0.6]">
                 <div className="space-y-2">
                    <ChecklistRow time="09:07" label="Alert received — station prep required" status="IGNORED" color="red-ghost" />
                    <ChecklistRow time="09:22" label="Deadline passed — no response logged" status="OVERDUE" color="red-ghost" />
                    <ChecklistRow time="09:37" label="Halt slow trains Kurla-Sion corridor" status="PENDING" color="gray-ghost" />
                    <ChecklistRow time="09:45" label="Announce alternate bus routes via PA" status="PENDING" color="gray-ghost" />
                 </div>
              </TacticalCard>

              {/* Service Halt Timeline */}
              <TacticalCard 
                 title="Service Halt Timeline" 
                 icon={<StopCircle size={18} className="text-emerald-600" />}
                 className="bg-emerald-50/10 border-emerald-200"
              >
                 <div className="space-y-4">
                    <TimelinePoint label="Kurla station track level" value="3.8m" />
                    <TimelinePoint label="Current water rise" value="0.3m/hr" />
                    <TimelinePoint label="Estimated submersion" value="T+60 min (10:07)" color="text-orange-600" />
                    <div className="pt-4 border-t border-emerald-200/50">
                       <p className="text-[14px] font-black text-emerald-800 uppercase tracking-tighter">Recommended halt: <span className="text-emerald-900">all slow trains by 09:45</span></p>
                    </div>
                 </div>
              </TacticalCard>

              {/* Accountability Note */}
              <TacticalCard title="Accountability Note" icon={<Info size={18} className="text-red-600" />} className="bg-red-50/10 border-red-200">
                 <div className="space-y-6">
                    <p className="text-[14px] font-bold text-gray-900 uppercase leading-snug">
                       Alert sent 09:07. No acknowledgment by 09:27. This non-response is logged with timestamp.
                    </p>
                    <p className="text-[14px] font-bold text-gray-700 leading-snug italic uppercase opacity-80">
                       Post-event report will reference this gap. Silence is a decision and it is on the record.
                    </p>
                 </div>
              </TacticalCard>
           </div>
        </div>
      </div>
    </div>
  );
}

function SchematicNode({ id, label, status, color, sub }: { id: string; label: string; status: string; color: any; sub: string }) {
  const colorMap = { red: 'border-red-500 text-red-600 bg-red-50', orange: 'border-orange-500 text-orange-600 bg-orange-50', emerald: 'border-emerald-500 text-emerald-600 bg-emerald-50' } as any;
  return (
    <div className="flex flex-col items-center gap-3">
       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
       <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-[12px] font-black ${colorMap[color]}`}>
          {id}
       </div>
       <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${colorMap[color]}`}>{status}</div>
       <span className="text-[9px] font-bold text-gray-400 uppercase">{sub}</span>
    </div>
  );
}

function RiskRow({ label, status, sub, color }: { label: string; status: string; sub: string; color: any }) {
  return (
     <div className="flex items-center gap-6 py-4 border-b border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-xl transition-all h-16">
        <p className="flex-1 text-[13px] font-black text-gray-950 uppercase">{label}</p>
        <TacticalBadge label={status} color={color} variant="filled" className="shrink-0" />
        <span className="text-[10px] font-bold text-gray-400 uppercase">{sub}</span>
     </div>
  );
}

function ChecklistRow({ time, label, status, color }: { time: string; label: string; status: string; color: string }) {
  const badgeColor = color.split('-')[0] as any;
  const isOutline = color.includes('ghost');
  return (
     <div className="flex items-center gap-6 py-4 border-b border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-xl transition-all h-20">
        <span className="text-[13px] font-black text-gray-400">{time}</span>
        <p className="flex-1 text-[14px] font-bold text-gray-700 leading-tight uppercase tracking-tighter">{label}</p>
        <TacticalBadge label={status} color={badgeColor} variant={isOutline ? 'outline' : 'filled'} className="shrink-0 w-24 text-center" />
     </div>
  );
}

function TimelinePoint({ label, value, color = "text-emerald-600" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-[14px] font-bold uppercase tracking-tighter">
       <span className="text-emerald-800/60">{label}:</span>
       <span className={`font-black ${color}`}>{value}</span>
    </div>
  );
}
