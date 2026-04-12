import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts, fetchInfrastructure } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, InfrastructureNode } from '@schema';
import {
    AlertTriangle, Clock, Droplets, Activity, BrainCircuit, Navigation,
    MapPin, Power, Shield, CheckCircle2, X
} from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { TacticalCard, TacticalBadge, Label, LabelButton } from '../components/tactical/TacticalLibrary';
import { useAuth } from '../AuthContext';

export function BmcWardDashboard() {
    const { simulationMode } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
    const [infra, setInfra] = useState<InfrastructureNode[]>([]);
    const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
    const [reasoningSteps, setReasoningSteps] = useState<string[]>([
        "Sion underpass is the only NDRF route - close before Bn4 deploys",
        "Pumps 3+7 at 90 Feet Rd - highest capacity in H-East",
        "Sector B: 1,200 residents, elevation lowest, evac window 40 min"
    ]);

    useGsapAnimations(containerRef, [alerts, predictions, reasoningSteps]);

    useEffect(() => {
        const wsUrl = `ws://${window.location.hostname}:8000/ws/dashboard`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'alert_dispatched') {
                const matchesRole = data.department?.toLowerCase() === 'bmc_ward_officer' || data.dept?.toLowerCase() === 'bmc_ward_officer';
                if (matchesRole) {
                    setAlerts(prev => [data, ...prev]);
                }
            }
        };

        async function init() {
            const [aData, iData, pData] = await Promise.all([
                fetchActiveAlerts('BMC_WARD_OFFICER'),
                fetchInfrastructure(),
                fetchPredictions()
            ]);
            setAlerts(aData);
            setInfra(iData.nodes);
            setPredictions(pData);
        }
        init();

        return () => socket.close();
    }, []);

    return (
        <div ref={containerRef} className="pt-35 sm:pt-46 px-12 pb-12 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
            <div className="w-full space-y-8">

                {/* CRISIS HEADER (Show only in DEMO mode or if active threats exist) */}
                {simulationMode === 'DEMO' && (
                    <div className="glass-card p-6 rounded-[2.5rem] border border-red-200 bg-red-50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertTriangle size={80} className="text-red-500" />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[13px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Alert dispatched 09:07
                            </p>
                            <h2 className="text-[18px] font-black text-gray-900 uppercase leading-snug">
                                Close Sion underpass + activate pump stations 3 and 7 · Deadline: 09:22
                            </h2>
                            <p className="text-[12px] font-bold text-gray-500 uppercase">Response logged — action required now</p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <LabelButton label="ACK + acting" tone="primary" className="px-8 py-4 !rounded-2xl shadow-xl shadow-blue-500/20" />
                            <LabelButton label="Cannot comply" tone="neutral" className="px-8 py-4 !rounded-2xl border-black/5 bg-white/60" />
                        </div>
                    </div>
                )}

                {simulationMode === 'LIVE' && (
                    <div className="glass-card p-8 rounded-[2.5rem] border-emerald-100 bg-emerald-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">System Normal</h3>
                                <p className="text-xs font-bold text-emerald-600 uppercase">No active drainage threats in Ward H-East</p>
                            </div>
                        </div>
                        <TacticalBadge label="Continuous Watch" color="emerald" variant="outline" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Alerts & Tasks */}
                    <div className="lg:col-span-6 flex flex-col gap-8">

                        {/* WARD ALERT BOX (Only in DEMO) */}
                        {simulationMode === 'DEMO' ? (
                            <div className="glass-card p-10 rounded-[3rem] border-red-100 bg-red-50/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] rounded-full" />
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">WARD ALERT — H-EAST DHARAVI</h3>
                                <div className="space-y-6">
                                    <p className="text-[20px] font-black text-red-600 uppercase leading-tight">
                                        Tidal lock confirmed.<br />
                                        <span className="text-gray-900 italic">Drainage capacity 0%. Rainfall 87mm/hr.</span>
                                    </p>
                                    <p className="text-[15px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                                        Close Sion underpass immediately — NDRF vehicle route depends on this. Pumps 3 and 7 at 90 Feet Rd must activate within 15 min window.
                                        <br /><br />
                                        <span className="text-gray-500 italic">Evacuation notice for Sector B — 1,200 at risk near 90 Feet Rd.</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-10 rounded-[3rem] border-blue-50 bg-white/40">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">WARD STATUS — NOMINAL</h3>
                                <div className="space-y-4">
                                    <p className="text-[18px] font-bold text-gray-900 uppercase">Monitoring high-tide window</p>
                                    <p className="text-[13px] font-medium text-gray-500 uppercase leading-relaxed">
                                        All drainage valves operational. Pump stations reporting nominal voltage. Standby teams verified at 90 Feet Rd.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ROAD CLOSURE STATUS */}
                        <div className="glass-card p-10 rounded-[3rem] border-white/40 flex flex-col gap-6">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">OPERATIONAL LOG</h3>
                            <div className="space-y-2">
                                <TaskRow time="09:09" label={simulationMode === 'DEMO' ? "Sion underpass closed — barriers deployed" : "Morning equipment calibration"} status="DONE" color="emerald" />
                                <TaskRow time="09:11" label={simulationMode === 'DEMO' ? "Pumps 3+7 activated — 87% capacity" : "Grid synchronization check"} status="DONE" color="emerald" />
                                <TaskRow time="09:22" label={simulationMode === 'DEMO' ? "Dharavi Sector B evacuation notice" : "Personnel shift handover"} status={simulationMode === 'DEMO' ? "PENDING" : "DONE"} color={simulationMode === 'DEMO' ? "orange" : "emerald"} />
                            </div>
                        </div>

                        {/* ESCALATION WINDOW (Only in DEMO) */}
                        {simulationMode === 'DEMO' && (
                            <div className="flex items-center justify-between glass-card p-10 rounded-[3rem] border-red-100 bg-red-50/20">
                                <div>
                                    <p className="text-[42px] font-black text-red-600 leading-none mb-2">06:12</p>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">remaining before OVERDUE flag</p>
                                </div>
                                <div className="max-w-[200px] text-right space-y-2">
                                    <p className="text-[12px] font-bold text-gray-500 leading-relaxed uppercase">
                                        All actions are timestamped. Silence = OVERDUE in log.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Map & Reasoning */}
                    <div className="lg:col-span-6 flex flex-col gap-8">

                        {/* TACTICAL MAP PINS */}
                        <div className="glass-card p-10 rounded-[3rem] border-white/40 flex flex-col h-[450px]">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">WARD MAP — TACTICAL VIEW</h3>
                            <div className="flex-1 relative bg-gray-50 rounded-3xl border border-black/5 overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-full h-full p-20">
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/5" />
                                        <div className="absolute top-0 left-1/3 w-0.5 h-full bg-blue-500/5" />

                                        <MapPinLabel x="10%" y="40%" label="PUMP 7" color={simulationMode === 'DEMO' ? "emerald" : "gray"} />
                                        <MapPinLabel x="70%" y="35%" label="PUMP 3" color={simulationMode === 'DEMO' ? "emerald" : "gray"} />
                                        <MapPinLabel x="55%" y="65%" label="SION UNDERPASS" color={simulationMode === 'DEMO' ? "red" : "gray"} pulse={simulationMode === 'DEMO'} />
                                        <MapPinLabel x="80%" y="15%" label="SECTOR B" color={simulationMode === 'DEMO' ? "orange" : "gray"} />

                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-full flex items-center justify-center">
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">WARD H-EAST</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PUMP STATION STATUS GRID */}
                        <div className="glass-card p-10 rounded-[3rem] border-white/40 space-y-6">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">HYDRAULIC STATUS</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <PumpStatus name="Pump 3 — 90 Feet Rd" status={simulationMode === 'DEMO' ? "ON" : "STANDBY"} color={simulationMode === 'DEMO' ? "emerald" : "orange"} />
                                <PumpStatus name="Pump 7 — 90 Feet Rd" status={simulationMode === 'DEMO' ? "ON" : "STANDBY"} color={simulationMode === 'DEMO' ? "emerald" : "orange"} />
                                <PumpStatus name="Pump 1 — Mahim" status="STANDBY" color="orange" />
                                <PumpStatus name="Pump 5 — Sion" status="OFFLINE" color="gray" />
                            </div>
                        </div>

                        {/* AGENT REASONING BOX */}
                        <div className="glass-card p-10 rounded-[3rem] border-white/40 space-y-6">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">RIVA REASONING</h3>
                            <div className="space-y-4">
                                {(simulationMode === 'DEMO' ? reasoningSteps : [
                                    "Monitoring high tide at 4.6m (Scheduled 09:47)",
                                    "Drainage network health factor at 0.98",
                                    "No immediate intervention required"
                                ]).map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <span className="text-blue-500 font-bold mt-1 group-hover:scale-125 transition-transform">→</span>
                                        <p className="text-[14px] font-bold text-gray-600 leading-snug uppercase tracking-tight italic">"{step}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function TaskRow({ time, label, status, color }: { time: string; label: string; status: string; color: any }) {
    const colors = {
        emerald: 'text-emerald-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        gray: 'text-gray-400'
    };
    return (
        <div className="flex items-center gap-6 py-4 border-b border-white/5 last:border-0 hover:bg-black/5 px-2 transition-all">
            <span className="text-[13px] font-black text-gray-400 font-mono tracking-tighter">{time}</span>
            <p className="flex-1 text-[13px] font-bold text-gray-700 uppercase leading-none">{label}</p>
            <span className={`text-[12px] font-black uppercase tracking-widest ${colors[color] || 'text-gray-500'}`}>{status}</span>
        </div>
    );
}

function PumpStatus({ name, status, color }: { name: string; status: string; color: any }) {
    const colors = {
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100',
        red: 'text-red-600 bg-red-50 border-red-100',
        gray: 'text-gray-400 bg-gray-50 border-gray-100'
    };
    return (
        <div className={`p-5 rounded-2xl border flex flex-col gap-2 hover:brightness-95 transition-all ${colors[color] || colors.gray}`}>
            <p className="text-[10px] font-black uppercase opacity-60">{name}</p>
            <span className={`text-[13px] font-black uppercase tracking-widest`}>{status}</span>
        </div>
    );
}

function MapPinLabel({ x, y, label, color, pulse = false }: { x: string; y: string; label: string; color: any; pulse?: boolean }) {
    const colors = {
        emerald: 'border-emerald-500 text-emerald-600 bg-emerald-50',
        red: 'border-red-500 text-red-600 bg-red-50',
        orange: 'border-orange-500 text-orange-600 bg-orange-50',
        blue: 'border-blue-500 text-blue-600 bg-blue-50',
        gray: 'border-gray-200 text-gray-400 bg-white'
    };
    const glowClass = color === 'red' ? 'bg-red-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'orange' ? 'bg-orange-500' : 'bg-gray-300';

    return (
        <div className="absolute" style={{ top: y, left: x }}>
            <div className="flex flex-col items-center group cursor-pointer">
                <div className={`p-1.5 rounded-lg border-2 font-black text-[9px] uppercase tracking-tighter whitespace-nowrap shadow-md transition-transform group-hover:scale-110 ${colors[color] || colors.gray}`}>
                    {label}
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 shadow-2xl ${glowClass} ${pulse ? 'animate-pulse' : ''}`} />
            </div>
        </div>
    );
}
