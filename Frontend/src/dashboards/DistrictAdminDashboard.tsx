import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction } from '@schema';
import { PlusCircle, Activity, Zap, Bed, Ambulance, History, AlertTriangle } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { TacticalCard, TacticalAlertRow, TacticalBadge } from '../components/tactical/TacticalLibrary';

export function DistrictAdminDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    async function init() {
      const [pData, aData] = await Promise.all([
        fetchPredictions(),
        fetchActiveAlerts('KEM_HOSPITAL'),
      ]);
      setPredictions(pData);
      setAlerts(aData);
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
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <PlusCircle size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 brand-font uppercase leading-none">
                KEM <span className="text-red-600">Hospital</span> Hub
              </h1>
            </div>
            <p className="text-gray-700 font-bold uppercase text-[15px] pl-1 flex items-center gap-2">
              <Activity size={14} className="text-red-600 animate-pulse" /> Surge Protocol Control & Trauma Logistics
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="glass-card px-8 py-4 rounded-[2rem] border border-red-100 bg-red-50/30 shadow-xl flex flex-col items-center">
                <span className="text-[10px] font-black text-red-600/60 uppercase">Surge Protocol</span>
                <span className="text-2xl font-black text-red-600 brand-font">ACTIVE (S-4)</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           <section className="lg:col-span-2 space-y-8">
              <TacticalCard title="Medical Directives" icon={<Zap size={16} className="text-red-600" />}>
                 <div className="space-y-4">
                    {alerts.map((alert, idx) => (
                       <TacticalAlertRow 
                         key={idx}
                         status="ACTIVE"
                         title={`${alert.alert_level} Protocol`}
                         description={alert.action}
                         action={<AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="KEM_HOSPITAL" status={(alert as any).status} />}
                       />
                    ))}
                 </div>
              </TacticalCard>

              <TacticalCard title="Ward Saturation Heatmap" icon={<Bed size={18} className="text-blue-600" />}>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { ward: "Trauma ICU", load: 98, status: "CRITICAL" },
                      { ward: "Pediatric", load: 72, status: "HIGH" },
                      { ward: "General (M)", load: 85, status: "NEAR-CAP" },
                      { ward: "Isolation", load: 45, status: "STABLE" }
                    ].map((w, i) => (
                       <div key={i} className={`p-6 rounded-[2.25rem] border ${w.load > 90 ? 'bg-red-50 border-red-100 shadow-sm' : 'bg-white/50 border-black/5 shadow-sm'} flex flex-col items-center group hover:scale-105 transition-transform`}>
                          <span className="text-[10px] font-black text-gray-400 uppercase mb-2 group-hover:text-gray-600">{w.ward}</span>
                          <div className="text-2xl font-black text-gray-950 brand-font mb-2">{w.load}%</div>
                          <TacticalBadge 
                            label={w.status} 
                            color={w.load > 90 ? 'red' : 'blue'} 
                            variant={w.load > 90 ? 'filled' : 'outline'} 
                          />
                       </div>
                    ))}
                 </div>
              </TacticalCard>
           </section>

           <section className="space-y-8">
              <TacticalCard title="Ambulance Prepositioning" icon={<Ambulance size={18} className="text-red-600" />}>
                 <div className="space-y-5">
                    {[
                      { loc: "Sion Matrix Point", unit: "Unit 04-A", status: "STAGED", eta: "EST: T-5M" },
                      { loc: "H-East Ward HQ", unit: "Unit 09-C", status: "READY", eta: "EST: ACTIVE" },
                      { loc: "Worli Sea Link Mouth", unit: "Unit 02-B", status: "IN-ROUTE", eta: "EST: T-12M" }
                    ].map((a, i) => (
                       <div key={i} className="p-5 rounded-2xl bg-white/50 border border-black/5 space-y-2 group hover:border-red-200 transition-all">
                          <div className="flex justify-between items-center text-[12px] font-black uppercase">
                             <span className="text-gray-900 group-hover:text-red-700 transition-colors">{a.unit}</span>
                             <span className={a.status === 'IN-ROUTE' ? 'text-blue-600' : 'text-emerald-600'}>{a.status}</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase">{a.loc}</p>
                          <div className="text-[10px] font-black text-red-600/80">{a.eta}</div>
                       </div>
                    ))}
                 </div>
              </TacticalCard>

              <TacticalCard title="Trauma Protocol S-10" icon={<History size={16} className="text-red-600" />}>
                 <p className="text-[12px] font-bold text-gray-500 leading-relaxed italic">
                    "Execute secondary bed triage. Redirect non-critical influx to suburban satellite clinics. Maintain 15% trauma reserve."
                 </p>
                 <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-[11px] font-black text-gray-900 uppercase">Surge Level: HIGH</span>
                 </div>
              </TacticalCard>
           </section>
        </div>
      </div>
    </div>
  );
}
