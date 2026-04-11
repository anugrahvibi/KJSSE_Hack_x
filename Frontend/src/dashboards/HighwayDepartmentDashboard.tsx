import React, { useState, useEffect, useRef } from 'react';
import { Activity, MapPin, AlertTriangle, CheckCircle2, Navigation, Clock, Route, ArrowRight, Shield, TrendingUp, BarChart3, Users, TrainFront, StopCircle, Zap } from 'lucide-react';
import { fetchActiveAlerts, fetchPredictions } from '../utils/dataFetcher';
import type { StakeholderAction, ZonePrediction } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { useAuth } from '../AuthContext';

export function HighwayDepartmentDashboard() {
  const { simulationMode } = useAuth();
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(containerRef, [alerts, predictions]);

  useEffect(() => {
    // Only fetch data when in live mode (DEMO)
    if (simulationMode !== 'DEMO') {
      setAlerts([]);
      setPredictions([]);
      return;
    }

    async function init() {
      const aData = await fetchActiveAlerts('WESTERN_RAILWAY');
      const pData = await fetchPredictions();
      setAlerts(aData);
      setPredictions(pData);
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
             <div className="glass-card px-6 py-4 rounded-[1.8rem] flex items-center gap-4">
                <div className="text-right">
                   <span className="text-[10px] font-black text-gray-400 uppercase">Track Integrity</span>
                   <div className="text-[14px] font-black text-red-600 uppercase">Compromised (Kurla)</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Primary: Operations Feed */}
           <section className="lg:col-span-2 space-y-8">
              <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col premium-shadow">
                 <div className="p-8 flex items-center justify-between glass-header">
                    <h2 className="font-black text-gray-950 uppercase text-[15px] flex items-center gap-3">
                       <Zap size={16} className="text-orange-600" /> Operational Directives
                    </h2>
                 </div>
                 <div className="p-8 space-y-6">
                    {alerts.map((alert, idx) => (
                       <div key={idx} className="p-6 bg-white/50 border border-black/5 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-md transition-all">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${alert.alert_level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{alert.alert_level} Protocol</span>
                             </div>
                             <p className="text-[15px] font-bold text-gray-950 leading-relaxed italic">"{alert.action}"</p>
                          </div>
                          <AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="WESTERN_RAILWAY" status={(alert as any).status} />
                       </div>
                    ))}
                 </div>
              </div>

              {/* Service Halt Matrix */}
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6">
                 <h3 className="text-[15px] font-black text-gray-900 uppercase flex items-center gap-3">
                    <StopCircle size={18} className="text-red-600" /> Service Halt Matrix
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { sector: "Kurla Slow Track", status: "HALTED", risk: "CRITICAL" },
                      { sector: "Sion Fast Track", status: "WATCH", risk: "AMBER" },
                      { sector: "Matunga Corridor", status: "ACTIVE", risk: "GREEN" }
                    ].map((item, i) => (
                       <div key={i} className={`p-6 rounded-[2.25rem] border ${item.status === 'HALTED' ? 'bg-red-50 border-red-100' : 'bg-white/50 border-black/5'} transition-all`}>
                          <p className="text-[11px] font-black text-gray-400 uppercase mb-1">{item.risk} RISK</p>
                          <p className="text-[14px] font-black text-gray-900 uppercase mb-4">{item.sector}</p>
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase text-center ${
                             item.status === 'HALTED' ? 'bg-red-600 text-white' : (item.status === 'WATCH' ? 'bg-orange-600 text-white' : 'bg-emerald-600 text-white')
                          }`}>{item.status}</div>
                       </div>
                    ))}
                 </div>
              </div>
           </section>

           {/* Sidebar: Crowd Management */}
           <section className="space-y-8">
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-6 bg-white/40 text-gray-950 overflow-hidden relative border border-white/40">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
                 <h3 className="text-[15px] font-black uppercase flex items-center gap-3 relative z-10 text-gray-900">
                    <Users size={18} className="text-blue-600" /> Crowd Management
                 </h3>
                 <div className="space-y-5 relative z-10">
                    {[
                      { station: "Kurla Junction", density: "CRITICAL", count: "14,200", trend: "UP" },
                      { station: "Dadara Terminus", density: "HIGH", count: "8,900", trend: "STABLE" },
                      { station: "Churchgate", density: "OPTIMAL", count: "2,400", trend: "DOWN" }
                    ].map((s, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-[12px] font-black uppercase">
                             <span>{s.station}</span>
                             <span className={s.density === 'CRITICAL' ? 'text-red-500' : 'text-blue-600'}>{s.density}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${s.density === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: s.density === 'CRITICAL' ? '95%' : (s.density === 'HIGH' ? '70%' : '30%') }} />
                             </div>
                             <span className="text-[12px] font-black text-gray-900">{s.count}</span>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-white/10 relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-400 uppercase">Panic Vector Analysis</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase">STABLE</span>
                 </div>
              </div>

              {/* RPF Deployment */}
              <div className="glass-card rounded-[3rem] p-8 premium-shadow space-y-4">
                 <h3 className="text-[14px] font-black text-gray-900 uppercase flex items-center gap-2">
                    <Shield size={16} className="text-blue-600" /> RPF Deployment
                 </h3>
                 <div className="space-y-3">
                    {["Platform 1-4 Enforced", "Entry/Exit Filter Active", "Medical Triage Ready"].map((t, i) => (
                       <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-gray-700 uppercase">
                          <CheckCircle2 size={14} className="text-emerald-600" /> {t}
                       </div>
                    ))}
                 </div>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
}
