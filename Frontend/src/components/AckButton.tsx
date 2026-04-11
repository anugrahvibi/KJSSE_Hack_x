import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Label, LabelButton } from './tactical/TacticalLibrary';

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
      <Label label="Acknowledged" icon={<CheckCircle size={14} />} as="div" className="bg-emerald-100 text-emerald-700 text-xs" />
    );
  }

  if (status === 'OVERDUE') {
     return (
      <Label label="Overdue" icon={<AlertTriangle size={14} />} as="div" className="bg-red-100 text-red-700 text-xs border border-red-200 animate-pulse" />
    );
  }

  return (
    <div className="flex gap-2">
      <LabelButton disabled={loading} onClick={() => handleAction('ACKNOWLEDGED')} tone="primary" label="Acknowledge" />
      <LabelButton disabled={loading} onClick={() => handleAction('ESCALATED')} tone="danger-outline" label="Escalate" />
    </div>
  );
}
