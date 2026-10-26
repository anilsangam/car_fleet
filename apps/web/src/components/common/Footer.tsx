import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Elite<span className="text-brand-400">Ride</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-xs sm:text-sm max-w-sm">
              {t.footer.description}
            </p>
            <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 flex items-start gap-3 max-w-md">
              <Banknote className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white block">Cash Only Settlement</span>
                <span className="text-slate-400 block mt-0.5">
                  We collect 100% fare directly in cash upon arrival or trip completion. No advance cards required.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/cars" className="hover:text-white transition-colors">
                  {t.nav.fleet}
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors">
                  {t.nav.bookNow}
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-white transition-colors">
                  {t.nav.checkStatus}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.policies}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className="hover:text-white transition-colors">
                  {t.footer.cancellation}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Dispatch */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.contactUs}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Plot 42, Aerocity Commercial Hub, New Delhi, 110037</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <a href="mailto:dispatch@eliteride.com" className="hover:text-white">
                  dispatch@eliteride.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>24x7 Operations & Highway Dispatch</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EliteRide Fleet Operations. {t.footer.copyright}</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Single fleet operator business. All vehicles directly owned & insured.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

