import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Car,
  UserCheck,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const AdminLayout: React.FC = () => {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Bookings & Dispatch', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Fleet Inventory', path: '/admin/cars', icon: Car },
    { name: 'Chauffeurs & Drivers', path: '/admin/drivers', icon: UserCheck },
    { name: 'Pricing & Tariffs', path: '/admin/pricing', icon: Tag },
    { name: 'Reports & Revenue', path: '/admin/reports', icon: BarChart3 },
    { name: 'Business Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-slate-800 flex-shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight block leading-tight">
                Elite<span className="text-brand-400">Ride</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                Fleet Admin Desk
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs">
              <span className="font-bold text-white block truncate max-w-[140px]">
                {adminUser?.name || 'Administrator'}
              </span>
              <span className="text-[11px] text-slate-400 capitalize block">
                {adminUser?.role || 'Dispatcher'}
              </span>
            </div>
            <Link
              to="/"
              target="_blank"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Open Customer Website"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-xs py-1.5 border-slate-700 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900 justify-start"
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 md:hidden rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Dispatch & Operations Management
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Website</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                {adminUser?.name?.[0] || 'A'}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {adminUser?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-navy-950 text-white p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
              >
                <item.icon className="w-4 h-4 text-brand-400" />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-900/30 w-full text-left pt-2 border-t border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

