import React, { useEffect, useMemo, useState, useRef } from 'react';
// Riva: Advanced Intelligence & Response Control System
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Bell, LogOut, X, ArrowRight, Clock, Shield, Activity, AlertTriangle, Signal, Menu } from 'lucide-react';

// Dashboards
import { CommandDashboard } from './dashboards/CommandDashboard';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { HighwayDepartmentDashboard } from './dashboards/HighwayDepartmentDashboard';
import { AuditDashboard } from './dashboards/AuditDashboard';
import { DemoControl } from './dashboards/DemoControl';

// Components
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ErrorBoundary } from './components/ErrorBoundary';

// Context
import { AuthProvider, useAuth } from './AuthContext';
import type { Role } from './AuthContext';
import { fetchActiveAlerts } from './utils/dataFetcher';
import type { StakeholderAction } from '@schema';
import { useGsapAnimations } from './utils/useGsapAnimations';

const roleToAlertDepartment: Record<Exclude<Role, null>, string> = {
  'BMC Ward Officer': 'BMC_WARD_OFFICER',
  'NDRF': 'NDRF',
  'Western Railway': 'WESTERN_RAILWAY',
  'Central Railway': 'CENTRAL_RAILWAY',
  'KEM Hospital': 'KEM_HOSPITAL',
  'Public Advisory': 'PUBLIC_ADVISORY',
  'Developer': 'DEVELOPER',
};

function AgencyPortal() {
  const { role } = useAuth();
  const currentRole = role || 'BMC Ward Officer';

  if (currentRole === 'NDRF') return <NdrfDashboard />;
  if (currentRole === 'Western Railway' || currentRole === 'Central Railway') return <HighwayDepartmentDashboard />;
  if (currentRole === 'KEM Hospital') return <DistrictAdminDashboard />;
  return <DamOperatorDashboard />;
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout, simulationMode, toggleSimulation, setRoleDirectly } = useAuth();
  const [notifications, setNotifications] = useState<StakeholderAction[]>([]);
  const navRef = useRef<HTMLElement>(null);

  useGsapAnimations(navRef as any);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAgencyPortal = location.pathname === '/agency';
  const departmentKey = role ? roleToAlertDepartment[role] : null;

  useEffect(() => {
    if (!departmentKey || isAuthPage) return;
    const syncNotifications = async () => {
      const items = await fetchActiveAlerts(departmentKey);
      setNotifications(items);
    };
    syncNotifications();
    const interval = setInterval(syncNotifications, 5000);
    return () => clearInterval(interval);
  }, [departmentKey, isAuthPage]);

  if (isAuthPage) return null;

  const agencyRoles: { id: Role; label: string }[] = [
    { id: 'BMC Ward Officer', label: 'BMC Ward Officer' },
    { id: 'NDRF', label: 'NDRF Battalion 4' },
    { id: 'Western Railway', label: 'Western Railway' },
    { id: 'KEM Hospital', label: 'KEM Hospital' },
  ];

  return (
    <div ref={navRef} className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-50 flex flex-col gap-2">
      {/* PRIMARY NAV BAR */}
      <nav className="h-16 sm:h-20 rounded-[2rem] flex items-center justify-between px-8 border border-white/80 glass-card shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <img src="/logo.svg" alt="Riva logo" className="w-8 h-8" />
             <h1 className="text-xl font-black text-gray-950 brand-font uppercase tracking-tighter">Riva</h1>
          </div>

          <div className="hidden lg:flex items-center gap-6 border-l border-black/5 pl-8">
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-gray-400 uppercase">Rainfall</span>
                <span className="text-[14px] font-black text-gray-900">87mm/h</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-gray-400 uppercase">Tide</span>
                <span className="text-[14px] font-black text-blue-600">4.6m HIGH</span>
             </div>
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="hidden md:flex items-center gap-2 p-1 bg-white/40 rounded-2xl border border-white/60">
           {[
             { path: '/', label: 'Command Hub' },
             { path: '/agency', label: 'Agency Portal' },
             { path: '/audit', label: 'Audit Map' },
           ].map((nav) => (
              <button
                key={nav.path}
                onClick={() => navigate(nav.path)}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${
                  location.pathname === nav.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 hover:bg-white'
                }`}
              >
                {nav.label}
              </button>
           ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleSimulation}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
              simulationMode === 'FLOOD' ? 'bg-red-600 text-white shadow-xl' : 'bg-emerald-600 text-white shadow-xl'
            }`}
          >
            {simulationMode === 'FLOOD' ? <AlertTriangle size={14} /> : <Activity size={14} />}
            {simulationMode === 'FLOOD' ? 'Sim Mode' : 'Live Mode'}
          </button>
          
          <button onClick={logout} className="p-3 bg-white rounded-xl border border-black/5 text-gray-900 hover:bg-slate-50 transition-all ml-2">
             <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* TACTICAL SUB-BAR (Only for Agency Portal) */}
      {isAgencyPortal && (
        <div className="flex items-center justify-center gap-2 glass-card rounded-2xl border border-white/40 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
           {agencyRoles.map((agency) => (
              <button
                key={agency.id}
                onClick={() => setRoleDirectly(agency.id)}
                className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap ${
                  (role || 'BMC Ward Officer') === agency.id 
                  ? 'bg-gray-950 text-white shadow-lg' 
                  : 'text-gray-500 hover:bg-white/60'
                }`}
              >
                {agency.label}
              </button>
           ))}
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole?: Role }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { role } = useAuth();
  const isAuthenticated = !!role;
  
  return (
    <div className="h-dvh w-full bg-[#f8fafc] flex flex-col overflow-visible relative font-sans">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-blue-600/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-800/10 blur-[140px] rounded-full" />
      </div>

      {isAuthenticated && <Navigation />}

      <main className="flex-1 w-full h-full relative z-10 overflow-visible">
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><CommandDashboard /></ProtectedRoute>} />
            <Route path="/agency" element={<ProtectedRoute><AgencyPortal /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditDashboard /></ProtectedRoute>} />
            <Route path="/trigger" element={<ProtectedRoute><DemoControl /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
