import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  ArrowRight,
  MapPin,
  Car as CarIcon,
  PhoneCall,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { ICar } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { QuickBookingForm } from '../../components/customer/QuickBookingForm';
import { CarCard } from '../../components/customer/CarCard';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [featuredCars, setFeaturedCars] = useState<ICar[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    async function loadCars() {
      try {
        setIsLoadingCars(true);
        const res = await api.get('/cars');
        if (res.success && Array.isArray(res.data)) {
          setFeaturedCars(res.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load cars for home page', err);
      } finally {
        setIsLoadingCars(false);
      }
    }
    loadCars();
  }, []);

  const popularRoutes = [
    {
      route: 'Delhi NCR ➔ Agra (Taj Mahal Express)',
      tripType: 'one_way',
      distance: '230 km',
      duration: '3.5 Hours',
      startPrice: '₹3,800',
      category: 'Sedan & SUV',
    },
    {
      route: 'Delhi NCR ➔ Jaipur (Pink City Heritage)',
      tripType: 'one_way',
      distance: '280 km',
      duration: '4.5 Hours',
      startPrice: '₹4,500',
      category: 'Sedan & SUV',
    },
    {
      route: 'Delhi Airport T3 ➔ Outstation Doorstep Drop',
      tripType: 'one_way',
      distance: 'Flight Monitored',
      duration: 'Direct Chauffeur',
      startPrice: '₹1,400',
      category: 'All Categories',
    },
    {
      route: 'Delhi NCR Local City Sightseeing & Business',
      tripType: 'hourly',
      distance: '8 Hours / 80 KM',
      duration: 'Full Day Standby',
      startPrice: '₹2,100',
      category: 'Sedan & Luxury',
    },
  ];

  const faqs = [
    {
      q: 'Do I need to pay anything online or enter a credit card when booking?',
      a: 'No. EliteRide operates strictly on a Cash-on-Arrival model. You will receive an instant verified booking reference upon submitting your trip request, and you settle the exact confirmed fare directly with the chauffeur in cash.',
    },
    {
      q: 'Are your vehicles owned by third parties or by your company?',
      a: 'We directly own and manage 100% of our fleet (20–50 sedans, SUVs, and luxury vans). We are not a broker or third-party commission marketplace. Every car is regularly inspected, detailed, and maintained to the highest roadworthiness standards.',
    },
    {
      q: 'How and when will I receive my assigned driver and car details?',
      a: 'Once our dispatch desk reviews and confirms your booking, you can check your booking status on our website using your reference number and mobile number. Driver details are disclosed in accordance with safety timing prior to pickup.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel free of charge up to 4 hours prior to scheduled pickup time. Because payment is cash-on-arrival, no complex refund paperwork is required. Please notify dispatch promptly if your flight or schedule shifts.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section - Compact & Modern */}
      <section className="relative bg-navy-950 text-white pt-8 sm:pt-14 pb-16 sm:pb-24 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>{t.hero.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t.hero.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/cars">
                <Button size="md" variant="primary" icon={<CarIcon className="w-4 h-4" />}>
                  {t.hero.exploreFleet}
                </Button>
              </Link>
              <Link to="/status">
                <Button size="md" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {t.hero.checkBooking}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Booking Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20">
        <QuickBookingForm />
      </div>

      {/* 2. Premium Vehicles (Featured Fleet Showcase) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
              Top Fleet Selections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Premium Vehicles for Every Journey
            </h2>
          </div>
          <Link to="/cars">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              View All 20+ Vehicles
            </Button>
          </Link>
        </div>

        {isLoadingCars ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[320px] rounded-2xl overflow-hidden bg-white border border-slate-200 p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map((car) => (
              <CarCard key={car._id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Why Choose Us (Trust Pillars) */}
      <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.features.whyChooseUs}
          </h2>
          <p className="text-sm text-slate-600 mt-2">{t.features.whySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">{t.features.ownedFleetTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.features.ownedFleetDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">{t.features.verifiedDriversTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.features.verifiedDriversDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">{t.features.transparentPricingTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.features.transparentPricingDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">{t.features.cashPaymentTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.features.cashPaymentDesc}</p>
          </div>
        </div>
      </section>

      {/* Popular Routes & Fixed Fares */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
              Guaranteed Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Popular Outstation & Local Routes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              All routes include certified chauffeur and AC vehicle. Toll taxes can be settled in cash as per receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRoutes.map((route, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{route.tripType === 'hourly' ? 'Hourly Rental' : 'Outstation Fixed'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-900 mb-2 leading-snug">{route.route}</h4>
                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <p>Estimated: {route.distance}</p>
                    <p>Travel Time: {route.duration}</p>
                    <p>Available on: {route.category}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Fixed Starting</span>
                    <span className="text-base font-extrabold text-navy-900">{route.startPrice}</span>
                  </div>
                  <Link to="/booking">
                    <Button size="sm" variant="outline" className="text-xs py-1.5 px-3">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works 4 steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.howItWorks.title}
          </h2>
          <p className="text-sm text-slate-600 mt-2">{t.howItWorks.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center text-sm">
              1
            </span>
            <h3 className="text-base font-bold text-navy-900">{t.howItWorks.step1Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step1Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center text-sm">
              2
            </span>
            <h3 className="text-base font-bold text-navy-900">{t.howItWorks.step2Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step2Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center text-sm">
              3
            </span>
            <h3 className="text-base font-bold text-navy-900">{t.howItWorks.step3Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step3Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center text-sm">
              4
            </span>
            <h3 className="text-base font-bold text-navy-900">{t.howItWorks.step4Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.howItWorks.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Clear, honest answers about our cash model and chauffeur fleet operations.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-navy-900 flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Dispatch CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
              24x7 Immediate Coordination
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Need a vehicle dispatched today or for airport pickup?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Our direct fleet operations dispatch desk is on standby 24 hours a day. Book online in 2 minutes without prepayment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/booking">
              <Button size="lg" variant="primary" className="w-full sm:w-auto">
                Book Chauffeur Fleet
              </Button>
            </Link>
            <a href="tel:+919876543210">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10" icon={<PhoneCall className="w-4 h-4" />}>
                Call Dispatch
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

