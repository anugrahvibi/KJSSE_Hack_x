import React, { useEffect, useState, useRef } from 'react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction, AlertRecord } from '@schema';
import { PlusCircle, Bed, Ambulance, AlertTriangle, Activity, Navigation, Clock } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { AccountabilityBanner } from '../components/AccountabilityBanner';
import { TacticalCard, TacticalBadge } from '../components/tactical/TacticalLibrary';
import { useAuth } from '../AuthContext';

export function DistrictAdminDashboard() {
  const { simulationMode } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [acknowledgingAlert, setAcknowledgingAlert] = useState<string | null>(null);
  const [alertAction, setAlertAction] = useState<'ack' | 'cannot' | null>(null);

  useGsapAnimations(containerRef, [alerts]);

  useEffect(() => {
    async function init() {
      const aData = await fetchActiveAlerts('KEM_HOSPITAL');
      setAlerts(aData);
    }
    init();
  }, []);

  const handleAcknowledgeAlert = async (alertId: string, status: 'ACKNOWLEDGED' | 'OVERDUE') => {
    setAcknowledgingAlert(alertId);
    setAlertAction(status === 'ACKNOWLEDGED' ? 'ack' : 'cannot');
    
    try {
      const response = await fetch(`/api/agent/acknowledge/${alertId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dept_id: 'KEM_HOSPITAL',
          status: status
        }),
      });
      
      if (response.ok) {
        // Refresh alerts
        const aData = await fetchActiveAlerts('KEM_HOSPITAL');
        setAlerts(aData);
      } else {
        console.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setAcknowledgingAlert(null);
      setAlertAction(null);
    }
  };

  return (
    <div ref={containerRef} className="pt-40 sm:pt-44 lg:pt-48 p-12 h-full bg-transparent overflow-y-auto w-full custom-scrollbar overflow-visible">
      {simulationMode !== 'DEMO' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Offline Mode</h2>
            <p className="text-gray-600">Switch to DEMO mode to view live data and interact with the dashboard.</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-12 py-10">
        <AccountabilityBanner />

        {/* Alert Bar */}
        <div className="glass-card p-6 rounded-[2.25rem] border border-orange-200 bg-orange-500/10 shadow-xl overflow-visible flex flex-col md:flex-row items-center justify-between gap-6 group">
            <div className="flex-1 space-y-1">
               <p className="text-[13px] font-black text-orange-600 uppercase flex items-center gap-2">
                  Alert Dispatched 09:07
               </p>
               <p className="text-[16px] font-bold text-gray-900 leading-tight uppercase">
                  Activate surge protocol · Pre-position 4 ambulances at 90 Feet Rd · Deadline: 09:32
               </p>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={() => alerts.length > 0 && handleAcknowledgeAlert(alerts[0].alert_id, 'ACKNOWLEDGED')}
                 disabled={acknowledgingAlert === alerts[0]?.alert_id && alertAction === 'ack'}
                 className="px-8 py-3 bg-gray-950 text-white rounded-xl font-black text-[13px] uppercase hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center gap-2"
               >
                 {acknowledgingAlert === alerts[0]?.alert_id && alertAction === 'ack' ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 ) : null}
                 ACK + activating
               </button>
               <button 
                 onClick={() => alerts.length > 0 && handleAcknowledgeAlert(alerts[0].alert_id, 'OVERDUE')}
                 disabled={acknowledgingAlert === alerts[0]?.alert_id && alertAction === 'cannot'}
                 className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-black text-[13px] uppercase hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
               >
                 {acknowledgingAlert === alerts[0]?.alert_id && alertAction === 'cannot' ? (
                   <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                 ) : null}
                 Cannot comply
               </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* LEFT COLUMN */}
           <div className="space-y-8 flex flex-col">
              
              {/* Hospital Capacity */}
              <TacticalCard title="HOSPITAL CAPACITY" icon={<Bed size={16} className="text-gray-400" />}>
                 <div className="space-y-8">
                    <CapacityProgress label="Current occupancy" value={65} color="bg-orange-500" />
                    <CapacityProgress label="Surge capacity available" value={35} color="bg-emerald-500" sub="approx 140 beds" />
                 </div>
              </TacticalCard>

              {/* Cascade Risk to KEM */}
              <TacticalCard title="CASCADE RISK TO KEM" icon={<AlertTriangle size={18} className="text-red-600" />}>
                 <div className="space-y-6">
                    <p className="text-[16px] font-bold text-gray-700 leading-snug uppercase">
                       If WR fails at T+60 → roads choke at T+90 → <span className="text-red-600 font-black">KEM unreachable by T+135</span>
                    </p>
                    <div className="space-y-2">
                       <StatusMetric label="Current window" value="125 min remaining" color="text-emerald-600" />
                       <StatusMetric label="Generator" value="72hr fuel" color="text-gray-950" />
                       <StatusMetric label="Backup power" value="online" color="text-emerald-600" />
                    </div>
                 </div>
              </TacticalCard>
           </div>

           {/* RIGHT COLUMN */}
           <div className="space-y-8 flex flex-col">
              
              {/* Surge Protocol Checklist */}
              <TacticalCard title="SURGE PROTOCOL CHECKLIST" icon={<Activity size={18} className="text-blue-600" />}>
                 <div className="space-y-2">
                    <HospChecklistRow time="09:07" label="Surge protocol alert received" status="ACK" color="emerald" />
                    <HospChecklistRow time="09:12" label="4 ambulances pre-positioned at 90 Feet Rd" status="DONE" color="emerald" />
                    <HospChecklistRow time="09:20" label="Generator fuel check — 72hr reserve confirmed" status="DONE" color="emerald" />
                    <HospChecklistRow time="09:32" label="Ground floor patient shift — flood prep" status="IN PROG" color="orange" />
                    <HospChecklistRow time="09:45" label="Staff surge team on standby" status="PENDING" color="orange" variant="outline" />
                 </div>
              </TacticalCard>

              {/* Ambulance Routing */}
              <div className="flex-1 glass-card rounded-[2.5rem] border border-white/40 shadow-xl bg-slate-50/50 flex flex-col p-8">
                 <header className="mb-8">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                       <Ambulance size={18} /> AMBULANCE ROUTING
                    </h3>
                 </header>
                 <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    <div className="flex items-center gap-6">
                       <TacticalBadge label="KEM base" color="emerald" variant="outline" className="px-6 py-3 rounded-2xl" />
                       <ArrowIcon />
                       <TacticalBadge label="90 Feet Rd" color="emerald" variant="outline" className="px-6 py-3 rounded-2xl" />
                       <ArrowIcon />
                    </div>
                    <div className="p-6 bg-red-100 rounded-[2rem] border border-red-200">
                       <span className="text-[14px] font-black text-red-600 uppercase">Sector B staging</span>
                    </div>
                    <span className="text-[11px] font-black text-gray-400 uppercase italic">avoid Sion underpass — closed by BMC</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CapacityProgress({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="space-y-3">
       <div className="flex justify-between items-center text-[13px] font-black uppercase">
          <span className="text-gray-900">{label}</span>
          <span className="text-gray-950">{value}%</span>
       </div>
       <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
       </div>
       {sub && <p className="text-[11px] font-black text-emerald-600 uppercase text-right">{sub}</p>}
    </div>
  );
}

function StatusMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 text-[14px] font-bold uppercase">
       <span className="text-gray-400 w-32">{label}:</span>
       <span className={color}>{value}</span>
    </div>
  );
}

function HospChecklistRow({ time, label, status, color, variant = 'filled' }: { time: string; label: string; status: string; color: any; variant?: any }) {
  return (
     <div className="flex items-center gap-6 py-4 border-b border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-xl transition-all h-20">
        <span className="text-[13px] font-black text-gray-400">{time}</span>
        <p className="flex-1 text-[14px] font-bold text-gray-700 leading-tight uppercase tracking-tighter">{label}</p>
        <TacticalBadge label={status} color={color} variant={variant} className="shrink-0 w-24 text-center" />
     </div>
  );
}

function ArrowIcon() {
  return (
     <div className="text-gray-300">
        <Navigation size={18} className="rotate-90" />
     </div>
  );
}
