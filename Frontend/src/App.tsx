import React, { useEffect, useMemo, useState, useRef } from 'react';
// Riva: Advanced Intelligence & Response Control System
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Bell, LogOut, X, ArrowRight, Clock, Shield, Activity, AlertTriangle, Signal, Menu } from 'lucide-react';

// Dashboards
import { CommandDashboard } from './dashboards/CommandDashboard';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { RailwayDashboard } from './dashboards/RailwayDashboard';
import { BmcWardDashboard } from './dashboards/BmcWardDashboard';
import { AgencyPortalDashboard } from './dashboards/AgencyPortalDashboard';
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
  if (currentRole === 'KEM Hospital') return <DistrictAdminDashboard />;
  if (currentRole === 'Western Railway') return <RailwayDashboard />;
  if (currentRole === 'BMC Ward Officer') return <BmcWardDashboard />;

  // Central Railway uses AgencyPortalDashboard
  return <AgencyPortalDashboard />;
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout, simulationMode, setSimulationMode, setRoleDirectly, isSwitchingMode } = useAuth();
  const [notifications, setNotifications] = useState<StakeholderAction[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(navRef);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAgencyPortal = location.pathname === '/agency';
  const departmentKey = role ? roleToAlertDepartment[role] : null;

  useEffect(() => {
    if (!departmentKey || isAuthPage || simulationMode !== 'DEMO') {
      setNotifications([]);
      return;
    }
    const syncNotifications = async () => {
      const items = await fetchActiveAlerts(departmentKey);
      setNotifications(items);
    };
    syncNotifications();
    const interval = setInterval(syncNotifications, 5000);
    return () => clearInterval(interval);
  }, [departmentKey, isAuthPage, simulationMode]);

  if (isAuthPage) return null;

  const agencyRoles: { id: Role; label: string }[] = [
    { id: 'BMC Ward Officer', label: 'BMC Ward Officer' },
    { id: 'NDRF', label: 'NDRF Battalion 4' },
    { id: 'Western Railway', label: 'Western Railway' },
    { id: 'KEM Hospital', label: 'KEM Hospital' },
  ];

  return (
    <div ref={navRef} className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-50 flex flex-col gap-2 pointer-events-none">
      {/* PRIMARY NAV BAR */}
      <nav
        className="h-16 sm:h-20 rounded-[2rem] flex items-center justify-between px-8 border border-white/80 shadow-2xl pointer-events-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
              <Activity className="text-blue-600" size={20} />
            </div>
            <h1 className="text-2xl font-black brand-font uppercase tracking-tighter text-gradient-primary">RIVA</h1>
          </div>

          <div className="hidden lg:flex items-center gap-6 border-l border-black/5 pl-8">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-semibold text-gray-400 uppercase">Rainfall</span>
              <span className="text-[14px] font-bold text-gray-900">87mm/h</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-semibold text-gray-400 uppercase">Tide</span>
              <span className="text-[14px] font-bold text-blue-600">4.6m HIGH</span>
            </div>
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="hidden md:inline-flex items-center gap-1.5 p-1 bg-white/40 rounded-full border border-white/60">
          {[
            { path: '/', label: 'Command Hub' },
            { path: '/agency', label: 'Department Portals' },
            { path: '/audit', label: 'Audit Map' },
          ].map((nav) => (
            <button
              key={nav.path}
              onClick={() => navigate(nav.path)}
              className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase transition-all whitespace-nowrap tracking-wider ${location.pathname === nav.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 hover:bg-white/60'
                }`}
            >
              {nav.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Live / Demo mode controls */}
          <div className={`inline-flex items-center gap-2 ${isSwitchingMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              onClick={() => !isSwitchingMode && setSimulationMode('LIVE')}
              disabled={isSwitchingMode}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${simulationMode === 'LIVE' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-gray-200 text-gray-700'
                }`}
            >
              <Activity size={14} />
              Live Mode
            </button>

            <button
              onClick={() => !isSwitchingMode && setSimulationMode('DEMO')}
              disabled={isSwitchingMode}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${simulationMode === 'DEMO' ? 'bg-red-600 text-white shadow-xl' : 'bg-gray-200 text-gray-700'
                }`}
            >
              <AlertTriangle size={14} />
              Demo Mode
            </button>
          </div>

          <button onClick={logout} className="p-3 bg-white rounded-xl border border-black/5 text-gray-900 hover:bg-slate-50 transition-all ml-2">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* TACTICAL SUB-BAR (Only for Agency Portal) */}
      {isAgencyPortal && (
        <div
          className="inline-flex self-center items-center justify-center gap-1.5 w-fit rounded-full border border-white/40 p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)'
          }}
        >
          {agencyRoles.map((agency) => (
            <button
              key={agency.id}
              onClick={() => setRoleDirectly(agency.id)}
              className={`px-6 py-2 rounded-full text-[11px] font-semibold uppercase transition-all whitespace-nowrap ${(role || 'BMC Ward Officer') === agency.id
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
  const { role, isSwitchingMode, simulationMode } = useAuth();
  const isAuthenticated = !!role;

  return (
    <div className="h-dvh w-full bg-[#f8fafc] flex flex-col overflow-visible relative font-sans">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-blue-600/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-800/10 blur-[140px] rounded-full" />
      </div>

      {isAuthenticated && <Navigation />}

      <main className="flex-1 w-full h-full relative z-10 overflow-visible">
        {isSwitchingMode && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500">
            <div className="relative">
              <div className={`w-24 h-24 border-4 rounded-full animate-spin ${simulationMode === 'DEMO' ? 'border-orange-100 border-t-orange-600' : 'border-emerald-100 border-t-emerald-600'}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className={`${simulationMode === 'DEMO' ? 'text-orange-600' : 'text-emerald-600'} animate-pulse`} size={24} />
              </div>
            </div>
            <h2 className="mt-8 text-xl font-black text-gray-800 uppercase tracking-widest animate-pulse">
              {simulationMode === 'DEMO' ? 'Initializing Simulation' : 'Restoring Live Feed'}
            </h2>
            <p className="mt-2 text-sm font-bold text-gray-500 italic">
              {simulationMode === 'DEMO' ? 'Connecting to RIVA Core... injecting synthetic event data...' : 'Clearing synthetic data... reconnecting to live sensor arrays...'}
            </p>
          </div>
        )}
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
