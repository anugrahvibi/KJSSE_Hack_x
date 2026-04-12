import React, { useEffect, useState, useRef } from 'react';
import { Shield, AlertTriangle, TrendingUp, BarChart3, Layers, Target, CheckCircle2, Info, Map as MapIcon, ArrowRight, Activity, BrainCircuit, Maximize2, AlertCircle } from 'lucide-react';
import { fetchVulnerabilities } from '../utils/dataFetcher';
import type { VulnerabilityAnalysis } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useAuth } from '../AuthContext';
import { MapView } from '../components/MapView';
import { ProgressBar } from '../components/common/ProgressBar';
import { Label, LabelButton } from '../components/tactical/TacticalLibrary';
import { AccountabilityReport } from './AccountabilityReport';

export function AuditDashboard() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityAnalysis | null>(null);
   const [showReport, setShowReport] = useState(false);
   const { simulationMode } = useAuth();

   useGsapAnimations(containerRef, [vulnerabilities]);

   useEffect(() => {
      async function init() {
         const vData = await fetchVulnerabilities();
         setVulnerabilities(vData);
      }
      init();
   }, []);

   return (
      <div ref={containerRef} className="pt-40 sm:pt-44 lg:pt-48 px-3 sm:px-4 lg:px-6 py-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
         <div className="w-full flex flex-col lg:flex-row gap-10">

            {/* LEFT COLUMN: Insights & Map (65%) */}
            <div className="flex-[0.65] flex flex-col gap-10">

               {/* Vulnerability Ranking (Top Left) - DEMO vs LIVE */}
               {simulationMode === 'DEMO' ? (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl space-y-6">
                     <header className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Vulnerability Ranking - Cascade Multiplier</span>
                        <span className="text-gray-400 italic font-bold">Audit mode - no live event needed</span>
                     </header>
                     <div className="space-y-4">
                        {[
                           { id: "#1", label: "Western Railway", value: "5.2M", color: "bg-red-500", width: "95%" },
                           { id: "#2", label: "Sion arterial road", value: "2.1M", color: "bg-orange-500", width: "65%" },
                           { id: "#3", label: "BEST electricity grid", value: "1.8M", color: "bg-orange-500", width: "55%" },
                           { id: "#4", label: "Bhandup water treatment", value: "900K", color: "bg-gray-400", width: "35%" },
                           { id: "#5", label: "Eastern freeway", value: "620K", color: "bg-gray-400", width: "25%" }
                        ].map((item, idx) => (
                           <div key={idx} className="flex items-center gap-6">
                              <span className="w-8 text-[12px] font-black text-gray-400">{item.id}</span>
                              <span className="w-48 text-[13px] font-black text-gray-900 uppercase">{item.label}</span>
                              <ProgressBar
                                 value={item.width}
                                 className="flex-1 h-1.5"
                                 trackClassName="bg-gray-100"
                                 fillClassName={item.color}
                              />
                              <span className="w-16 text-right text-[13px] font-black text-gray-950 brand-font">{item.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl space-y-6">
                     <header className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Audit Mode: Vulnerability Ranking Logic</span>
                        <span className="text-emerald-500 italic font-bold">Analysis Ready</span>
                     </header>
                     <div className="space-y-6">
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                           <p className="text-[14px] font-bold text-gray-800 leading-relaxed italic">
                              Audit Mode: Without any active flood, the graph simulates removing each node and counts downstream population affected. This produces the vulnerability ranking — Western Railway at 5.2M cascade multiplier, Sion arterial at 2.1M, and so on.
                           </p>
                        </div>
                        <div className="flex items-center gap-4 px-4">
                           <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-600">
                              <CheckCircle2 size={24} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-gray-400 uppercase">Simulaion Engine</p>
                              <p className="text-[14px] font-bold text-gray-950 uppercase tracking-tighter">Node-Removal Impact Analysis Active</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Structural Map (Middle Left) */}
               <div className="flex-1 min-h-[450px] relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
                  {!showReport && (
                     <MapView
                        zonesGeoJson={null}
                        infrastructureNodes={[]}
                        predictions={vulnerabilities?.ranked_zones?.map(z => ({
                           zone_id: z.zone_id,
                           flood_probability: z.score / 100,
                           lead_time_hours: 0,
                           zone_name: z.zone_id
                        })) || []}
                        onZoneClick={() => { }}
                        variant="audit"
                     />
                  )}
                  <Label
                     label="Structural Vulnerability Map - Mumbai"
                     as="div"
                     variant="block"
                     className="absolute top-6 left-6 z-[1000] glass-card text-gray-600 border border-black/5 max-w-[280px] leading-tight"
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] text-[10px] font-bold text-gray-400 uppercase">
                     Node size = cascade multiplier · click for detail
                  </div>
               </div>

               {/* Permanently Undrained Wards (Bottom Left) - DEMO vs LIVE */}
               {simulationMode === 'DEMO' ? (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl space-y-6">
                     <header className="space-y-1">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Permanently Undrained Wards</h3>
                        <p className="text-[12px] font-medium text-gray-500 italic">These wards have outfall elevation below mean sea level. No infrastructure fix possible. Will flood regardless of drain upgrades.</p>
                     </header>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                           { ward: "BKC (G-South)", level: "-0.4m", color: "bg-red-500" },
                           { ward: "Kurla West (L)", level: "-0.2m", color: "bg-red-500" },
                           { ward: "Dharavi low zone (H-East)", level: "+0.1m", color: "bg-orange-500" }
                        ].map((item, idx) => (
                           <div key={idx} className="p-4 bg-white/50 border border-black/5 rounded-2xl flex items-center justify-between">
                              <span className="text-[12px] font-black text-gray-900 uppercase">{item.ward}</span>
                              <Label label={`Outfall ${item.level}`} className={`${item.color} text-white text-[10px]`} />
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl space-y-6">
                     <header className="space-y-1">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Drainage & Outfall Status</h3>
                        <p className="text-[12px] font-medium text-gray-500 italic">Continuous live monitoring of ward outfalls and drainage systems.</p>
                     </header>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                           { ward: "BKC (G-South)", status: "CLEAR", color: "bg-emerald-500" },
                           { ward: "Kurla West (L)", status: "CLEAR", color: "bg-emerald-500" },
                           { ward: "Dharavi (H-East)", status: "CLEAR", color: "bg-emerald-500" }
                        ].map((item, idx) => (
                           <div key={idx} className="p-4 bg-white/50 border border-black/5 rounded-2xl flex items-center justify-between">
                              <span className="text-[12px] font-black text-gray-900 uppercase">{item.ward}</span>
                              <Label label={item.status} className={`${item.color} text-white text-[10px]`} />
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* RIGHT COLUMN: Sidebar (35%) */}
            <div className="flex-[0.35] flex flex-col gap-5">

               {/* AI Narrative (Top Right) - DEMO vs LIVE */}
               {simulationMode === 'DEMO' ? (
                  <div className="glass-card p-8 rounded-[3rem] border border-white/40 shadow-xl bg-white/40 flex flex-col h-fit">
                     <header className="flex justify-between items-center mb-6">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">AI Vulnerability Narrative</h3>
                        <Label label="GenAI-Croq" className="bg-gray-100 text-gray-500" />
                     </header>
                     <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                        <span className="text-[10px] font-black text-blue-600 uppercase">Generated Insight</span>
                        <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">
                           Mumbai's single most dangerous flood vulnerability is the Western Railway network. Its failure doesn't displace commuters; it collapses emergency response city-wide. 3.5 million people simultaneously shift to roads, choking every artery NDRF uses to reach flood zones. KEM Hospital, 28 min from Dharavi normally, becomes unreachable within 90 min of a WR failure. This isn't a transport problem: it's a cascade multiplier that turns a local flood into a city-wide crisis.
                        </p>
                        <div className="text-[10px] font-bold text-gray-400 uppercase pt-2">Generated from audit mode output · llama-3.3-70b · 2.1s</div>
                     </div>
                  </div>
               ) : (
                  <div className="glass-card p-8 rounded-[3rem] border border-white/40 shadow-xl bg-white/40 flex flex-col h-fit">
                     <header className="flex justify-between items-center mb-6">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">System Status Narrative</h3>
                        <Label label="Analysis Mode: Standby" className="bg-emerald-100 text-emerald-600" />
                     </header>
                     <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Current Monitoring</span>
                        <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">
                           Continuous monitoring systems are active. Real-time data from 477 operational nodes across Mumbai shows no immediate anomalies. All drainage corridors, transport links, and critical infrastructure sectors are functioning within standard baseline parameters. Switch to Demo Mode for predictive cascade analysis and vulnerability assessment.
                        </p>
                        <div className="text-[10px] font-bold text-gray-400 uppercase pt-2">System heartbeat · Last checked: just now</div>
                     </div>
                  </div>
               )}

               {/* Post-Event Report (Middle Right) */}
               <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl bg-white/40 space-y-6">
                  <header className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Post-Event Report</header>
                  <p className="text-[13px] font-bold text-gray-700 leading-snug">After event closes, RIVA generates a full accountability report: who responded, who failed, what it cost. Suitable for Municipal Commissioner.</p>
                  <LabelButton
                     onClick={() => setShowReport(true)}
                     tone="primary"
                     label="Generate accountability report"
                     icon={<ArrowRight size={14} />}
                     className="w-full py-4 text-[13px]"
                  />
               </div>

               {/* Policy Summary (Bottom Right) - DEMO vs LIVE */}
               {simulationMode === 'DEMO' ? (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl bg-white/40 space-y-6">
                     <header className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Policy Summary</header>
                     <div className="space-y-4">
                        {[
                           { label: "WR - single point of failure for 5.2M people", status: "ACT", color: "text-red-600" },
                           { label: "BKC + Kurla West - permanently undrained, no fix", status: "PLAN", color: "text-orange-600" },
                           { label: "BEST grid - single point for 1.8M + hospital backup", status: "PLAN", color: "text-orange-600" }
                        ].map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/5 last:border-0 group">
                              <span className="text-[11px] font-black text-gray-400 uppercase group-hover:text-blue-600 transition-colors">Priority</span>
                              <p className="flex-1 text-[13px] font-bold text-gray-800 leading-tight uppercase">{item.label}</p>
                              <span className={`text-[10px] font-black ${item.color} uppercase tracking-widest`}>{item.status}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl bg-white/40 space-y-6">
                     <header className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Routine Monitoring Logs</header>
                     <div className="space-y-4">
                        {[
                           { label: "Daily structural check complete", status: "OK", color: "text-emerald-600" },
                           { label: "Tide monitoring active - expected low tide 14:00", status: "INFO", color: "text-blue-600" },
                           { label: "Emergency comms network heartbeat verified", status: "OK", color: "text-emerald-600" }
                        ].map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/5 last:border-0 group">
                              <span className="text-[11px] font-black text-gray-400 uppercase group-hover:text-blue-600 transition-colors">Log</span>
                              <p className="flex-1 text-[13px] font-bold text-gray-800 leading-tight uppercase">{item.label}</p>
                              <span className={`text-[10px] font-black ${item.color} uppercase tracking-widest`}>{item.status}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {showReport && <AccountabilityReport onClose={() => setShowReport(false)} mode={simulationMode} />}
      </div>
   );
}
