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
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);

  const tideTrend = simulationMode === 'DEMO'
    ? [2.1, 2.4, 2.8, 3.3, 3.9, 4.4, 4.8, 5.2, 4.9, 5.4, 4.6, 5.3]
    : [1.3, 1.35, 1.4, 1.42, 1.45, 1.5, 1.48, 1.52, 1.5, 1.55, 1.53, 1.56];

  const rainfallTrend = simulationMode === 'DEMO'
    ? [6, 9, 14, 21, 33, 48, 66, 83, 57, 89, 52, 95]
    : [4, 5, 5, 6, 7, 8, 8, 9, 8, 9, 9, 10];

  useGsapAnimations(containerRef, [predictions, alerts]);

  useEffect(() => {
    if (simulationMode !== 'DEMO') {
      setZones(null);
      setInfra([]);
      setPredictions([]);
      setAlerts([
        {
          department: 'RIVA SYSTEM',
          action: 'Global synchronization heartbeat verified - all nodes online',
          alert_level: 'GREEN',
          priority: 'LOW',
          source: 'Core',
          status: 'OK',
          timestamp: new Date().toISOString()
        },
        {
          department: 'EOC CMD',
          action: 'Continuous monitoring sync active with 24 ward stations',
          alert_level: 'GREEN',
          priority: 'LOW',
          source: 'MCGM',
          status: 'SYNC',
          timestamp: new Date().toISOString()
        },
        {
          department: 'WESTERN RAILWAY',
          action: 'Automatic signalling telemetry reporting nominal on all lines',
          alert_level: 'GREEN',
          priority: 'LOW',
          source: 'Sensors',
          status: 'OK',
          timestamp: new Date().toISOString()
        },
        {
          department: 'PUMPING STN',
          action: '90 Feet Rd Sector B: Voltage stable, backup diesel full',
          alert_level: 'GREEN',
          priority: 'LOW',
          source: 'SOP',
          status: 'OK',
          timestamp: new Date().toISOString()
        },
        {
          department: 'WEATHER DEP',
          action: 'Local rain gauge 0.2mm/hr (Insignificant) - Wind 08 kts',
          alert_level: 'GREEN',
          priority: 'LOW',
          source: 'Sensors',
          status: 'OK',
          timestamp: new Date().toISOString()
        }
      ]);
      setEnvironmentalData(null);
      setLastUpdated('');
      setReasoningSteps([]);
      return;
    }

    // [DEMO MODE START]
    // 1. Pre-populate Alerts immediately
    setAlerts([
      {
        department: 'EOC CMD',
        action: 'TIDAL LOCK CONFIRMED · Outfall drainage capacity dropped to 0%',
        alert_level: 'RED',
        priority: 'CRITICAL',
        source: 'Sensors',
        status: 'DISPATCHED',
        timestamp: new Date().toISOString()
      },
      {
        department: 'NDRF',
        action: 'Battalion 4 deployment sequence initiated for Sector B',
        alert_level: 'ORANGE',
        priority: 'HIGH',
        source: 'HQ',
        status: 'SENT',
        timestamp: new Date().toISOString()
      },
      {
        department: 'BMC HUB',
        action: 'Urgent: Close Sion underpass - critical flood threshold reached',
        alert_level: 'RED',
        priority: 'CRITICAL',
        source: 'SOP',
        status: 'SENT',
        timestamp: new Date().toISOString()
      }
    ]);

    // 2. Initial Reasoning Step
    setReasoningSteps(["RIVA sequence initializing... System handshake in progress."]);

    // 3. Delayed Detailed Telemetry (5s)
    const timer = setTimeout(() => {
      setReasoningSteps([
        "Scanning 477 infrastructure nodes for baseline connectivity...",
        "Correlating IMD satellite rainfall maps with ward-level drainage capacity.",
        "Llama-3.3-70B model heartbeat verified. Latency: 2.1s.",
        "Operational parameters synced. Ready for crisis simulation."
      ]);
    }, 5000);

    const wsUrl = `ws://${window.location.hostname}:8000/ws/dashboard`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent_reasoning') {
        if (data.status === 'CLEAR') {
          // Allow cumulative logs during demo
        } else {
          setReasoningSteps(prev => [...prev, data.status]);
        }
      } else if (data.type === 'ward_status_update') {
        setEnvironmentalData((prev: any) => ({
          ...prev,
          tide_height_m: data.tide_height,
          rainfall_mm_hr: data.rainfall_rate,
          drain_capacity_pct: data.drainage_capacity_pct,
          tide_direction: "Rising"
        }));
      } else if (data.type === 'alert_dispatched') {
        setAlerts(prev => [data, ...prev]);
      } else if (data.type === 'alert_overdue') {
        setAlerts(prev => prev.map(a => (a as any).alert_id === data.alert_id ? { ...a, status: 'OVERDUE' } : a));
      }
    };

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
      // We merge fetched alerts with our initial ones if needed, or just replace
      setAlerts(prev => [...aData, ...prev.filter(p => !aData.some(a => a.action === p.action))]);
      setEnvironmentalData(eData);
      setLastUpdated(new Date().toLocaleTimeString());
    }
    init();
    const interval = setInterval(init, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      socket.close();
    };
  }, [simulationMode]);

  return (
    <div ref={containerRef} className="h-full w-full bg-transparent pt-40 sm:pt-44 lg:pt-48 px-3 sm:px-4 lg:px-6 py-10 flex flex-col lg:flex-row gap-8 overflow-y-auto custom-scrollbar overflow-visible">

      <div className="flex-[0.72] flex flex-col gap-10">
        <div className="flex-1 min-h-[600px] relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
          <MapView
            zonesGeoJson={zones}
            infrastructureNodes={infra}
            predictions={predictions}
            onZoneClick={setSelectedZone}
            selectedZoneId={selectedZone}
          />
          <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-white/80 uppercase border border-white/10 flex items-center gap-2">
            MUMBAI WARD MAP  -  {simulationMode === 'DEMO' ? 'DEMO MODE ACTIVE' : 'LIVE MODE'}
          </div>

          <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-3 glass-card px-4 py-3 rounded-full border border-white/10">
            <LegendItem color="bg-red-600" label="Critical (0%)" />
            <LegendItem color="bg-orange-500" label="Warning (20-60%)" />
            <LegendItem color="bg-emerald-500" label="Clear (>60%)" />
          </div>
        </div>

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
                <TacticalSparkline data={tideTrend} color="#ef4444" height={30} width={180} animateLoop loopStepMs={380} />
              </div>

              <div className="space-y-4">
                <TacticalMetric
                  label="Rainfall"
                  value={`${environmentalData?.rainfall_mm_hr || 0}mm/hr`}
                  sub={`IMD Threshold: 65`}
                  color={(environmentalData?.rainfall_mm_hr || 0) > 65 ? "text-red-500" : "text-orange-500"}
                />
                <TacticalSparkline data={rainfallTrend} color="#f97316" height={30} width={180} animateLoop loopStepMs={340} />
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
            <div className="space-y-6 py-4">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-4 text-emerald-500" />
                <h3 className="text-lg font-bold text-emerald-600 uppercase mb-2">Live — All Clear</h3>
                <p className="text-sm text-gray-500">No active disasters. Baseline telemetry is flowing at low levels.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40">
                  <p className="text-[10px] font-black text-emerald-700 uppercase mb-2">Tide Baseline Flow</p>
                  <TacticalSparkline data={tideTrend} color="#10b981" height={30} width={180} animateLoop loopStepMs={420} />
                </div>
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40">
                  <p className="text-[10px] font-black text-blue-700 uppercase mb-2">Rainfall Baseline Flow</p>
                  <TacticalSparkline data={rainfallTrend} color="#3b82f6" height={30} width={180} animateLoop loopStepMs={390} />
                </div>
              </div>
            </div>
          )}
        </div>

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

      <div className="flex-[0.28] flex flex-col gap-6">
        <TacticalCard
          title="Riva Agent - Reasoning"
          subtitle="Active"
          icon={<BrainCircuit size={18} className="text-blue-600" />}
          className="flex-[0.55]"
          dark={false}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex flex-wrap gap-2 mb-8 relative z-10">
            <TacticalBadge label="Critical" color="red" variant="filled" />
            <TacticalBadge label="Tide ↑ Rising" color="orange" variant="outline" />
            <TacticalBadge label="09:07 · Peak Hour" color="gray" variant="outline" />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-dark mb-8 relative z-10 max-h-[350px]">
            {reasoningSteps.length > 0 ? (
              reasoningSteps.map((text, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 group-hover:scale-150 transition-all shadow-glow-blue" />
                  <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">"{text}"</p>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 italic">
                {simulationMode === 'DEMO'
                  ? "RIVA sequence initializing... Start demo to see reasoning telemetry."
                  : "Live mode — system is peaceful. Continuous background monitoring active."}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-black/5 flex flex-col gap-5 relative z-10">
            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">
              <span>5 DISPATCHED · 1.8S · LLAMA-3.3-70B</span>
              <span className="text-blue-600">DISPATCHED</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <LabelButton label="Ack All" tone="neutral" className="text-[12px]" />
              <LabelButton label="Escalate" tone="danger-soft" className="text-[12px]" />
            </div>
          </div>
        </TacticalCard>

        <TacticalCard
          title="Alert Feed - Live Log"
          icon={<History size={18} className="text-slate-700" />}
          className="flex-[0.45]"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {alerts.length > 0 ? (
              alerts.map((alert: any, idx) => (
                <TacticalAlertRow
                  key={idx}
                  status={alert.status || 'SENT'}
                  title={`${alert.dept || alert.department || 'OFFICER'}`}
                  description={alert.action}
                  time={alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:07'}
                />
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 font-bold uppercase text-[10px]">No active alerts</div>
            )}
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
