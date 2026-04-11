import React, { useState, useEffect, useRef } from 'react';
import { TrainFront, Activity, Zap, StopCircle, Users, Shield, CheckCircle2 } from 'lucide-react';
import { fetchActiveAlerts, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, ZonePrediction } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { ProgressBar } from '../components/common/ProgressBar';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { TacticalCard, TacticalAlertRow, TacticalBadge } from '../components/tactical/TacticalLibrary';

export function HighwayDepartmentDashboard() {
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(containerRef, [alerts, predictions]);

  useEffect(() => {
    async function init() {
      const aData = await fetchActiveAlerts('WESTERN_RAILWAY');
      const pData = await fetchPredictions();
      setAlerts(aData);
      setPredictions(pData);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} className="pt-28 sm:pt-32 lg:pt-36 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-10 py-6">
        <AccountabilityBanner />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                   <TrainFront size={28} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-950 brand-font uppercase leading-none">
                   Western <span className="text-blue-700">Railway</span> Command
                </h1>
             </div>
             <p className="text-gray-700 font-bold uppercase text-[15px] pl-1 flex items-center gap-2">
                <Activity size={14} className="text-blue-600 animate-pulse" /> Kurla · Sion · Matunga Tactical Grid
             </p>
          </div>
          <div className="flex gap-4">
             <div className="glass-card px-6 py-4 rounded-[1.8rem] flex items-center gap-4 border border-white/40 shadow-xl">
                <div className="text-right">
                   <span className="text-[10px] font-black text-gray-400 uppercase">Track Integrity</span>
                   <div className="text-[14px] font-black text-red-600 uppercase">Compromised (Kurla)</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           <section className="lg:col-span-2 space-y-8">
              <TacticalCard title="Operational Directives" icon={<Zap size={16} className="text-orange-600" />}>
                 <div className="space-y-4">
                    {alerts.map((alert, idx) => (
                       <TacticalAlertRow 
                         key={idx}
                         status="ACTIVE"
                         title={`${alert.alert_level} Protocol`}
                         description={alert.action}
                         action={<AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="WESTERN_RAILWAY" status={(alert as any).status} />}
                       />
                    ))}
                 </div>
              </TacticalCard>

              <TacticalCard title="Service Halt Matrix" icon={<StopCircle size={18} className="text-red-600" />}>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { sector: "Kurla Slow Track", status: "HALTED", risk: "CRITICAL" },
                      { sector: "Sion Fast Track", status: "WATCH", risk: "AMBER" },
                      { sector: "Matunga Corridor", status: "ACTIVE", risk: "GREEN" }
                    ].map((item, i) => (
                       <div key={i} className={`p-6 rounded-[2.25rem] border ${item.status === 'HALTED' ? 'bg-red-50 border-red-100' : 'bg-white/50 border-black/5'} transition-all shadow-sm`}>
                          <p className="text-[11px] font-black text-gray-400 uppercase mb-1">{item.risk} RISK</p>
                          <p className="text-[14px] font-black text-gray-900 uppercase mb-4">{item.sector}</p>
                          <TacticalBadge 
                            label={item.status} 
                            color={item.status === 'HALTED' ? 'red' : (item.status === 'WATCH' ? 'orange' : 'emerald')} 
                            variant={item.status === 'HALTED' ? 'filled' : 'outline'} 
                            className="w-full" 
                          />
                       </div>
                    ))}
                 </div>
              </TacticalCard>
           </section>

           <section className="space-y-8">
              <TacticalCard title="Crowd Management" icon={<Users size={18} className="text-blue-600" />}>
                 <div className="space-y-6">
                    {[
                      { station: "Kurla Junction", density: "CRITICAL", count: "14,200", trend: "UP" },
                      { station: "Dadara Terminus", density: "HIGH", count: "8,900", trend: "STABLE" },
                      { station: "Churchgate", density: "OPTIMAL", count: "2,400", trend: "DOWN" }
                    ].map((s, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-[12px] font-black uppercase">
                             <span>{s.station}</span>
                             <span className={s.density === 'CRITICAL' ? 'text-red-600' : 'text-blue-600'}>{s.density}</span>
                          </div>
                          <div className="flex items-center gap-4">
                                           <ProgressBar
                                              value={s.density === 'CRITICAL' ? '95%' : (s.density === 'HIGH' ? '70%' : '30%')}
                                              className="flex-1 h-1.5"
                                              trackClassName="bg-gray-100"
                                              fillClassName={s.density === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-600'}
                                           />
                             <span className="text-[12px] font-black text-gray-900">{s.count}</span>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 uppercase">Panic Vector Analysis</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">STABLE</span>
                 </div>
              </TacticalCard>

              <TacticalCard title="RPF Deployment" icon={<Shield size={16} className="text-blue-600" />}>
                 <div className="space-y-3">
                    {["Platform 1-4 Enforced", "Entry/Exit Filter Active", "Medical Triage Ready"].map((t, i) => (
                       <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-gray-700 uppercase">
                          <CheckCircle2 size={14} className="text-emerald-600" /> {t}
                       </div>
                    ))}
                 </div>
              </TacticalCard>
           </section>
        </div>
      </div>
    </div>
  );
}
