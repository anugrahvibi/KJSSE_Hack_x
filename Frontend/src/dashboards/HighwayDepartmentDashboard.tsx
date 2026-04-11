import React, { useState, useEffect, useRef } from 'react';
import { MapView } from '../components/MapView';
import { fetchActiveAlerts, fetchInfrastructure, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, InfrastructureNode, ZonePrediction } from '@schema';
import { TrainFront, Zap, StopCircle, Info } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useAuth } from '../AuthContext';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { TacticalCard, TacticalBadge } from '../components/tactical/TacticalLibrary';

export function HighwayDepartmentDashboard() {
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>('H-East');
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(containerRef, [alerts, predictions]);
   const { simulationMode } = useAuth();

  useEffect(() => {
    async function init() {
      const [aData, iData, pData] = await Promise.all([
        fetchActiveAlerts('WESTERN_RAILWAY'),
        fetchInfrastructure(),
        fetchPredictions(),
      ]);
      setAlerts(aData);
      setInfra(iData.nodes);
      setPredictions(pData);
    }
    init();
  }, []);

  return (
   <div ref={containerRef} className="pt-40 sm:pt-44 lg:pt-48 px-3 sm:px-4 lg:px-6 py-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="w-full space-y-12 py-10">
        <AccountabilityBanner />

        {/* OVERDUE Alert Bar - only visible in DEMO */}
        {simulationMode === 'DEMO' ? (
          <div className="glass-card p-6 rounded-[2.25rem] border border-red-200 bg-white shadow-xl overflow-visible flex flex-col md:flex-row items-center justify-between gap-6 group">
            <div className="flex-1 space-y-1">
               <p className="text-[13px] font-black text-red-600 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> OVERDUE  -  09:27
               </p>
               <p className="text-[16px] font-bold text-gray-900 leading-tight uppercase">
                  Station prep at Kurla + Sion not acknowledged Â· This silence is logged Â· Deadline passed
               </p>
            </div>
            <div className="flex gap-4">
               <button className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl">ACK now</button>
               <button className="px-8 py-3 border border-red-200 text-red-600 bg-red-50/50 rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all">Escalate</button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 rounded-xl border border-white/20 bg-emerald-50/30 text-emerald-700 font-bold">
            Live mode — peaceful. Operational alerts are hidden. Switch to Demo Mode to view simulated overdue alerts and instructions.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* LEFT COLUMN */}
           {simulationMode === 'DEMO' ? (
           <div className="space-y-8 flex flex-col">
              
              {/* Live Railway Map */}
              <div className="flex-1 min-h-[450px] glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-900/5 relative overflow-hidden flex flex-col">
                 <header className="p-8 pb-0 z-[1000] relative pointer-events-none">
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                       <TrainFront size={16} className="text-blue-600" /> LIVE RAILWAY COMMAND  -  CORRIDOR OVERSIGHT
                    </h3>
                 </header>
                 <div className="absolute inset-0">
                    <MapView 
                      infrastructureNodes={infra}
                      predictions={predictions}
                      onZoneClick={setSelectedZone}
                      selectedZoneId={selectedZone}
                      variant="railway"
                    />
                 </div>
                 <div className="absolute bottom-6 left-8 z-[1000] text-[10px] font-bold text-gray-900 bg-white/60 px-2 py-1 rounded-lg backdrop-blur-md uppercase italic">
                    Transit-optimized relay Â· focusing on track-level telemetry
                 </div>
              </div>

              <TacticalCard title="STATION RISK  -  AT-RISK STATIONS" icon={<Zap size={16} className="text-orange-600" />}>
                 <div className="space-y-4">
                    <RiskRow label="Kurla (WR Main line)" status="HIGH RISK" sub="Submerge T+60" color="red" />
                    <RiskRow label="Sion station" status="MEDIUM" sub="Watch T+90" color="orange" />
                    <RiskRow label="Matunga Road" status="MEDIUM" sub="Monitor" color="orange" />
                    <RiskRow label="Dadar (WR)" status="LOW" sub="Clear" color="emerald" />
                 </div>
              </TacticalCard>
           </div>
           ) : (
           <div className="space-y-8 flex flex-col">
              <div className="flex-1 min-h-[450px] glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-900/5 relative overflow-hidden flex flex-col">
                 <header className="p-8 pb-0 z-[1000] relative pointer-events-none">
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                       <TrainFront size={16} className="text-emerald-600" /> LIVE RAILWAY COMMAND  -  ALL CLEAR
                    </h3>
                 </header>
                 <div className="absolute inset-0">
                    <MapView 
                      infrastructureNodes={infra}
                      predictions={predictions}
                      onZoneClick={setSelectedZone}
                      selectedZoneId={selectedZone}
                      variant="railway"
                    />
                 </div>
                 <div className="absolute bottom-6 left-8 z-[1000] text-[10px] font-bold text-emerald-600 bg-white/60 px-2 py-1 rounded-lg backdrop-blur-md uppercase italic">
                    All stations operational Â· normal service running
                 </div>
              </div>

              <TacticalCard title="Station Status" icon={<Zap size={16} className="text-emerald-600" />}>
                 <div className="space-y-4">
                    <div className="text-sm text-gray-600 italic">All stations: Normal operations. No service disruptions. Central dispatch monitoring routine patrol protocols.</div>
                 </div>
              </TacticalCard>
           </div>
           )}

           {/* RIGHT COLUMN */}
           {simulationMode === 'DEMO' ? (
           <div className="space-y-8 flex flex-col">
              
              <TacticalCard title="Crowd Management Checklist  -  KURLA" className="flex-[0.6]">
                 <div className="space-y-2">
                    <ChecklistRow time="09:07" label="Alert received  -  station prep required" status="IGNORED" color="red-ghost" />
                    <ChecklistRow time="09:22" label="Deadline passed  -  no response logged" status="OVERDUE" color="red-ghost" />
                    <ChecklistRow time="09:37" label="Halt slow trains Kurla-Sion corridor" status="PENDING" color="gray-ghost" />
                    <ChecklistRow time="09:45" label="Announce alternate bus routes via PA" status="PENDING" color="gray-ghost" />
                 </div>
              </TacticalCard>

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
           ) : (
           <div className="space-y-8 flex flex-col">
              <TacticalCard title="Railway Dispatch Status" className="flex-1">
                 <div className="space-y-4">
                    <p className="text-[13px] font-bold text-emerald-600 uppercase">NORMAL OPERATIONS</p>
                    <p className="text-[14px] font-bold text-gray-700 leading-relaxed uppercase">All corridors operational. Central dispatch monitoring routine. No service halts planned. Personnel on standard alert posture.</p>
                    <div className="pt-4 border-t border-gray-200">
                       <p className="text-[11px] font-bold text-gray-500 italic">Switch to Demo Mode to simulate incident scenarios and operational decisions.</p>
                    </div>
                 </div>
              </TacticalCard>
           </div>
           )}
        </div>
      </div>
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

