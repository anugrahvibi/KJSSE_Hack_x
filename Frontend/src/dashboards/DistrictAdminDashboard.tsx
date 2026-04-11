import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { Users, Shield, Activity, BarChart3, Zap, Clock, Target, PlusCircle, Ambulance, Bed, History, AlertTriangle } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { useAuth } from '../AuthContext';

export function DistrictAdminDashboard() {
  const { simulationMode } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    // Only fetch data when in live mode (DEMO)
    if (simulationMode !== 'DEMO') {
      setPredictions([]);
      setAlerts([]);
      return;
    }

    async function init() {
      const [pData, aData] = await Promise.all([
        fetchPredictions(),
        fetchActiveAlerts('KEM_HOSPITAL'),
      ]);
      setPredictions(pData);
      setAlerts(aData);
    }
    init();
  }, [simulationMode]);

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto space-y-10 py-4 sm:p-6">
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
           
           {/* Section 1: Surge Directives */}
           <section className="lg:col-span-2 space-y-8">
              <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col premium-shadow">
                 <div className="p-8 flex items-center justify-between glass-header">
                    <h2 className="font-black text-gray-950 uppercase text-[15px] flex items-center gap-3">
                       <Zap size={16} className="text-red-600" /> Medical Directives
                    </h2>
                 </div>
                 <div className="p-8 space-y-6">
                    {alerts.map((alert, idx) => (
                       <div key={idx} className="p-6 bg-white/50 border border-black/5 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-md transition-all">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${alert.alert_level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{alert.alert_level} PROTOCOL</span>
                             </div>
                             <p className="text-[15px] font-bold text-gray-950 leading-relaxed italic">"{alert.action}"</p>
                          </div>
                          <AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="KEM_HOSPITAL" status={(alert as any).status} />
                       </div>
                    ))}
                 </div>
              </div>

              {/* Bed Capacity Heatmap Specified */}
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6">
                 <h3 className="text-[15px] font-black text-gray-900 uppercase flex items-center gap-3">
                    <Bed size={18} className="text-blue-600" /> Ward Saturation Heatmap
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { ward: "Trauma ICU", load: 98, status: "CRITICAL" },
                      { ward: "Pediatric", load: 72, status: "HIGH" },
                      { ward: "General (M)", load: 85, status: "NEAR-CAP" },
                      { ward: "Isolation", load: 45, status: "STABLE" }
                    ].map((w, i) => (
                       <div key={i} className={`p-6 rounded-[2.25rem] border ${w.load > 90 ? 'bg-red-50 border-red-100' : 'bg-white/50 border-black/5'} flex flex-col items-center`}>
                          <span className="text-[10px] font-black text-gray-400 uppercase mb-2">{w.ward}</span>
                          <div className="text-2xl font-black text-gray-950 brand-font mb-1">{w.load}%</div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${w.load > 90 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>{w.status}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </section>

           {/* Section 2: Logistics & Prepositioning */}
           <section className="space-y-8">
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6 bg-white/40 text-gray-950 overflow-hidden relative border border-white/40">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full" />
                 <h3 className="text-[15px] font-black uppercase flex items-center gap-3 relative z-10 text-gray-900">
                    <Ambulance size={18} className="text-red-600" /> Ambulance Prepositioning
                 </h3>
                 <div className="space-y-5 relative z-10">
                    {[
                      { loc: "Sion Matrix Point", unit: "Unit 04-A", status: "STAGED", eta: "EST: T-5M" },
                      { loc: "H-East Ward HQ", unit: "Unit 09-C", status: "READY", eta: "EST: ACTIVE" },
                      { loc: "Worli Sea Link Mouth", unit: "Unit 02-B", status: "IN-ROUTE", eta: "EST: T-12M" }
                    ].map((a, i) => (
                       <div key={i} className="p-5 rounded-2xl bg-white/50 border border-black/5 space-y-2">
                          <div className="flex justify-between items-center text-[12px] font-black uppercase">
                             <span className="text-gray-900">{a.unit}</span>
                             <span className={a.status === 'IN-ROUTE' ? 'text-blue-600' : 'text-emerald-600'}>{a.status}</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase">{a.loc}</p>
                          <div className="text-[10px] font-black text-red-600/80">{a.eta}</div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Trauma Protocols */}
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-4">
                 <h3 className="text-[14px] font-black text-gray-900 uppercase flex items-center gap-2">
                    <History size={16} className="text-red-600" /> Trauma Protocol S-10
                 </h3>
                 <p className="text-[12px] font-bold text-gray-500 leading-relaxed italic">
                    "Execute secondary bed triage. Redirect non-critical influx to suburban satellite clinics. Maintain 15% trauma reserve."
                 </p>
                 <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-[11px] font-black text-gray-900 uppercase">Surge Level: HIGH</span>
                 </div>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
}
