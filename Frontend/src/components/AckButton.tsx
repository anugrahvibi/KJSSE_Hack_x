import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface AckButtonProps {
  alertId: string;
  deptId: string;
  onAck?: () => void;
  status?: string;
}

export function AckButton({ alertId, deptId, onAck, status }: AckButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async (newStatus: 'ACKNOWLEDGED' | 'ESCALATED') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agent/acknowledge/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_id: deptId, status: newStatus }),
      });
      if (response.ok && onAck) onAck();
    } catch (err) {
      console.error('Ack failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'ACKNOWLEDGED') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs uppercase">
        <CheckCircle size={14} /> Acknowledged
      </div>
    );
  }

  if (status === 'OVERDUE') {
     return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-black text-xs uppercase border border-red-200 animate-pulse">
        <AlertTriangle size={14} /> Overdue
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => handleAction('ACKNOWLEDGED')}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-black transition-all active:scale-95 disabled:opacity-50"
      >
        Acknowledge
      </button>
      <button
        disabled={loading}
        onClick={() => handleAction('ESCALATED')}
        className="px-4 py-2 border border-orange-500 text-orange-600 rounded-xl font-black text-xs uppercase hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
      >
        Escalate
      </button>
    </div>
  );
}
