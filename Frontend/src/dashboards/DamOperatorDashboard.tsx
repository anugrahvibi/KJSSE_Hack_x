import React, { useState, useEffect, useRef } from 'react';
import { Activity, Droplets, Target, CheckCircle2, Waves, Settings, AlertTriangle, Zap, Wind, Shield, ArrowRight, MapPin, TrendingUp, BarChart3, Layers, Activity as Pulse, Map as MapIcon, XCircle, AlertCircle, Clock } from 'lucide-react';
import { fetchActiveAlerts, fetchSensorReadings, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, SensorReading, ZonePrediction } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';

export function DamOperatorDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sensor, setSensor] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [prediction, setPrediction] = useState<ZonePrediction | null>(null);

  useGsapAnimations(containerRef, [sensor, alerts, prediction]);

  useEffect(() => {
    async function init() {
      const sData = await fetchSensorReadings('H-East');
      const aData = await fetchActiveAlerts('BMC_WARD_OFFICER');
      const pData = await fetchPredictions();

      if (sData.length > 0) setSensor(sData[0]);
      setAlerts(aData);
      setPrediction(pData.find(p => p.zone_id === 'H-East') || null);
    }
    init();
    const interval = setInterval(init, 3000);
    return () => clearInterval(interval);
  }, []);

  const level = prediction ? getPredictionAlertLevel(prediction) : 'GREEN';
  const systemStatus = level === 'RED' ? 'CRITICAL' : (level === 'YELLOW' || level === 'ORANGE') ? 'WARNING' : 'NORMAL';

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-10 py-4 sm:py-6">
        <AccountabilityBanner />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Waves size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 brand-font uppercase leading-none">
                BMC <span className="text-blue-600">Ward Hub</span>
              </h1>
            </div>
            <p className="text-gray-700 font-bold uppercase text-[15px] pl-1 flex items-center gap-2">
              <Activity size={14} className="text-slate-600 animate-pulse" /> Ward H-East Tactical Hub
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="glass-card px-8 py-4 rounded-[2rem] border border-white/40 shadow-xl flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">Operational Window</span>
                <span className="text-2xl font-black text-gray-900 brand-font">48 MINS</span>
             </div>
             <div className="w-16 h-16 rounded-[2rem] bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20 animate-pulse">
                <AlertCircle size={32} />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Feed: Alerts & Directives */}
          <section className="lg:col-span-2 space-y-8">
            <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col premium-shadow">
               <div className="p-8 flex items-center justify-between glass-header">
                 <h2 className="font-black text-gray-950 uppercase text-[15px] flex items-center gap-3">
                   <Target size={16} className="text-blue-600" /> Dispatch Directives
                 </h2>
                 <span className="px-3 py-1 bg-blue-500/10 rounded-full text-[12px] font-black text-blue-700 uppercase">{alerts.length} ORDERS</span>
               </div>
               <div className="p-8 space-y-6">
                 {alerts.map((alert, idx) => (
                   <div key={idx} className="p-6 bg-white/50 border border-black/5 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-md transition-all">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${alert.alert_level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{alert.alert_level} PROTOCOL</span>
                           <span className="text-[10px] font-black text-gray-400 uppercase italic">T-{alert.time_window_hours}h Deadline</span>
                        </div>
                        <p className="text-[15px] font-bold text-gray-950 leading-relaxed italic">"{alert.action}"</p>
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="BMC_WARD_OFFICER" status={(alert as any).status} />
                        <button className="px-6 py-3 bg-red-600/10 text-red-600 rounded-2xl font-black text-[11px] uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Escalate</button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Roads to Close */}
            <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6">
               <h3 className="text-[15px] font-black text-gray-900 uppercase flex items-center gap-3">
                  <XCircle size={18} className="text-red-600" /> Sector Access Neutralization
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { road: "Sion-Bandra Link Road", status: "PENDING", level: "CRITICAL" },
                    { road: "BKC Road (Eastbound)", status: "CLOSED", level: "NORMAL" },
                    { road: "CST Road Junction", status: "PENDING", level: "WATCH" },
                    { road: "Western Exp Highway (H-East Mouth)", status: "OPEN", level: "STANDBY" }
                  ].map((r, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/50 border border-black/5 flex items-center justify-between transition-all hover:border-red-200">
                       <div>
                          <p className="text-[13px] font-black text-gray-950 uppercase">{r.road}</p>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.level}</span>
                       </div>
                       <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${r.status === 'CLOSED' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                          {r.status}
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </section>

          {/* Sidebar: Pump Stations */}
          <section className="space-y-8">
             <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6 bg-white/40 text-gray-950 overflow-hidden relative border border-white/40">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
                <h3 className="text-[15px] font-black uppercase flex items-center gap-3 relative z-10 text-gray-900">
                   <Droplets size={18} className="text-blue-600" /> Pump Infrastructure
                </h3>
                <div className="space-y-4 relative z-10">
                   {[
                     { name: "H-East Station 1", capacity: "92%", status: "OPTIMAL" },
                     { name: "H-East Station 2", capacity: "110%", status: "OVERLOAD" },
                     { name: "Mithi Mouth Bypass", capacity: "0%", status: "DEADLOCK" }
                   ].map((p, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/50 border border-black/5 space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[12px] font-black uppercase tracking-wider text-gray-900">{p.name}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.status === 'DEADLOCK' ? 'bg-red-600' : (p.status === 'OVERLOAD' ? 'bg-orange-600' : 'bg-emerald-600')} text-white`}>
                               {p.status}
                            </span>
                         </div>
                         <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${p.status === 'DEADLOCK' ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: p.capacity }} />
                         </div>
                         <div className="text-[11px] font-black text-blue-600/80 uppercase">Output: {p.capacity} Flow</div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-4">
                <h3 className="text-[14px] font-black text-gray-900 uppercase">Operational Protocol</h3>
                <p className="text-[12px] font-bold text-gray-500 leading-relaxed italic">
                   "All pumps must remain active until high tide recession at 11:45 AM. Monitor Mithi backflow sensors continuously."
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                   <Clock size={14} className="text-blue-600" />
                   <span className="text-[12px] font-black text-gray-900 uppercase">Sync: 0.4s Latency</span>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
