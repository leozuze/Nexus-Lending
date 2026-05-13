import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import { useNotifications } from './hooks/useNotifications';
import { SESSION_KEY } from '../../App';

import logo from '../../assets/logo.png';

import Overview      from './views/Overview';
import MyLoans       from './views/MyLoans';
import Repayments    from './views/Repayments';
import Notifications from './views/Notifications';
import Profile       from './views/Profile';
import Settings      from './views/Settings';

import {
  LayoutDashboard, FileText, CalendarClock, Bell,
  UserCircle, Settings as SettingsGear, LogOut, Zap, Menu, X,
} from 'lucide-react';

const NAV = [
  { id: 'overview',      label: 'Overview',     icon: LayoutDashboard, section: 'main' },
  { id: 'loans',         label: 'My Loans',      icon: FileText,        section: 'main' },
  { id: 'repayments',    label: 'Repayments',    icon: CalendarClock,   section: 'main' },
  { id: 'notifications', label: 'Notifications', icon: Bell,            section: 'account' },
  { id: 'profile',       label: 'Profile',       icon: UserCircle,      section: 'account' },
  { id: 'settings',      label: 'Settings',      icon: SettingsGear,    section: 'account' },
];

const VIEW_TITLES = {
  overview:      'Overview',
  loans:         'My Loans',
  repayments:    'Repayments',
  notifications: 'Notifications',
  profile:       'Profile',
  settings:      'Settings',
};

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialView = location.state?.newApplication ? 'loans' : 'overview';
  const [activeView, setActiveView] = useState(initialView);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, loading: userLoading } = useUser();
  const { unreadCount }                = useNotifications();

  // Clear newApplication state so a refresh doesn't re-trigger the tab switch
  useEffect(() => {
    if (location.state?.newApplication) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Sign out: clear session stamp first so App.jsx doesn't see a stale session
  const handleSignOut = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview':      return <Overview onNavigate={setActiveView} />;
      case 'loans':         return <MyLoans />;
      case 'repayments':    return <Repayments />;
      case 'notifications': return <Notifications />;
      case 'profile':       return <Profile />;
      case 'settings':      return <Settings />;
      default:              return <Overview onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col
        bg-[#0B1E3D] text-white transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-white/10">
            <img src={logo} alt="Nexus Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight leading-none">NEXUS</span>
            <span className="text-[10px] text-[#22D3EE] font-bold tracking-[0.2em] uppercase mt-1">Lending</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 px-3 mb-3">Main Menu</p>
          <div className="space-y-1">
            {NAV.filter(n => n.section === 'main').map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                badge={item.id === 'notifications' ? unreadCount : 0}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
              />
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 px-3 mt-8 mb-3">Account</p>
          <div className="space-y-1">
            {NAV.filter(n => n.section === 'account').map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                badge={item.id === 'notifications' ? unreadCount : 0}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
              />
            ))}
          </div>
        </nav>

        {/* User profile block */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          {userLoading ? (
            <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#0891B2] flex items-center justify-center text-[#0B1E3D] text-xs font-black flex-shrink-0 ring-2 ring-cyan-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate">
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </p>
                <p className="text-[10px] text-white/40 truncate">{user?.email ?? ''}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold border border-transparent hover:border-red-500/20"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-4 px-8 py-5 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col">
            <h1 className="text-lg font-black text-[#0B1E3D] tracking-tight">
              {VIEW_TITLES[activeView]}
            </h1>
            {activeView === 'overview' && !userLoading && (
              <p className="text-xs text-gray-400 font-medium">
                {greeting()}, {user?.first_name ?? 'there'}! Here is your account update.
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => setActiveView('notifications')}
              className="relative w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0B1E3D] transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/check-rate')}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#0B1E3D] text-white text-xs font-black rounded-xl hover:bg-[#22D3EE] hover:text-[#0B1E3D] transition-all shadow-md"
            >
              <Zap size={14} className="fill-current" />
              Apply New Loan
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, active, badge, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active
          ? 'bg-[#22D3EE] text-[#0B1E3D] shadow-lg shadow-cyan-500/20'
          : 'text-white/50 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} className={active ? 'text-[#0B1E3D]' : 'text-current'} />
      <span className="flex-1 text-left">{item.label}</span>
      {badge > 0 && (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
          active ? 'bg-[#0B1E3D]/10 text-[#0B1E3D]' : 'bg-[#EF4444] text-white'
        }`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
