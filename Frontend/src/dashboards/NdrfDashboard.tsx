import React, { useEffect, useState, useRef } from 'react';
import { MapView } from '../components/MapView';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, InfrastructureNode, StakeholderAction } from '@schema';
import { Shield, Zap, Target, Clock, CheckCircle2, Navigation, MapPin, Activity, ShieldAlert, X } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { useAuth } from '../AuthContext';

export function NdrfDashboard() {
  const { simulationMode } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    // Only fetch data when in live mode (DEMO)
    if (simulationMode !== 'DEMO') {
      setZones(null);
      setInfra([]);
      setPredictions([]);
      setAlerts([]);
      return;
    }

    async function init() {
      const [zData, iData, pData, aData] = await Promise.all([
        fetchZones(),
        fetchInfrastructure(),
        fetchPredictions(),
        fetchActiveAlerts('NDRF'),
      ]);
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
    }
    init();
    const interval = setInterval(init, 5000);
    return () => clearInterval(interval);
  }, [simulationMode]);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-16 sm:pt-20 lg:pt-24 flex flex-col lg:flex-row gap-6 p-8 overflow-y-auto custom-scrollbar">
      {/* Tactical Map Area (Primary focus for NDRF) */}
      <div className="flex-[0.65] relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl">
        <MapView
          zonesGeoJson={zones}
          infrastructureNodes={infra}
          predictions={predictions}
          onZoneClick={setSelectedZone}
          selectedZoneId={selectedZone}
        />
        <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-blue-600 uppercase border border-blue-200 flex items-center gap-2">
           <Navigation size={12} className="animate-pulse" /> Live Deployment Grid
        </div>
      </div>

      {/* NDRF Mission Control (Sidebar) */}
      <div className="flex-[0.35] flex flex-col gap-5">
        <AccountabilityBanner />

        {/* Mission Directives */}
        <section className="glass-card rounded-[2.2rem] p-6 border border-white/40 shadow-xl space-y-4">
           <header className="flex justify-between items-center">
              <h3 className="text-[13px] font-black text-gray-950 uppercase flex items-center gap-2">
                 <ShieldAlert size={16} className="text-red-600" /> Rescue Directives
              </h3>
              <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">ACTIVE BATTALION</span>
           </header>
           
           <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <div key={idx} className="p-4 bg-white/50 border border-black/5 rounded-2xl space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{alert.alert_level} Protocol</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Clock size={10} /> T-{alert.time_window_hours}h</span>
                   </div>
                   <p className="text-[14px] font-bold text-gray-900 leading-snug italic">"{alert.action}"</p>
                   <div className="flex justify-end pt-2 border-t border-black/5">
                      <AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="NDRF" status={(alert as any).status} />
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Pre-positioning Checklist */}
        <section className="glass-card rounded-[2.2rem] p-6 border border-white/40 shadow-xl space-y-4 bg-white/40 text-gray-900">
           <h3 className="text-[13px] font-black uppercase flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" /> Pre-positioning Status
           </h3>
           <div className="space-y-3">
              {[
                { task: "H-East Ward HQ Secured", status: "READY" },
                { task: "Mithi River Inflatable Boats", status: "STAGED" },
                { task: "Air-Evac Priority 1 Zone (Sion)", status: "IN-ROUTE" },
                { task: "Matrix-Riva SATCOM Sync", status: "READY" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-black/5 hover:bg-white transition-all shadow-sm">
                   <span className="text-[11px] font-bold uppercase tracking-tight">{item.task}</span>
                   <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${
                      item.status === 'READY' ? 'bg-emerald-600' : (item.status === 'STAGED' ? 'bg-blue-600' : 'bg-orange-600')
                   }`}>{item.status}</span>
                </div>
              ))}
           </div>
        </section>

        {/* Evacuation Route Telemetry */}
        <section className="glass-card rounded-[2.2rem] p-6 border border-white/40 shadow-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Navigation size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Evac Route Stability</p>
              <div className="flex items-center gap-6">
                 <div className="text-xl font-black text-gray-950 brand-font">SECURE</div>
                 <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Flow Rate: 4x</span>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
