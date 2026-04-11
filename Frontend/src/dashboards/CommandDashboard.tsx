import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchPredictions, fetchActiveAlerts, fetchInfrastructure, fetchEnvironmentalData } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import { MapView } from '../components/MapView';
import { ProgressBar } from '../components/common/ProgressBar';
import { TacticalCard, TacticalMetric, TacticalAlertRow, TacticalBadge, Label, LabelButton, TacticalSparkline, TacticalBarChart } from '../components/tactical/TacticalLibrary';
import { BrainCircuit, Maximize2, ChevronUp, History, AlertTriangle } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useAuth } from '../AuthContext';

export function CommandDashboard() {
  const { simulationMode } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>("H-East");
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [environmentalData, setEnvironmentalData] = useState<any>(null);

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    // Fetch data when in demo mode (live simulation)
    if (simulationMode !== 'DEMO') {
      setZones(null);
      setInfra([]);
      setPredictions([]);
      setAlerts([]);
      setEnvironmentalData(null);
      setLastUpdated('');
      return;
    }

    async function init() {
      const [zData, iData, pData, aData, eData] = await Promise.all([
        fetchZones(),
        fetchInfrastructure(),
        fetchPredictions(),
        fetchActiveAlerts('NDRF'),
        fetchEnvironmentalData(),
      ]);
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
      setEnvironmentalData(eData);
      setLastUpdated(new Date().toLocaleTimeString());
    }
    init();
    const interval = setInterval(init, 5000);
    return () => clearInterval(interval);
  }, [simulationMode]);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-40 sm:pt-44 lg:pt-48 px-3 sm:px-4 lg:px-6 py-10 flex flex-col lg:flex-row gap-8 overflow-y-auto custom-scrollbar overflow-visible">
      
      <div className="flex-[0.65] flex flex-col gap-10">
        {/* Map Panel (Top Left) */}
        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
          <MapView
            zonesGeoJson={zones}
            infrastructureNodes={infra}
            predictions={predictions}
            onZoneClick={setSelectedZone}
            selectedZoneId={selectedZone}
          />
          {simulationMode !== 'DEMO' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] rounded-[2.5rem]">
              <div className="text-center text-white">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-black uppercase mb-2">System Offline</h3>
                <p className="text-sm opacity-80">Click "Live Mode" to activate real-time flood monitoring</p>
              </div>
            </div>
          )}
          <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-white/80 uppercase border border-white/10 flex items-center gap-2">
             MUMBAI WARD MAP  -  {simulationMode === 'DEMO' ? 'DEMO MODE ACTIVE' : 'SYSTEM OFFLINE'}
          </div>
          
           <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-3 glass-card px-4 py-3 rounded-full border border-white/10">
             <LegendItem color="bg-red-600" label="Critical (0%)" />
             <LegendItem color="bg-orange-500" label="Warning (20-60%)" />
             <LegendItem color="bg-emerald-500" label="Clear (>60%)" />
          </div>
        </div>

        {/* Status Ward Panel (Bottom Left) */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/40 shadow-xl space-y-6">
           <header className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Status  -  Ward {selectedZone || 'H-East (Dharavi)'} {simulationMode === 'DEMO' ? 'Demo Active' : 'System Offline'}</span>
              <Maximize2 size={14} className="opacity-40" />
           </header>
           
           {simulationMode === 'DEMO' ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <TacticalMetric 
                    label="Tide height" 
                    value={`${environmentalData?.tide_height_m || 0}m`} 
                    sub={`Outfall: ${environmentalData?.outfall_elevation_m || 4.2}m`} 
                    color="text-red-500"
                  />
                  <TacticalSparkline data={[2.1, 2.8, 3.5, 4.2, 4.8, 5.2]} color="#ef4444" height={30} />
                </div>

                <div className="space-y-4">
                  <TacticalMetric 
                    label="Rainfall" 
                    value={`${environmentalData?.rainfall_mm_hr || 0}mm/hr`} 
                    sub={`IMD Threshold: 65`} 
                    color={(environmentalData?.rainfall_mm_hr || 0) > 65 ? "text-red-500" : "text-orange-500"}
                  />
                  <TacticalSparkline data={[5, 12, 28, 45, 68, 85]} color="#f97316" height={30} />
                </div>

                <div className="space-y-4">
                  <TacticalMetric 
                    label="Drain capacity" 
                    value={`${environmentalData?.drain_capacity_pct || 0}%`} 
                    sub="System load" 
                    color={environmentalData?.drain_capacity_pct === 0 ? "text-red-500" : "text-green-500"}
                  />
                  <TacticalBarChart items={[
                    { label: 'SION', value: 92, color: 'bg-red-500' },
                    { label: 'KURLA', value: 85, color: 'bg-orange-500' },
                    { label: 'MAHIM', value: 40, color: 'bg-emerald-500' }
                  ]} />
                </div>

                <TacticalMetric 
                  label="Tide direction" 
                  value={environmentalData?.tide_direction || "Incoming"} 
                  sub={`Peak in ~4 hrs`} 
                  icon={<ChevronUp size={28} className="text-orange-500" />}
                  color="text-orange-500"
                />
             </div>
           ) : (
             <div className="text-center py-8">
               <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
               <h3 className="text-lg font-bold text-gray-400 uppercase mb-2">Real-time Data Unavailable</h3>
               <p className="text-sm text-gray-500">Activate Live Mode to view current flood status and sensor readings</p>
             </div>
           )}
        </div>

        {/* Deadline Footer (Footer Left) */}
          <div className="glass-card p-6 rounded-full border border-red-200/50 bg-red-50/10 flex items-center justify-between px-10 shadow-xl overflow-visible">
           <div className="flex items-center gap-6 flex-1 max-w-xl">
              <Label label="BMC Deadline" as="div" className="text-[11px] text-red-600 shrink-0" />
                <ProgressBar
                  value={65}
                  className="flex-1 h-3"
                  trackClassName="bg-red-600/10"
                  fillClassName="bg-red-600"
                  animated
                />
              <span className="text-[12px] font-bold text-gray-900 brand-font">06:12 REMAINING</span>
           </div>
            <Label label="Dispatched" as="div" className="bg-red-600 text-[10px] text-white ml-10 shadow-lg shadow-red-500/20" />
        </div>
      </div>

      {/* RIGHT COLUMN (35%) */}
      <div className="flex-[0.35] flex flex-col gap-6">
        
        {/* RIVA Reasoning Panel (Top Right) */}
        <TacticalCard
          title="Riva Agent - Reasoning"
          subtitle="Active"
          icon={<BrainCircuit size={18} className="text-blue-600" />}
          className="flex-[0.55]"
          dark={false} // Switch to light as per previous request
        >
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="flex flex-wrap gap-2 mb-8 relative z-10">
              <TacticalBadge label="Critical" color="red" variant="filled" />
              <TacticalBadge label="Tide â†‘ Rising" color="orange" variant="outline" />
              <TacticalBadge label="09:07 Â· Peak Hour" color="gray" variant="outline" />
           </div>

           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-dark mb-8 relative z-10 max-h-[200px]">
              {[
                "Peak commute. 3.5M on WR right now.",
                "Tide still rising - 4 hrs zero drainage.",
                "Sion underpass closes in ~15 min. NDRF default route blocked.",
                "Rerouting Bn4 via 60 Feet Road instead.",
                "KEM at 65% - surge protocol viable now."
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 group-hover:scale-150 transition-all shadow-glow-blue" />
                   <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">"{text}"</p>
                </div>
              ))}
           </div>

           <div className="pt-6 border-t border-black/5 flex flex-col gap-5 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">
                 <span>5 DISPATCHED Â· 1.8S Â· LLAMA-3.3-70B</span>
                 <span className="text-blue-600">DISPATCHED</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <LabelButton label="Ack All" tone="neutral" className="text-[12px]" />
                  <LabelButton label="Escalate" tone="danger-soft" className="text-[12px]" />
              </div>
           </div>
        </TacticalCard>

        {/* Alert Feed Log (Bottom Right) */}
        <TacticalCard 
          title="Alert Feed - Live Log"
          icon={<History size={18} className="text-slate-700" />}
          className="flex-[0.45]"
        >
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {alerts.map((alert, idx) => (
                <TacticalAlertRow 
                  key={idx}
                  status={idx === 0 ? 'OVERDUE' : (idx === 1 ? 'ACK' : 'SENT')}
                  title={`${alert.department || 'OFFICER'}`}
                  description={alert.action}
                  time={`09:${27 - idx * 10}`}
                />
              ))}
           </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pill-badge bg-white/50 border border-white/20">
       <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-lg`} />
       <span className="text-[10px] font-black text-gray-950 uppercase">{label}</span>
    </div>
  );
}


