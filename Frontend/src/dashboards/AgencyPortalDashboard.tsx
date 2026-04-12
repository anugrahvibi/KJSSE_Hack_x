import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts, fetchInfrastructure } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import {
  PlusCircle, Bed, Ambulance, AlertTriangle, Activity, Navigation,
  Clock, Droplets, Zap, Train, HardHat, Info, Power, Radio
} from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { TacticalCard, TacticalBadge, TacticalMetric, Label, TacticalSparkline, TacticalBarChart } from '../components/tactical/TacticalLibrary';
import { MapView } from '../components/MapView';
import { TACTICAL_THEME } from '../theme';
import { useAuth } from '../AuthContext';

export function AgencyPortalDashboard() {
  const { role, simulationMode } = useAuth();
  const currentRole = role || 'BMC Ward Officer';
  const containerRef = useRef<HTMLDivElement>(null);

  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);

  useGsapAnimations(containerRef, [alerts, predictions]);

  const config = {
    'KEM Hospital': {
      dept: 'KEM_HOSPITAL',
      variant: 'emergency' as const,
      title: 'Medical Command Center',
      metrics: [
        { label: 'Surge Capacity', value: '35%', sub: '140 beds available', color: 'text-emerald-500', icon: <Bed size={24} />, trend: [20, 25, 30, 35, 32, 35] },
        { label: 'Ambulances', value: '12', sub: '4 pre-positioned', color: 'text-blue-500', icon: <Ambulance size={24} />, trend: [8, 10, 12, 12, 11, 12] }
      ]
    },
    'BMC Ward Officer': {
      dept: 'BMC_WARD_OFFICER',
      variant: 'hydro' as const,
      title: 'Municipal Drainage Command',
      metrics: [
        { label: 'Pump Load', value: '82%', sub: 'H-East Dharavi Sector', color: 'text-orange-500', icon: <Droplets size={24} />, trend: [40, 55, 70, 80, 82, 81] },
        { label: 'Grid Status', value: 'Nominal', sub: 'Substation feedback OK', color: 'text-emerald-500', icon: <Zap size={24} />, trend: [100, 100, 95, 100, 100, 100] }
      ]
    },
    'Western Railway': {
      dept: 'WESTERN_RAILWAY',
      variant: 'railway' as const,
      title: 'Rail & Transit Hub',
      metrics: [
        { label: 'Track Height', value: '42mm', sub: 'Below flood threshold', color: 'text-emerald-500', icon: <Train size={24} />, trend: [10, 15, 25, 38, 42, 40] },
        { label: 'Signal Integrity', value: '100%', sub: 'Sector 4 Clear', color: 'text-blue-500', icon: <Radio size={24} />, trend: [100, 100, 100, 100, 100, 100] }
      ]
    }
  }[currentRole === 'Central Railway' ? 'Western Railway' : currentRole] || {
    dept: 'GENERAL',
    variant: 'tactical' as const,
    title: 'Agency Hub',
    metrics: []
  };

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8000/ws/dashboard`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'alert_dispatched') {
        const matchesRole = !config.dept || data.department?.toLowerCase() === config.dept.toLowerCase() || data.dept?.toLowerCase() === config.dept.toLowerCase();
        if (matchesRole) {
          setAlerts(prev => [data, ...prev]);
        }
      } else if (data.type === 'alert_overdue') {
        setAlerts(prev => prev.map(a => (a as any).alert_id === data.alert_id ? { ...a, status: 'OVERDUE' } : a));
      }
    };

    async function init() {
      const [aData, iData, pData] = await Promise.all([
        fetchActiveAlerts(config.dept),
        fetchInfrastructure(),
        fetchPredictions()
      ]);
      setAlerts(aData);
      setInfra(iData.nodes);
      setPredictions(pData);
    }
    init();

    return () => socket.close();
  }, [config.dept]);

  return (
    <div ref={containerRef} className={`pt-34 sm:pt-43 ${TACTICAL_THEME.paddingX} ${TACTICAL_THEME.paddingB} h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible`}>
      <div className={`w-full ${TACTICAL_THEME.spaceY}`}>
        <div className={`grid grid-cols-1 lg:grid-cols-12 ${TACTICAL_THEME.gap} h-[calc(100vh-320px)] min-h-[500px]`}>
          {/* MAP PANEL */}
          <div className="lg:col-span-8 relative glass-card p-0 rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden bg-white/30">
            <MapView
              variant={config.variant}
              infrastructureNodes={infra}
              predictions={predictions}
              onZoneClick={() => { }}
            />
            <div className="absolute top-8 left-8 z-[1000] glass-card px-5 py-2.5 rounded-2xl border-white/40 shadow-xl">
              <span className="metadata-label !text-gray-900">{config.title} — Sector View</span>
            </div>
          </div>

          {/* TELEMETRY PANEL */}
          <div className={`lg:col-span-4 flex flex-col ${TACTICAL_THEME.gap}`}>
            <TacticalCard title="Mission Telemetry" subtitle="Trend Analysis Hub" icon={<Activity size={18} className="text-blue-600" />}>
              <div className="space-y-12">
                {config.metrics.map((m, i) => (
                  <div key={i} className="space-y-4">
                    <TacticalMetric
                      label={m.label}
                      value={m.value}
                      sub={m.sub}
                      color={m.color}
                      icon={m.icon}
                    />
                    <div className="px-2">
                      <TacticalSparkline data={m.trend} color={m.color.includes('emerald') ? '#10b981' : m.color.includes('orange') ? '#f59e0b' : '#3b82f6'} />
                    </div>
                  </div>
                ))}

                {/* Distribution Visualization */}
                <div className="pt-6 border-t border-black/5">
                  <p className="metadata-label mb-6">Resource Distribution — Sector H</p>
                  <TacticalBarChart items={[
                    { label: 'STAFF', value: 85, color: 'bg-blue-500' },
                    { label: 'EQUIP', value: 62, color: 'bg-emerald-500' },
                    { label: 'FUEL', value: 92, color: 'bg-orange-500' },
                    { label: 'COMM', value: 100, color: 'bg-blue-600' }
                  ]} />
                </div>
              </div>
            </TacticalCard>

            <TacticalCard title="Tactical Tasks" icon={<HardHat size={18} className="text-orange-500" />}>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border-b border-black/5 last:border-0 hover:bg-black/5 rounded-xl transition-all h-16">
                    <p className="flex-1 text-[13px] font-bold text-gray-800 uppercase truncate">
                      {a.action}
                    </p>
                    <TacticalBadge label="ACTIVE" color="orange" variant="outline" />
                  </div>
                ))}
              </div>
            </TacticalCard>
          </div>
        </div>
      </div>

      {/* FINAL MISSION BUFFER */}
      <div className="h-32 w-full shrink-0" />
    </div>
  );
}
