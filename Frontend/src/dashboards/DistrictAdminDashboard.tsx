import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction } from '@schema';
import { PlusCircle, Bed, Ambulance, AlertTriangle, Activity, Navigation, Clock, X, MapPin } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useAuth } from '../AuthContext';
import { MapView } from '../components/MapView';
import { TacticalCard, TacticalBadge } from '../components/tactical/TacticalLibrary';
import { TACTICAL_THEME } from '../theme';

export function DistrictAdminDashboard() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [alerts, setAlerts] = useState<StakeholderAction[]>([]);

   useGsapAnimations(containerRef, [alerts]);

   const { simulationMode } = useAuth();

   useEffect(() => {
      async function init() {
         const aData = await fetchActiveAlerts('KEM_HOSPITAL');
         setAlerts(aData);
      }
      init();
   }, []);

  return (
    <div ref={containerRef} className={`pt-34 sm:pt-43 ${TACTICAL_THEME.paddingX} h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible`}>
      <div className={`w-full ${TACTICAL_THEME.spaceY}`}>
            {/* Alert Bar - only in DEMO */}
            {simulationMode === 'DEMO' && (
               <div className="glass-card p-6 rounded-[2.25rem] border border-orange-200 bg-orange-500/10 shadow-xl overflow-visible flex flex-col md:flex-row items-center justify-between gap-6 group">
                  <div className="flex-1 space-y-1">
                     <p className="text-[13px] font-black text-orange-600 uppercase flex items-center gap-2">
                        Alert Dispatched 09:07
                     </p>
                     <p className="text-[16px] font-bold text-gray-900 leading-tight uppercase">
                        Activate surge protocol · Pre-position 4 ambulances at 90 Feet Rd · Deadline: 09:32
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <button className="px-8 py-3 bg-gray-950 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl">ACK + activating</button>
                     <button className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-black text-[13px] uppercase hover:scale-95 transition-all">Cannot comply</button>
                  </div>
               </div>
            )}

            {/* Status Bar - only in LIVE */}
            {simulationMode === 'LIVE' && (
               <div className="glass-card p-6 rounded-[2.5rem] border border-emerald-200 bg-emerald-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="text-emerald-600" size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">KEM Hospital: Nominal</h3>
                        <p className="text-xs font-bold text-emerald-600 uppercase">Emergency department at standard volume. Surge protocols on standby.</p>
                     </div>
                  </div>
                  <TacticalBadge label="Normal Mode" color="emerald" variant="outline" />
               </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

               {/* LEFT COLUMN */}
               <div className="space-y-10 flex flex-col">

                  {/* SUB-MAP: Accessibility Oversight */}
                  <div className="min-h-[400px] relative rounded-[2.5rem] overflow-hidden border border-black/5 shadow-2xl bg-white/20 backdrop-blur-xl shrink-0">
                     <MapView 
                        variant="emergency" 
                        infrastructureNodes={[]} 
                        predictions={[]} 
                        onZoneClick={() => {}} 
                     />
                     <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-gray-950 uppercase border border-white/40 flex items-center gap-2">
                        Hospital Transit Oversight
                      </div>
                  </div>

                  {/* Hospital Capacity */}
                  <TacticalCard title="HOSPITAL CAPACITY" icon={<Bed size={16} className="text-gray-400" />}>
                     <div className="space-y-8">
                        <CapacityProgress label="Current occupancy" value={65} color="bg-orange-500" />
                        <CapacityProgress label="Surge capacity available" value={35} color="bg-emerald-500" sub="approx 140 beds" />
                     </div>
                  </TacticalCard>
               </div>

               {/* RIGHT COLUMN */}
               <div className="space-y-10 flex flex-col">
                  {/* Cascade Risk to KEM */}
                  {simulationMode === 'DEMO' ? (
                     <TacticalCard title="CASCADE RISK TO KEM" icon={<AlertTriangle size={18} className="text-red-600" />}>
                        <div className="space-y-6">
                           <p className="text-[16px] font-bold text-gray-700 leading-snug uppercase">
                              If WR fails at T+60 then roads choke at T+90 then <span className="text-red-600 font-black">KEM unreachable by T+135</span>
                           </p>
                           <div className="space-y-2">
                              <StatusMetric label="Current window" value="125 min remaining" color="text-emerald-600" />
                              <StatusMetric label="Generator" value="72hr fuel" color="text-gray-950" />
                              <StatusMetric label="Backup power" value="online" color="text-emerald-600" />
                           </div>
                        </div>
                     </TacticalCard>
                  ) : (
                     <TacticalCard title="SYSTEM STATUS" icon={<Activity size={18} className="text-emerald-600" />}>
                        <div className="space-y-6">
                           <p className="text-[16px] font-bold text-gray-700 leading-snug uppercase">
                              All systems operational and stable
                           </p>
                           <div className="space-y-2">
                              <StatusMetric label="Hospital" value="Normal operations" color="text-emerald-600" />
                              <StatusMetric label="Generator" value="72hr fuel reserve" color="text-gray-950" />
                              <StatusMetric label="Backup power" value="Online and ready" color="text-emerald-600" />
                           </div>
                        </div>
                     </TacticalCard>
                  )}

                  {/* LIVE Logistics & Inventory Surge */}
                  {simulationMode === 'LIVE' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-10">
                        <TacticalCard title="CRITICAL INVENTORY" icon={<Activity size={16} className="text-blue-600" />}>
                           <div className="space-y-6">
                              <CapacityProgress label="Blood Bank (O-)" value={92} color="bg-emerald-500" />
                              <CapacityProgress label="Oxygen Reserve" value={84} color="bg-emerald-500" sub="Liquid O2 Stable" />
                              <CapacityProgress label="Emergency Meds" value={78} color="bg-blue-600" />
                           </div>
                        </TacticalCard>
                        
                        <TacticalCard title="STAFF READINESS" icon={<PlusCircle size={16} className="text-blue-600" />}>
                           <div className="space-y-6">
                              <StatusMetric label="Surge Team" value="On Standby" color="text-blue-600" />
                              <StatusMetric label="ED Physicians" value="12 Active" color="text-gray-950" />
                              <StatusMetric label="Nursing Staff" value="Optimal" color="text-emerald-600" />
                           </div>
                        </TacticalCard>
                     </div>
                  ) : (
                     <>
                        {/* Surge Protocol Checklist (DEMO only) */}
                        <TacticalCard title="SURGE PROTOCOL CHECKLIST" icon={<Activity size={18} className="text-blue-600" />}>
                           <div className="space-y-2">
                              <HospChecklistRow time="09:07" label="Surge protocol alert received" status="ACK" color="emerald" />
                              <HospChecklistRow time="09:12" label="4 ambulances pre-positioned at 90 Feet Rd" status="DONE" color="emerald" />
                              <HospChecklistRow time="09:20" label="Generator fuel check  -  72hr reserve confirmed" status="DONE" color="emerald" />
                              <HospChecklistRow time="09:32" label="Ground floor patient shift  -  flood prep" status="IN PROG" color="orange" />
                              <HospChecklistRow time="09:45" label="Staff surge team on standby" status="PENDING" color="orange" variant="outline" />
                           </div>
                        </TacticalCard>

                        {/* Ambulance Routing (DEMO only) */}
                        <div className="flex-1 glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-50/50 flex flex-col p-8 overflow-hidden relative group">
                           <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                              <Ambulance size={120} />
                           </div>
                           <header className="mb-6 relative z-10">
                              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                 <Ambulance size={18} /> MISSION: AMBULANCE DEPLOYMENT
                              </h3>
                           </header>

                           <div className="flex-1 relative z-10 flex flex-col items-center justify-center py-4">
                              <div className="relative flex flex-col gap-10 w-full max-w-xs">
                                 {/* Vertical Path Line */}
                                 <div className="absolute top-6 bottom-6 left-[23px] w-0.5 border-l-2 border-dashed border-emerald-400 opacity-40" />

                                 <RouteWaypoint
                                    icon={<Activity size={14} />}
                                    label="KEM CASUALTY BASE"
                                    status="DEPARTED"
                                    time="09:12"
                                    color="emerald"
                                 />
                                 <RouteWaypoint
                                    icon={<Navigation size={14} />}
                                    label="PAREL ST BRIDGE"
                                    status="EN ROUTE"
                                    time="09:18"
                                    color="blue"
                                    active
                                 />
                                 <RouteWaypoint
                                    icon={<X size={14} />}
                                    label="SION UNDERPASS"
                                    status="BLOCKED (FLOOD)"
                                    color="red"
                                 />
                                 <RouteWaypoint
                                    icon={<MapPin size={14} />}
                                    label="90 FEET RD STAGING"
                                    status="ETA 09:32"
                                    color="emerald"
                                    variant="outline"
                                 />
                              </div>
                           </div>

                           <div className="mt-6 p-4 bg-blue-600 rounded-2xl shadow-lg relative z-10 group-hover:scale-[1.02] transition-transform">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white animate-pulse">
                                    <Navigation size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-blue-100 uppercase leading-none mb-1">Recommended Detour</p>
                                    <p className="text-[13px] font-bold text-white uppercase tracking-tight">BYPASS SION TO USE LBS MARG</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>

      </div>
   );
}

function CapacityProgress({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
   return (
      <div className="space-y-3">
         <div className="flex justify-between items-center text-[13px] font-black uppercase">
            <span className="text-gray-900">{label}</span>
            <span className="text-gray-950">{value}%</span>
         </div>
         <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
         </div>
         {sub && <p className="text-[11px] font-black text-emerald-600 uppercase text-right">{sub}</p>}
      </div>
   );
}

function StatusMetric({ label, value, color }: { label: string; value: string; color: string }) {
   return (
      <div className="flex items-center gap-4 text-[14px] font-bold uppercase text-center justify-center">
         <span className="text-gray-400 w-32">{label}:</span>
         <span className={color}>{value}</span>
      </div>
   );
}

function HospChecklistRow({ time, label, status, color, variant = 'filled' }: { time: string; label: string; status: string; color: any; variant?: any }) {
   return (
      <div className="flex items-center gap-6 py-4 border-b border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-xl transition-all h-20">
         <span className="text-[13px] font-black text-gray-400">{time}</span>
         <p className="flex-1 text-[14px] font-bold text-gray-700 leading-tight uppercase tracking-tighter">{label}</p>
         <TacticalBadge label={status} color={color} variant={variant} className="shrink-0 w-24 text-center" />
      </div>
   );
}

function RouteWaypoint({ icon, label, status, time, color, variant = 'filled', active = false }: {
   icon: React.ReactNode;
   label: string;
   status: string;
   time?: string;
   color: 'emerald' | 'blue' | 'red' | 'orange';
   variant?: 'filled' | 'outline';
   active?: boolean;
}) {
   return (
      <div className={`flex items-center gap-4 group transition-all ${active ? 'scale-105' : 'opacity-80'}`}>
         <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white
            ${color === 'emerald' ? 'border-emerald-500 text-emerald-600' :
               color === 'blue' ? 'border-blue-500 text-blue-600' :
                  color === 'red' ? 'border-red-500 text-red-600' :
                     'border-orange-500 text-orange-600'}
            ${active ? 'animate-pulse shadow-lg ring-4 ring-offset-2 ring-blue-500/20' : ''}
         `}>
            {icon}
         </div>
         <div className="flex-1 text-center justify-center">
            <div className="flex justify-between items-baseline mb-0.5">
               <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{label}</p>
               {time && <p className="text-[9px] font-bold text-gray-400">{time}</p>}
            </div>
            <p className={`text-[10px] font-black uppercase ${color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`}>
               {status}
            </p>
         </div>
      </div>
   );
}
