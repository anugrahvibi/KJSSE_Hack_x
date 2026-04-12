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

  // Pill animation state
  const [mainPillStyle, setMainPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [agencyPillStyle, setAgencyPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredMainNav, setHoveredMainNav] = useState<number | null>(null);
  const [hoveredAgency, setHoveredAgency] = useState<number | null>(null);
  const mainNavRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const agencyRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  const agencyRoles: { id: Role; label: string }[] = useMemo(() => [
    { id: 'BMC Ward Officer', label: 'BMC Ward Officer' },
    { id: 'NDRF', label: 'NDRF Battalion 4' },
    { id: 'Western Railway', label: 'Western Railway' },
    { id: 'KEM Hospital', label: 'KEM Hospital' },
  ], []);

  const mainNavItems = useMemo(() => [
    { path: '/', label: 'Command Hub' },
    { path: '/agency', label: 'Department Portals' },
    { path: '/audit', label: 'Audit Map' },
  ], []);

  useEffect(() => {
    const activeIndex = mainNavItems.findIndex(n => location.pathname === n.path);
    const activeEl = mainNavRefs.current[activeIndex];
    if (activeEl) {
      setMainPillStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 });
    }
  }, [location.pathname, mainNavItems]);

  const currentRole = role || 'BMC Ward Officer';

  useEffect(() => {
    if (!isAgencyPortal) return;
    const updateStyle = () => {
      const activeIndex = agencyRoles.findIndex(a => a.id === currentRole);
      const activeEl = agencyRefs.current[activeIndex];
      if (activeEl) {
        setAgencyPillStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 });
      }
    };
    updateStyle();
    const timer = setTimeout(updateStyle, 50);
    return () => clearTimeout(timer);
  }, [currentRole, isAgencyPortal, agencyRoles]);

  return (
    <div ref={navRef} className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-50 flex flex-col gap-2 pointer-events-none">
      {/* PRIMARY NAV BAR */}
      <nav
        className="h-16 sm:h-20 rounded-[2rem] flex items-center justify-between px-8 border border-white/80 shadow-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_inset_0_-1px_1px_rgba(0,0,0,0.05)] pointer-events-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(50px) saturate(210%)',
          WebkitBackdropFilter: 'blur(50px) saturate(210%)'
        }}
      >
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-2xl font-black brand-font uppercase tracking-tighter text-gradient-primary leading-none">RIVA</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Flood Intelligence Console</span>
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
        <div className="hidden md:inline-flex relative items-center gap-1.5 p-1 bg-white/40 rounded-full border border-white/60 shadow-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),_inset_0_-1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Layer 0: Highlight/Hover Pill (Bottom) */}
          {hoveredMainNav !== null && mainNavRefs.current[hoveredMainNav] && location.pathname !== mainNavItems[hoveredMainNav].path && (
            <div
              className="absolute top-1 bottom-1 bg-white/40 rounded-full transition-all duration-300 ease-out z-0 pointer-events-none"
              style={{
                left: mainNavRefs.current[hoveredMainNav]?.offsetLeft || 0,
                width: mainNavRefs.current[hoveredMainNav]?.offsetWidth || 0
              }}
            />
          )}

          {/* Layer 1: Active/Sliding Pill (Middle) */}
          <div
            className="absolute top-1 bottom-1 bg-blue-600 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-lg shadow-blue-500/20 z-10 pointer-events-none"
            style={mainPillStyle}
          />

          {/* Layer 2: Interactive Buttons & Text (Top) */}
          {mainNavItems.map((nav, idx) => {
            const isActive = location.pathname === nav.path;
            return (
              <button
                key={nav.path}
                ref={el => { mainNavRefs.current[idx] = el; }}
                onClick={() => navigate(nav.path)}
                onMouseEnter={() => setHoveredMainNav(idx)}
                onMouseLeave={() => setHoveredMainNav(null)}
                className="relative z-30 px-8 py-2.5 rounded-full text-[11px] font-black uppercase transition-colors duration-300 whitespace-nowrap tracking-wider outline-none bg-transparent"
              >
                <span className={`relative z-40 transition-colors duration-300 ${isActive
                  ? 'text-white'
                  : (hoveredMainNav === idx ? 'text-blue-600' : 'text-gray-600')
                  }`}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* UNIFIED MODE TOGGLE */}
          <div className={`relative flex items-center bg-white/40 p-1 rounded-2xl border border-white/60 shadow-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),_inset_0_-1px_1px_rgba(0,0,0,0.05)] pointer-events-auto transition-all duration-500 ${isSwitchingMode ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {/* Sliding Mode Indicator */}
            <div
              className={`absolute top-1 bottom-1 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-lg z-0 ${simulationMode === 'LIVE'
                ? 'left-1 w-[80px] bg-emerald-600 shadow-emerald-500/20'
                : 'left-[84px] w-[88px] bg-red-600 shadow-red-500/20'
                }`}
            />

            <button
              onClick={() => setSimulationMode('LIVE')}
              className={`relative z-10 w-[80px] py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors duration-300 ${simulationMode === 'LIVE' ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Activity size={14} />
              Live
            </button>

            <button
              onClick={() => setSimulationMode('DEMO')}
              className={`relative z-10 w-[88px] py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors duration-300 ${simulationMode === 'DEMO' ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <AlertTriangle size={14} />
              Demo
            </button>
          </div>

          <button onClick={logout} className="p-3 bg-white rounded-xl border border-black/5 text-gray-900 hover:bg-slate-50 transition-all pointer-events-auto">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* TACTICAL SUB-BAR (Only for Agency Portal) */}
      {isAgencyPortal && (
        <div
          className="relative inline-flex self-center items-center justify-center gap-1.5 w-fit rounded-full border border-white/40 p-1 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(50px) saturate(210%)',
            WebkitBackdropFilter: 'blur(50px) saturate(210%)'
          }}
        >
          {/* Layer 0: Highlight/Hover Pill (Bottom) */}
          {hoveredAgency !== null && agencyRefs.current[hoveredAgency] && currentRole !== agencyRoles[hoveredAgency].id && (
            <div
              className="absolute top-1 bottom-1 bg-white/40 rounded-full transition-all duration-300 ease-out z-0 pointer-events-none"
              style={{
                left: agencyRefs.current[hoveredAgency]?.offsetLeft || 0,
                width: agencyRefs.current[hoveredAgency]?.offsetWidth || 0
              }}
            />
          )}

          {/* Layer 1: Active/Sliding Pill (Middle) */}
          <div
            className="absolute top-1 bottom-1 bg-gray-950 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] drop-shadow-md z-10 pointer-events-none"
            style={agencyPillStyle}
          />

          {/* Layer 2: Interactive Buttons & Text (Top) */}
          {agencyRoles.map((agency, idx) => {
            const isActive = currentRole === agency.id;
            return (
              <button
                key={agency.id}
                ref={el => { agencyRefs.current[idx] = el; }}
                onClick={() => setRoleDirectly(agency.id)}
                onMouseEnter={() => setHoveredAgency(idx)}
                onMouseLeave={() => setHoveredAgency(null)}
                className="relative z-30 px-6 py-2 rounded-full text-[11px] font-semibold uppercase transition-colors duration-300 whitespace-nowrap outline-none bg-transparent"
              >
                <span className={`relative z-40 transition-colors duration-300 ${isActive
                  ? 'text-white'
                  : (hoveredAgency === idx ? 'text-gray-950' : 'text-gray-500')
                  }`}>
                  {agency.label}
                </span>
              </button>
            );
          })}
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
      {/* TACTICAL ATMOSPHERE MESH */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Primary Sapphire Gradient */}
        <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-blue-50/50 via-indigo-50/30 to-slate-50/50" />

        {/* Animated Aurora Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/15 blur-[180px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50vw] h-[50vw] bg-indigo-500/10 blur-[200px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[20%] right-[15%] w-[35vw] h-[35vw] bg-cyan-400/5 blur-[150px] rounded-full animate-float-slow" />

        {/* Subtle Horizontal Scanlines for depth */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(15,23,42,0)_1px,transparent_1px)] bg-[size:100%_4px]" />
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
