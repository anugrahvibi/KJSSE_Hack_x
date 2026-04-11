import React, { useEffect, useState, useRef } from 'react';
import { Shield, AlertTriangle, TrendingUp, BarChart3, Layers, Target, CheckCircle2, Info, Map as MapIcon, ArrowRight, Activity, BrainCircuit, Maximize2, AlertCircle } from 'lucide-react';
import { fetchVulnerabilities } from '../utils/dataFetcher';
import type { VulnerabilityAnalysis } from '@schema';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { MapView } from '../components/MapView';
import { AccountabilityReport } from './AccountabilityReport';

export function AuditDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityAnalysis | null>(null);
  const [showReport, setShowReport] = useState(false);

  useGsapAnimations(containerRef, [vulnerabilities]);

  useEffect(() => {
    async function init() {
      const vData = await fetchVulnerabilities();
      setVulnerabilities(vData);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-10 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-5">
        
        {/* LEFT COLUMN: Insights & Map (65%) */}
        <div className="flex-[0.65] flex flex-col gap-5">
          
          {/* Vulnerability Ranking (Top Left) */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl space-y-6">
             <header className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>Vulnerability Ranking — Cascade Multiplier</span>
                <span className="text-gray-400 italic font-bold">Audit mode — no live event needed</span>
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
                     <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }} />
                     </div>
                     <span className="w-16 text-right text-[13px] font-black text-gray-950 brand-font">{item.value}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Structural Map (Middle Left) */}
          <div className="flex-1 min-h-[450px] relative rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-white/30">
            <MapView
                zonesGeoJson={null}
                infrastructureNodes={[]}
                predictions={vulnerabilities?.ranked_zones?.map(z => ({
                  zone_id: z.zone_id,
                  flood_probability: z.score / 100,
                  lead_time_hours: 0,
                  zone_name: z.zone_id
                })) || []}
                onZoneClick={() => {}}
              />
            <div className="absolute top-6 left-6 z-[1000] glass-card px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase border border-black/5">
               STRUCTURAL VULNERABILITY MAP — MUMBAI
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] text-[10px] font-bold text-gray-400 uppercase">
               Node size = cascade multiplier · click for detail
            </div>
          </div>

          {/* Permanently Undrained Wards (Bottom Left) */}
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
                     <span className={`px-2 py-1 ${item.color} text-white text-[10px] font-black rounded-lg`}>Outfall {item.level}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (35%) */}
        <div className="flex-[0.35] flex flex-col gap-5">
          
          {/* AI Narrative (Top Right) */}
          <div className="glass-card p-8 rounded-[3rem] border border-white/40 shadow-xl bg-white/40 flex flex-col h-fit">
             <header className="flex justify-between items-center mb-6">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">AI Vulnerability Narrative</h3>
                <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase">GenAI-Croq</span>
             </header>
             <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                <span className="text-[10px] font-black text-blue-600 uppercase">Generated Insight</span>
                <p className="text-[14px] font-bold text-gray-700 leading-relaxed italic">
                  Mumbai's single most dangerous flood vulnerability is the Western Railway network. Its failure doesn't displace commuters — it collapses emergency response city-wide. 3.5 million people simultaneously shift to roads, choking every artery NDRF uses to reach flood zones. KEM Hospital, 28 min from Dharavi normally, becomes unreachable within 90 min of a WR failure. This isn't a transport problem: it's a cascade multiplier that turns a local flood into a city-wide crisis.
                </p>
                <div className="text-[10px] font-bold text-gray-400 uppercase pt-2">Generated from audit mode output · llama-3.3-70b · 2.1s</div>
             </div>
          </div>

          {/* Post-Event Report (Middle Right) */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl bg-white/40 space-y-6">
             <header className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Post-Event Report</header>
             <p className="text-[13px] font-bold text-gray-700 leading-snug">After event closes, RIVA generates a full accountability report — who responded, who failed, what it cost. Suitable for Municipal Commissioner.</p>
             <button 
                onClick={() => setShowReport(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[13px] uppercase hover:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
             >
                Generate accountability report <ArrowRight size={14} />
             </button>
          </div>

          {/* Policy Summary (Bottom Right) */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/40 shadow-xl bg-white/40 space-y-6">
             <header className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Policy Summary</header>
             <div className="space-y-4">
                {[
                  { label: "WR — single point of failure for 5.2M people", status: "ACT", color: "text-red-600" },
                  { label: "BKC + Kurla West — permanently undrained, no fix", status: "PLAN", color: "text-orange-600" },
                  { label: "BEST grid — single point for 1.8M + hospital backup", status: "PLAN", color: "text-orange-600" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/5 last:border-0 group">
                     <span className="text-[11px] font-black text-gray-400 uppercase group-hover:text-blue-600 transition-colors">Priority</span>
                     <p className="flex-1 text-[13px] font-bold text-gray-800 leading-tight uppercase">{item.label}</p>
                     <span className={`text-[10px] font-black ${item.color} uppercase tracking-widest`}>{item.status}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
      
      {showReport && <AccountabilityReport onClose={() => setShowReport(false)} />}
    </div>
  );
}
