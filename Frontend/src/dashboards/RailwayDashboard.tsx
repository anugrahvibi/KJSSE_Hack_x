import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts, fetchInfrastructure, fetchSensorReadings } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import {
    Train, AlertTriangle, Activity, Clock, Navigation,
    Droplets, Shield, ShieldAlert, Radio, ArrowRight, BrainCircuit, HardHat, Info, CheckCircle2
} from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { TacticalCard, TacticalBadge, TacticalMetric, TacticalSparkline } from '../components/tactical/TacticalLibrary';
import { MapView } from '../components/MapView';
import { TACTICAL_THEME } from '../theme';
import { useAuth } from '../AuthContext';

export function RailwayDashboard() {
    const { simulationMode } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
    const [infra, setInfra] = useState<InfrastructureNode[]>([]);
    const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
    const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);

    useGsapAnimations(containerRef, [alerts, predictions, reasoningSteps]);

    useEffect(() => {
        if (simulationMode !== 'DEMO') {
            setReasoningSteps([]);
        }

        const wsUrl = `ws://${window.location.hostname}:8000/ws/dashboard`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'agent_reasoning') {
                if (data.status === 'CLEAR') {
                    setReasoningSteps([]);
                } else {
                    setReasoningSteps(prev => [...prev, data.status]);
                }
            } else if (data.type === 'alert_dispatched') {
                const matchesRole = data.department?.toLowerCase() === 'western_railway' || data.dept?.toLowerCase() === 'western_railway';
                if (matchesRole) {
                    setAlerts(prev => [data, ...prev]);
                }
            } else if (data.type === 'alert_overdue') {
                setAlerts(prev => prev.map(a => (a as any).alert_id === data.alert_id ? { ...a, status: 'OVERDUE' } : a));
            }
        };

        async function init() {
            const [aData, iData, pData] = await Promise.all([
                fetchActiveAlerts('WESTERN_RAILWAY'),
                fetchInfrastructure(),
                fetchPredictions()
            ]);
            setAlerts(aData);
            setInfra(iData.nodes);
            setPredictions(pData);
        }
        init();

        return () => socket.close();
    }, [simulationMode]);

    return (
        <div ref={containerRef} className={`pt-34 sm:pt-43 ${TACTICAL_THEME.paddingX} ${TACTICAL_THEME.paddingB} h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible`}>
            <div className={`w-full ${TACTICAL_THEME.spaceY}`}>
                {/* SYSTEM NORMAL STATUS (Live Mode) */}
                {simulationMode === 'LIVE' && (
                    <div className="glass-card p-6 rounded-[2.5rem] border border-emerald-200 bg-emerald-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Activity className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Corridor Watch: Nominal</h3>
                                <p className="text-[15px] font-bold text-gray-700 leading-relaxed uppercase">Battalion 4 reporting 100% mission readiness. All tactical equipment verified. Sync with Central Command active.</p>
                            </div>
                        </div>
                        <TacticalBadge label="Live Telemetry" color="emerald" variant="outline" />
                    </div>
                )}

                {/* CLIMAX ALERT HEADER (DEMO ONLY) */}
                {simulationMode === 'DEMO' && (
                    <div className="glass-card p-6 rounded-[2.5rem] border-2 border-red-500 bg-red-600/10 shadow-2xl animate-pulse overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <AlertTriangle size={80} className="text-red-600" />
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <TacticalBadge label="OVERDUE - 09:27" color="red" variant="filled" className="animate-bounce" />
                                    <span className="text-[14px] font-black text-red-600 uppercase tracking-widest">Immediate Escalation Triggered</span>
                                </div>
                                <p className="text-[18px] font-black text-gray-950 uppercase leading-tight mt-2">
                                    STATION PREP AT KURLA + SION NOT ACKNOWLEDGED · THIS SILENCE IS LOGGED · DEADLINE PASSED
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-[14px] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/30">ACK NOW</button>
                                <button className="px-8 py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-black text-[14px] uppercase hover:scale-105 active:scale-95 transition-all">ESCALATE</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-1 lg:grid-cols-12 ${TACTICAL_THEME.gap} h-[calc(100vh-550px)] min-h-[400px]`}>
                    {/* MAP PANEL */}
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        <div className="flex-1 relative glass-card p-0 rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden bg-white/20 backdrop-blur-xl">
                            <MapView
                                variant="railway"
                                infrastructureNodes={infra}
                                predictions={predictions}
                                onZoneClick={() => { }}
                            />
                            <div className="absolute top-8 left-8 z-[1000] glass-card px-6 py-3 rounded-2xl border-white/40 shadow-xl bg-white/80">
                                <div className="flex items-center gap-3">
                                    <Train size={20} className="text-blue-600" />
                                    <div>
                                        <div className="text-[12px] font-black text-gray-950 uppercase leading-none">LIVE RAILWAY COMMAND</div>
                                        <div className="text-[9px] font-bold text-blue-600/60 uppercase tracking-tighter">CORRIDOR OVERSIGHT</div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 right-8 z-[1000]">
                                <TacticalBadge label="TRANSIT-OPTIMIZED RELAY · FOCUSING ON TRACK-LEVEL TELEMETRY" color="blue" variant="outline" className="px-4 py-2 bg-white/60 backdrop-blur-md border-white/60" />
                            </div>
                        </div>

                        {/* STATION RISK MATRIX */}
                        <div className="glass-card p-8 rounded-[2.5rem] bg-white/40 border-white/60 shadow-xl">
                            <header className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                    <Activity size={18} /> STATION RISK - AT-RISK STATIONS
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400 uppercase italic underline underline-offset-4 decoration-blue-500/30">RIVA Projected Impacts</span>
                            </header>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StationRiskCard name="KURLA (WR MAIN LINE)" risk={simulationMode === 'DEMO' ? "HIGH RISK" : "NOMINAL"} sub={simulationMode === 'DEMO' ? "SUBMERGE T+60" : "READY"} color={simulationMode === 'DEMO' ? "red" : "emerald"} />
                                <StationRiskCard name="SION STATION" risk={simulationMode === 'DEMO' ? "MEDIUM" : "NOMINAL"} sub={simulationMode === 'DEMO' ? "WATCH T+90" : "READY"} color={simulationMode === 'DEMO' ? "orange" : "emerald"} />
                                <StationRiskCard name="MATUNGA ROAD" risk="NOMINAL" sub="READY" color="emerald" />
                                <StationRiskCard name="DADAR (WR)" risk="NOMINAL" sub="READY" color="emerald" />
                            </div>
                        </div>
                    </div>

                    {/* TELEMETRY & TASKS COLUMN */}
                    <div className="lg:col-span-4 flex flex-col gap-10">

                        {/* AI REASONING PANEL */}
                        <TacticalCard title="Agent Reasoning" icon={<BrainCircuit size={18} className="text-blue-600" />}>
                            <div className="space-y-4 py-2">
                                {(simulationMode === 'DEMO' ? reasoningSteps : [
                                    "Central & Western main lines verified 100% operational",
                                    "No flooding probability detected on harbor line",
                                    "Tidal gates reporting normal hydraulic pressure"
                                ]).length > 0 ? (
                                    (simulationMode === 'DEMO' ? reasoningSteps : [
                                        "Corridors reporting nominal status",
                                        "Track-level telemetry stable",
                                        "Next high tide: T+140 min"
                                    ]).map((step, i) => (
                                        <div key={i} className="flex gap-4 group animate-in slide-in-from-left duration-500">
                                            <div className="w-1 bg-blue-600 rounded-full group-hover:h-full transition-all" />
                                            <p className="text-[13px] font-bold text-gray-700 uppercase leading-snug tracking-tight">
                                                {step}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] font-black text-gray-400 uppercase italic animate-pulse">
                                        Awaiting real-time system strategy sequence...
                                    </div>
                                )}
                            </div>
                        </TacticalCard>

                        {/* SERVICE HALT TIMELINE */}
                        <TacticalCard title="SERVICE HALT TIMELINE" icon={<Clock size={18} className="text-blue-600" />}>
                            <div className="space-y-6 py-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase">Track Level (Kurla)</p>
                                        <p className="text-[20px] font-black text-gray-950">{simulationMode === 'DEMO' ? '3.8M' : '0.1M'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase">Current Rise</p>
                                        <p className={`text-[20px] font-black ${simulationMode === 'DEMO' ? 'text-blue-600' : 'text-emerald-600'}`}>{simulationMode === 'DEMO' ? '+0.3M/HR' : 'STABLE'}</p>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl ${simulationMode === 'DEMO' ? 'bg-orange-500/10 border border-orange-200' : 'bg-emerald-500/10 border border-emerald-200'}`}>
                                    <p className={`text-[12px] font-black uppercase mb-1 ${simulationMode === 'DEMO' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {simulationMode === 'DEMO' ? 'Estimated Submersion' : 'Network Clearance'}
                                    </p>
                                    <p className="text-[16px] font-bold text-gray-950 uppercase">
                                        {simulationMode === 'DEMO' ? 'T+60 MIN (10:07)' : 'ALL TRACKS CLEAR'}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-4 p-4 rounded-2xl shadow-xl ${simulationMode === 'DEMO' ? 'bg-blue-600 text-white' : 'bg-white border border-black/5'}`}>
                                    <Shield size={24} className={simulationMode === 'DEMO' ? 'opacity-80' : 'text-emerald-600'} />
                                    <div>
                                        <p className={`text-[10px] font-black uppercase ${simulationMode === 'DEMO' ? 'opacity-80' : 'text-gray-400'}`}>
                                            {simulationMode === 'DEMO' ? 'Recommended Halt' : 'Schedule Status'}
                                        </p>
                                        <p className={`text-[14px] font-bold uppercase ${simulationMode === 'DEMO' ? 'text-white' : 'text-gray-950'}`}>
                                            {simulationMode === 'DEMO' ? 'ALL SLOW TRAINS BY 09:45' : 'ON-TIME (100% CORRIDOR)'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* CROWD MANAGEMENT CHECKLIST */}
                        <TacticalCard title="CROWD MANAGEMENT - KURLA" icon={<Radio size={18} className={simulationMode === 'DEMO' ? 'text-orange-500' : 'text-emerald-500'} />}>
                            <div className="space-y-1">
                                {simulationMode === 'DEMO' ? (
                                    <>
                                        <ChecklistRow time="09:07" label="ALERT RECEIVED - STATION PREP REQUIRED" status="IGNORED" color="red" />
                                        <ChecklistRow time="09:22" label="DEADLINE PASSED - NO RESPONSE LOGGED" status="OVERDUE" color="red" />
                                        <ChecklistRow time="09:37" label="HALT SLOW TRAINS KURLA CORRIDOR" status="PENDING" color="orange" variant="outline" />
                                        <ChecklistRow time="09:45" label="ANNOUNCE ALTERNATE BUS ROUTES VIA PA" status="PENDING" color="orange" variant="outline" />
                                    </>
                                ) : (
                                    <>
                                        <ChecklistRow time="07:00" label="STATION READINESS CHECK" status="VERIFIED" color="emerald" />
                                        <ChecklistRow time="07:15" label="PLATFORM MARSHALS DEPLOYED" status="COMPLETE" color="emerald" />
                                        <ChecklistRow time="07:45" label="PA SYSTEM CALIBRATION" status="COMPLETE" color="emerald" />
                                        <ChecklistRow time="08:00" label="CONTINUOUS MONITORING ACTIVE" status="LIVE" color="emerald" variant="outline" />
                                    </>
                                )}
                            </div>
                        </TacticalCard>

                        {/* ACCOUNTABILITY NOTE */}
                        <div className={`glass-card p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden ${simulationMode === 'DEMO' ? 'border-red-100 bg-red-50/50' : 'border-emerald-100 bg-emerald-50/50'}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                {simulationMode === 'DEMO' ? <ShieldAlert size={80} className="text-red-600" /> : <CheckCircle2 size={80} className="text-emerald-600" />}
                            </div>
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                                <Info size={14} className={simulationMode === 'DEMO' ? 'text-red-500' : 'text-emerald-500'} /> {simulationMode === 'DEMO' ? 'ACCOUNTABILITY NOTE' : 'SYSTEM HEALTH RECORD'}
                            </h4>
                            <p className={`text-[14px] font-black uppercase leading-relaxed tracking-tight relative z-10 ${simulationMode === 'DEMO' ? 'text-red-600' : 'text-emerald-700'}`}>
                                {simulationMode === 'DEMO'
                                    ? 'ALERT SENT 09:07. NO ACKNOWLEDGMENT BY 09:27. THIS NON-RESPONSE IS LOGGED WITH TIMESTAMP.'
                                    : 'ALL STATIONS ACKNOWLEDGED AND REPORTING NOMINAL. CONTINUOUS SYNC ACTIVE.'
                                }
                            </p>
                            <p className="text-[12px] font-bold text-gray-600 uppercase leading-relaxed tracking-tight mt-4 relative z-10">
                                {simulationMode === 'DEMO'
                                    ? 'POST-EVENT REPORT WILL REFERENCE THIS GAP. SILENCE IS A DECISION AND IT IS ON THE RECORD.'
                                    : 'DAILY LOGS ARE ARCHIVED FOR REGULATORY REVIEW. NO PERFORMANCE DISCREPANCIES DETECTED.'
                                }
                            </p>
                            <div className={`mt-8 pt-6 border-t flex items-center justify-between relative z-10 ${simulationMode === 'DEMO' ? 'border-red-100' : 'border-emerald-100'}`}>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Audit ID: {simulationMode === 'DEMO' ? 'AC-88229' : 'OK-2024-X4'}</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${simulationMode === 'DEMO' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    <span className={`text-[11px] font-black uppercase ${simulationMode === 'DEMO' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {simulationMode === 'DEMO' ? 'OFFICIAL RECORD' : 'VERIFIED SYNC'}
                                    </span>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </div>

    </div>
  );
}

function StationRiskCard({ name, risk, sub, color }: { name: string; risk: string; sub: string, color: any }) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-lg hover:border-gray-300 transition-all flex flex-col justify-between gap-3 h-32">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-tight truncate">{name}</p>
            <div className="space-y-1">
                <TacticalBadge label={risk} color={color} className="w-full text-center py-1" />
                <p className="text-[11px] font-bold text-gray-950 uppercase text-center mt-1">{sub}</p>
            </div>
        </div>
    );
}

function ChecklistRow({ time, label, status, color, variant = 'filled' }: { time: string; label: string; status: string; color: any; variant?: any }) {
    return (
        <div className="flex items-center gap-4 py-3 border-b border-black/5 last:border-0 h-16 px-1">
            <span className="text-[11px] font-black text-gray-400">{time}</span>
            <p className="flex-1 text-[12px] font-bold text-gray-800 leading-tight uppercase tracking-tighter truncate">{label}</p>
            <TacticalBadge label={status} color={color} variant={variant} className="shrink-0 w-20 text-center" />
        </div>
    );
}
