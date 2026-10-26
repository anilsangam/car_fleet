import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  Globe,
  Menu,
  X,
  ShieldCheck,
  Search,
  PhoneCall,
  User,
  LogOut,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const { language, setLanguage, t } = useLanguage();
  const { customer, isCustomerAuthenticated, logout } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = navSearchQuery.trim();
    setMobileMenuOpen(false);
    if (q) {
      navigate(`/cars?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/cars');
    }
  };

  const handleClearSearch = () => {
    setNavSearchQuery('');
    if (location.pathname === '/cars') {
      navigate('/cars');
    }
  };

  const navLinks = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.fleet, path: '/cars' },
    { name: t.nav.whyUs, path: '/#why-us' },
    { name: t.nav.contact, path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      {/* Top micro bar for trust & emergency dispatch */}
      <div className="bg-navy-950 text-slate-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Owned Fleet & Verified Chauffeurs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-brand-400" /> Dispatch Helpline: +91 98765 43210
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-md shadow-navy-900/20 group-hover:bg-brand-600 transition-colors">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-navy-900 block leading-tight">
                Elite<span className="text-brand-600">Ride</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
                Chauffeur Driven Fleet
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? location.pathname === '/' && !location.hash
                  : link.path.startsWith('/#')
                  ? location.hash === link.path.replace('/', '')
                  : location.pathname === link.path;

              if (link.path.startsWith('/#')) {
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand-600 font-semibold'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600 font-semibold'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search, Tracking & Customer Profile */}
          <div className="hidden md:flex items-center gap-2.5 lg:gap-3 flex-shrink-0">
            {/* Functional Navbar Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  placeholder="Search cars or routes..."
                  className="w-36 lg:w-48 xl:w-56 pl-8 pr-7 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 placeholder-slate-400 transition-all"
                  aria-label="Search fleet cars or routes"
                />
                {navSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Track Booking Button/Link */}
            <Link
              to="/status"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap"
              title="Track existing booking"
            >
              <Search className="w-3.5 h-3.5 text-brand-600" />
              <span>{t.nav.trackBooking}</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>

            {/* Customer Profile / Authentication Menu */}
            {isCustomerAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-navy-900 transition-colors"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-[11px] font-black">
                    {customer?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[90px] lg:max-w-[120px] truncate">{customer?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-navy-900 truncate">{customer?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{customer?.phone}</p>
                    </div>
                    <Link
                      to="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    >
                      <CalendarDays className="w-4 h-4 text-brand-600" />
                      {t.nav.myBookings}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-brand-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="primary" className="text-xs px-3 py-1.5">
                    {t.nav.signup}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Language, Profile Pill & Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-bold"
              title="Language"
            >
              {language === 'en' ? 'हिन्दी' : 'EN'}
            </button>

            {isCustomerAuthenticated ? (
              <Link
                to="/my-bookings"
                className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs"
                title="My Bookings"
              >
                {customer?.name?.charAt(0).toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                {t.nav.login}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-navy-900" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search cars or routes..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {navSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              if (link.path.startsWith('/#')) {
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-600 border-b border-slate-50"
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-600 border-b border-slate-50"
                >
                  {link.name}
                </Link>
              );
            })}

            <Link
              to="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800 hover:text-brand-600 border-b border-slate-50"
            >
              <Search className="w-4 h-4 text-brand-600" />
              {t.nav.trackBooking}
            </Link>
          </div>

          {/* Customer Auth Actions in Mobile Drawer */}
          {isCustomerAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="px-1 py-1">
                <p className="text-xs font-bold text-navy-900">{customer?.name}</p>
                <p className="text-[11px] text-slate-500">{customer?.phone}</p>
              </div>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800 hover:text-brand-600"
              >
                <CalendarDays className="w-4 h-4 text-brand-600" />
                {t.nav.myBookings}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2 text-sm font-semibold text-red-600 text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-xs" size="sm">
                  {t.nav.login}
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full text-xs" size="sm">
                  {t.nav.signup}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
