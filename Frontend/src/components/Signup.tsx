import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Lock, Phone } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useRef } from 'react';
import type { Role } from '../AuthContext';
import { FormCard, FormField, FormInput, FormSelectField } from './forms/FormPrimitives';
import { LabelButton } from './tactical/TacticalLibrary';

export function Signup() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useGsapAnimations(containerRef);
  const [role, setRole] = useState('Public');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Store role for login step
    localStorage.setItem('registered_role', role);
    // Store phone for SMS targeting
    if (phone) localStorage.setItem('cascade_phone', phone);
    // Redirect to login for OTP verification
    navigate('/', { replace: true });
  };

  const roles = ['BMC Ward Officer', 'NDRF', 'Western Railway', 'Central Railway', 'KEM Hospital', 'Public Advisory', 'Developer'];

  return (
    <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center p-6 relative bg-[#f8fafc] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <header className="text-center space-y-4">
          <div className="w-20 h-20 glass-card rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 active:scale-95 transition-transform duration-500 group">
            <img src="/logo.svg" alt="Riva logo" className="w-12 h-12 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="type-priority-1 text-gray-900 brand-fonter">
              Cascade<span className="text-blue-600 ending-serif">Net</span>
            </h1>
            <p className="type-priority-5 text-gray-400 mt-3">Advanced Intelligence &amp; Response</p>
          </div>
        </header>

        <FormCard className="space-y-6">
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-5">
            <FormSelectField
              label="Departmental profile"
              value={role}
              onChange={(val) => setRole(val)}
              options={roles.map(r => ({ value: r, label: r }))}
            />

            <FormField label="Tactical ID (Mobile)">
              <FormInput
                type="tel"
                placeholder="99XX-XXX-XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone size={16} />}
              />
            </FormField>

            <FormField label="Secure keyphrase">
              <FormInput
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
          </div>

          <LabelButton
            type="submit"
            tone="primary"
            label="Create Clearance"
            icon={<ChevronRight size={18} />}
            className="w-full py-4 text-[11px]"
          />

          <div className="text-center pt-2">
            <Link to="/" className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase">
              Already Authenticated? Sign In
            </Link>
          </div>
        </form>
        </FormCard>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-gray-300" />
            <span className="text-[9px] font-black uppercase text-gray-400">Secure Enrollment Socket</span>
          </div>
          <div className="h-px w-8 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
