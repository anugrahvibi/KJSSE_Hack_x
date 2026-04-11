import React from 'react';
import { CustomSelect } from '../CustomSelect';

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return <div className={`glass-card p-10 rounded-[3rem] space-y-8 premium-shadow ${className}`}>{children}</div>;
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="type-priority-5 text-gray-500 tracking-normal ml-1">{label}</label>
      {children}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  inputClassName?: string;
}

export function FormInput({ icon, inputClassName = '', className = '', ...props }: FormInputProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input {...props} className={`glass-input ${icon ? 'pl-14' : ''} ${inputClassName}`.trim()} />
    </div>
  );
}

interface FormSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function FormSelectField({ label, value, onChange, options, className = '' }: FormSelectFieldProps) {
  return (
    <FormField label={label} className={className}>
      <div className="relative z-50">
        <CustomSelect value={value} onChange={onChange} options={options} />
      </div>
    </FormField>
  );
}
