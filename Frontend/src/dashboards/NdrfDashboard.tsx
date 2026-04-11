import React, { useEffect, useState, useRef } from 'react';
import { MapView } from '../components/MapView';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, InfrastructureNode, StakeholderAction } from '@schema';
import { Navigation, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { AckButton } from '../components/AckButton';
import { TacticalCard, TacticalAlertRow, TacticalBadge, Label } from '../components/tactical/TacticalLibrary';

export function NdrfDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
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
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-28 sm:pt-32 lg:pt-36 flex flex-col lg:flex-row gap-6 p-8 overflow-y-auto custom-scrollbar overflow-visible">
      
      {/* Tactical Map Area */}
      <div className="flex-[0.65] relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
        <MapView
          zonesGeoJson={zones}
          infrastructureNodes={infra}
          predictions={predictions}
          onZoneClick={setSelectedZone}
          selectedZoneId={selectedZone}
        />
        <Label
          label="Live Deployment Grid"
          icon={<Navigation size={12} className="animate-pulse" />}
          as="div"
          className="absolute top-6 left-6 z-[1000] glass-card text-blue-600 border border-blue-200"
        />
      </div>

      {/* NDRF Mission Control */}
      <div className="flex-[0.35] flex flex-col gap-6">
        <AccountabilityBanner />

        <TacticalCard 
          title="Rescue Directives" 
          icon={<ShieldAlert size={16} className="text-red-600" />}
          badge={<Label label="Active Battalion" className="text-red-600 bg-red-100" />}
        >
           <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <TacticalAlertRow 
                  key={idx}
                  status="ACTIVE"
                  title={`${alert.alert_level} Protocol`}
                  description={alert.action}
                  time={`T-${alert.time_window_hours}h`}
                  action={<AckButton alertId={(alert as any).alert_id || `ALT-${idx}`} deptId="NDRF" status={(alert as any).status} />}
                />
              ))}
           </div>
        </TacticalCard>

        <TacticalCard 
          title="Pre-positioning Status" 
          icon={<CheckCircle2 size={16} className="text-emerald-600" />}
        >
           <div className="space-y-3">
              {[
                { task: "H-East Ward HQ Secured", status: "READY" },
                { task: "Mithi River Inflatable Boats", status: "STAGED" },
                { task: "Air-Evac Priority 1 Zone (Sion)", status: "IN-ROUTE" },
                { task: "Matrix-Riva SATCOM Sync", status: "READY" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-black/5 hover:bg-white transition-all shadow-sm">
                   <span className="text-[11px] font-bold uppercase tracking-tight">{item.task}</span>
                   <TacticalBadge 
                     label={item.status} 
                     color={item.status === 'READY' ? 'emerald' : (item.status === 'STAGED' ? 'blue' : 'orange')} 
                     variant={item.status === 'READY' ? 'filled' : 'outline'} 
                   />
                </div>
              ))}
           </div>
        </TacticalCard>

        <TacticalCard>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                 <Navigation size={24} />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Evac Route Stability</p>
                 <div className="flex items-center gap-4">
                    <div className="text-xl font-black text-gray-950 brand-font">SECURE</div>
                    <div className="flex items-center gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Flow Rate: 4x</span>
                    </div>
                 </div>
              </div>
           </div>
        </TacticalCard>
      </div>
    </div>
  );
}
