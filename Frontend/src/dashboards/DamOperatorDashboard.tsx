import React, { useState, useEffect, useRef } from 'react';
import { Waves, Target, Droplets, Activity, AlertCircle, Clock, XCircle } from 'lucide-react';
import { fetchActiveAlerts, fetchSensorReadings, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, SensorReading, ZonePrediction } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { TacticalCard, TacticalMetric, TacticalAlertRow, TacticalBadge } from '../components/tactical/TacticalLibrary';
import { ProgressBar } from '../components/common/ProgressBar';

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

  return (
    <div ref={containerRef} className="pt-28 sm:pt-32 lg:pt-36 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-10 py-6">
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
          
          <section className="lg:col-span-2 space-y-8">
            <TacticalCard 
              title="Dispatch Directives" 
              icon={<Target size={16} className="text-blue-600" />}
              badge={<span className="px-3 py-1 bg-blue-500/10 rounded-full text-[12px] font-black text-blue-700 uppercase">{alerts.length} ORDERS</span>}
            >
               <div className="space-y-4">
                  {alerts.map((alert, idx) => (
                    <TacticalAlertRow 
                      key={idx}
                      status="ACTIVE"
                      title={`${alert.alert_level} Protocol`}
                      description={alert.action}
                      time={`T-${alert.time_window_hours}h`}
                      action={<AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="BMC_WARD_OFFICER" status={(alert as any).status} />}
                    />
                  ))}
               </div>
            </TacticalCard>

            <TacticalCard 
              title="Sector Access Neutralization"
              icon={<XCircle size={18} className="text-red-600" />}
            >
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
            </TacticalCard>
          </section>

          <section className="space-y-8">
             <TacticalCard 
               title="Pump Infrastructure"
               icon={<Droplets size={18} className="text-blue-600" />}
               dark={false}
             >
                <div className="space-y-5">
                   {[
                     { name: "H-East Station 1", capacity: "92%", status: "OPTIMAL" },
                     { name: "H-East Station 2", capacity: "110%", status: "OVERLOAD" },
                     { name: "Mithi Mouth Bypass", capacity: "0%", status: "DEADLOCK" }
                   ].map((p, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/50 border border-black/5 space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[12px] font-black uppercase tracking-wider text-gray-900">{p.name}</span>
                            <TacticalBadge 
                              label={p.status} 
                              color={p.status === 'DEADLOCK' ? 'red' : (p.status === 'OVERLOAD' ? 'orange' : 'emerald')} 
                              variant={p.status === 'DEADLOCK' ? 'filled' : 'outline'} 
                            />
                         </div>
                         <ProgressBar
                           value={p.capacity}
                           className="h-2"
                           trackClassName="bg-gray-100"
                           fillClassName={p.status === 'DEADLOCK' ? 'bg-red-600' : 'bg-blue-600'}
                         />
                         <div className="text-[11px] font-black text-blue-600/80 uppercase">Output: {p.capacity} Flow</div>
                      </div>
                   ))}
                </div>
             </TacticalCard>

             <TacticalCard title="Operational Protocol">
                <p className="text-[12px] font-bold text-gray-500 leading-relaxed italic">
                   "All pumps must remain active until high tide recession at 11:45 AM. Monitor Mithi backflow sensors continuously."
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                   <Clock size={14} className="text-blue-600" />
                   <span className="text-[12px] font-black text-gray-900 uppercase">Sync: 0.4s Latency</span>
                </div>
             </TacticalCard>
          </section>
        </div>
      </div>
    </div>
  );
}
