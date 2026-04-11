import React from 'react';

interface LabelProps {
  label: string;
  icon?: React.ReactNode;
  className?: string;
  as?: 'span' | 'div';
  variant?: 'pill' | 'block';
}

export function Label({ label, icon, className = '', as = 'span', variant = 'pill' }: LabelProps) {
  const Tag = as;
  const shapeClasses = variant === 'pill'
    ? 'pill-badge'
    : 'rounded-2xl px-4 py-2';

  return (
    <Tag className={`${shapeClasses} inline-flex items-center gap-2 text-[10px] font-black uppercase ${className}`}>
      {icon}
      {label}
    </Tag>
  );
}

interface LabelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'danger-soft' | 'danger-outline';
}

export function LabelButton({ label, icon, tone = 'neutral', className = '', ...props }: LabelButtonProps) {
  const tones: Record<NonNullable<LabelButtonProps['tone']>, string> = {
    neutral: 'bg-white/80 border border-black/5 text-gray-900 hover:bg-white shadow-sm',
    primary: 'bg-blue-600 text-white hover:bg-black shadow-lg shadow-blue-500/20',
    'danger-soft': 'bg-red-600/10 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white',
    'danger-outline': 'bg-transparent border border-orange-500 text-orange-600 hover:bg-orange-50',
  };

  return (
    <button
      className={`pill-button inline-flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {icon}
      {label}
    </button>
  );
}

interface TacticalCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  dark?: boolean;
}

export function TacticalCard({ children, title, subtitle, icon, badge, className = "", headerClassName = "", dark = false }: TacticalCardProps) {
  return (
    <div className={`glass-card rounded-[2.5rem] border border-white/40 shadow-xl overflow-visible flex flex-col ${dark ? 'bg-slate-900 text-white' : 'bg-white/40 text-gray-950'} ${className}`}>
      {title && (
        <header className={`p-8 border-b border-black/5 flex justify-between items-center ${headerClassName}`}>
          <div className="space-y-1">
             <h3 className={`text-[13px] font-black uppercase flex items-center gap-3 ${dark ? 'text-blue-400' : 'text-gray-950'}`}>
                {icon} {title}
             </h3>
             {subtitle && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtitle}</p>}
          </div>
          {badge}
        </header>
      )}
      <div className={`${title ? 'p-8' : ''} h-full`}>
        {children}
      </div>
    </div>
  );
}

interface TacticalMetricProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function TacticalMetric({ label, value, sub, color = "text-gray-900", icon }: TacticalMetricProps) {
  return (
    <div className="space-y-1 group">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</div>
      <div className="flex items-center gap-3">
        <div className={`text-3xl sm:text-4xl font-black brand-font ${color} group-hover:scale-105 transition-transform`}>
          {value}
        </div>
        {icon}
      </div>
      {sub && <div className="text-[10px] font-bold text-gray-500 uppercase italic opacity-80">{sub}</div>}
    </div>
  );
}

interface TacticalBadgeProps {
  label: string;
  variant?: 'filled' | 'outline';
  color?: 'red' | 'blue' | 'emerald' | 'orange' | 'gray';
  className?: string;
}

export function TacticalBadge({ label, variant = 'filled', color = 'blue', className = "" }: TacticalBadgeProps) {
  const styles = {
    red: {
      filled: 'bg-red-600 text-white border-0',
      outline: 'bg-transparent border border-red-600 text-red-600',
    },
    blue: {
      filled: 'bg-blue-600 text-white border-0',
      outline: 'bg-transparent border border-blue-600 text-blue-600',
    },
    emerald: {
      filled: 'bg-emerald-600 text-white border-0',
      outline: 'bg-transparent border border-emerald-600 text-emerald-600',
    },
    orange: {
      filled: 'bg-orange-600 text-white border-0',
      outline: 'bg-transparent border border-orange-600 text-orange-600',
    },
    gray: {
      filled: 'bg-gray-400 text-white border-0',
      outline: 'bg-transparent border border-gray-400 text-gray-500',
    }
  };

  return (
    <Label label={label} className={`text-[9px] tracking-wider ${styles[color][variant]} ${className}`} />
    
  );
}

interface TacticalAlertRowProps {
  status: 'OVERDUE' | 'ACK' | 'SENT' | 'PENDING' | 'ACTIVE';
  title: string;
  description: string;
  time?: string;
  action?: React.ReactNode;
}

export function TacticalAlertRow({ status, title, description, time, action }: TacticalAlertRowProps) {
  const getBadgeProps = (s: string): { label: string; color: any; variant: any } => {
    switch (s) {
      case 'OVERDUE': return { label: 'OVERDUE', color: 'red', variant: 'filled' };
      case 'ACK': return { label: 'ACK', color: 'emerald', variant: 'filled' };
      case 'SENT': return { label: 'SENT', color: 'blue', variant: 'outline' };
      case 'ACTIVE': return { label: 'ACTIVE', color: 'orange', variant: 'filled' };
      default: return { label: s, color: 'gray', variant: 'outline' };
    }
  };

  const badge = getBadgeProps(status);

  return (
    <div className="flex items-start justify-between gap-4 p-5 hover:bg-black/5 rounded-[2rem] transition-all group border border-transparent hover:border-black/5">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <TacticalBadge label={badge.label} color={badge.color} variant={badge.variant} className="w-[80px] shrink-0 text-center" />
        <div className="min-w-0">
          <p className="text-[12px] font-black text-gray-900 uppercase leading-none mb-1 truncate">{title}</p>
          <p className="text-[14px] font-bold text-gray-600 italic leading-snug line-clamp-2">"{description}"</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {time && <span className="text-[10px] font-bold text-gray-400">{time}</span>}
        {action}
      </div>
    </div>
  );
}
