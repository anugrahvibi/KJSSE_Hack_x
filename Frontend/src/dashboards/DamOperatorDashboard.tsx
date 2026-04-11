import React, { useState, useEffect, useRef } from 'react';
import { Waves, Droplets, Activity, AlertCircle, Clock, MapPin, BrainCircuit, Navigation } from 'lucide-react';
import { fetchActiveAlerts, fetchSensorReadings } from '../utils/dataFetcher';
import type { StakeholderAction, SensorReading } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { TacticalCard, TacticalBadge, TacticalMetric } from '../components/tactical/TacticalLibrary';

export function DamOperatorDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sensor, setSensor] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);

  useGsapAnimations(containerRef, [sensor, alerts]);

  useEffect(() => {
    async function init() {
      const sData = await fetchSensorReadings('H-East');
      const aData = await fetchActiveAlerts('BMC_WARD_OFFICER');

      if (sData.length > 0) setSensor(sData[0]);
      setAlerts(aData);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} className="pt-28 sm:pt-32 lg:pt-36 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-8 py-6">
        <AccountabilityBanner />

        {/* Urgent Alert Header */}
        <div className="glass-card p-6 rounded-[2rem] border border-red-200 bg-red-50/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-visible">
           <div className="flex-1 space-y-1">
              <p className="text-[13px] font-black text-red-600 uppercase flex items-center gap-2">
                 <AlertCircle size={16} /> Alert Dispatched 09:07
              </p>
              <p className="text-[15px] font-bold text-gray-900 leading-tight uppercase">
                 Close Sion underpass + activate pump stations 3 and 7 · Deadline: 09:22 · Response logged — action required now
              </p>
           </div>
           <div className="flex gap-4">
              <button className="px-8 py-3 bg-gray-950 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl shadow-black/20">ACK + acting</button>
              <button className="px-8 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all">Cannot comply</button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-8 flex flex-col">
            
            {/* Ward Alert Narrative */}
            <TacticalCard 
               title="Ward Alert — H-East Dharavi" 
               icon={<AlertCircle size={18} className="text-red-600" />}
               className="bg-red-50/10 border-red-200"
            >
               <div className="space-y-6">
                  <p className="text-[20px] font-black leading-snug text-gray-950 uppercase">
                     <span className="text-red-600">Tidal lock confirmed.</span> Drainage capacity 0%. Rainfall <span className="text-red-600">87mm/hr</span>.
                  </p>
                  <p className="text-[16px] font-bold text-gray-700 leading-relaxed uppercase">
                     Close Sion underpass immediately — NDRF vehicle route depends on this. Pumps 3 and 7 at 90 Feet Rd must activate within 15 min window.
                  </p>
                  <div className="p-4 bg-red-600 text-white rounded-2xl">
                     <p className="text-[16px] font-black uppercase">Evacuation notice for Sector B — 1,200 at risk near 90 Feet Rd.</p>
                  </div>
               </div>
            </TacticalCard>

            {/* Road Closure Status */}
            <TacticalCard title="Road Closure Status" icon={<Navigation size={18} className="text-blue-600" />}>
               <div className="space-y-2">
                  <StatusRow time="09:09" label="Sion underpass closed — barriers deployed" status="DONE" color="emerald" />
                  <StatusRow time="09:11" label="Pumps 3+7 activated — 87% capacity" status="DONE" color="emerald" />
                  <StatusRow time="09:22" label="Dharavi Sector B evacuation notice" status="PENDING" color="orange" />
               </div>
            </TacticalCard>
            
            {/* Escalation Window */}
            <TacticalCard title="Escalation Window" className="flex-1">
               <div className="flex items-center justify-between gap-10 h-full py-4">
                  <div className="space-y-1">
                     <div className="text-6xl font-black text-red-600 brand-font tracking-tighter">06:12</div>
                     <p className="text-[12px] font-bold text-gray-400 uppercase italic">remaining before OVERDUE flag</p>
                  </div>
                  <div className="flex-1 space-y-3">
                     <p className="text-[14px] font-bold text-gray-600 uppercase">All actions are timestamped.</p>
                     <p className="text-[14px] font-bold text-gray-600 uppercase">Silence = OVERDUE in log.</p>
                  </div>
               </div>
            </TacticalCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8 flex flex-col">
            
            {/* Map Pins / Action Points */}
            <div className="flex-1 min-h-[350px] overflow-hidden glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-900/5 relative">
               <div className="absolute top-6 left-6 z-10 text-[10px] font-black text-gray-400 uppercase">MAP PINS — ACTION POINTS</div>
               {/* Simplified Tactical Map Visual */}
               <div className="h-full w-full flex items-center justify-center opacity-40 grayscale flex-col gap-4">
                  <MapPin size={48} className="text-red-500 animate-bounce" />
                  <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Sion Underpass · Pump 3 · Pump 7</span>
               </div>
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[10px] font-black text-emerald-600 uppercase italic">
                  Ward H-East · tap pin to confirm action
               </div>
            </div>

            {/* Pump Station Status */}
            <TacticalCard title="Pump Station Status" icon={<Droplets size={18} className="text-blue-600" />}>
               <div className="grid grid-cols-2 gap-4">
                  <PumpBlock name="Pump 3 — 90 Feet Rd" status="ON" color="emerald" />
                  <PumpBlock name="Pump 7 — 90 Feet Rd" status="ON" color="emerald" />
                  <PumpBlock name="Pump 1 — Mahim" status="STANDBY" color="orange" />
                  <PumpBlock name="Pump 5 — Sion" status="OFFLINE" color="red" />
               </div>
            </TacticalCard>

            {/* Agent Reasoning */}
            <TacticalCard title="Agent Reasoning — WHY THIS ACTION" icon={<BrainCircuit size={18} className="text-blue-600" />}>
               <div className="space-y-4">
                  <ReasoningLine text="Sion underpass is the only NDRF route — close before Bn4 deploys" />
                  <ReasoningLine text="Pumps 3+7 at 90 Feet Rd — highest capacity in H-East" />
                  <ReasoningLine text="Sector B: 1,200 residents, elevation lowest, evac window 40 min" />
               </div>
            </TacticalCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ time, label, status, color }: { time: string; label: string; status: string; color: any }) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-xl transition-all">
       <span className="text-[13px] font-black text-gray-900">{time}</span>
       <p className="flex-1 text-[13px] font-bold text-gray-600 uppercase tracking-tighter">{label}</p>
       <TacticalBadge label={status} color={color} variant="filled" className="shrink-0" />
    </div>
  );
}

function PumpBlock({ name, status, color }: { name: string; status: string; color: any }) {
  const colorMap = {
     emerald: 'text-emerald-600',
     orange: 'text-orange-500',
     red: 'text-red-600'
  } as any;
  return (
    <div className="p-5 rounded-2xl bg-white/50 border border-black/5 hover:border-blue-200 transition-all flex flex-col gap-2">
       <p className="text-[12px] font-black text-gray-950 uppercase leading-none">{name}</p>
       <span className={`text-[12px] font-black ${colorMap[color]}`}>{status}</span>
    </div>
  );
}

function ReasoningLine({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start group">
       <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 group-hover:scale-150 transition-all" />
       <p className="text-[14px] font-bold text-gray-700 leading-relaxed uppercase">"{text}"</p>
    </div>
  );
}
