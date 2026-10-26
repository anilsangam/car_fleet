import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  MapPin,
  Calendar,
  Banknote,
  Car as CarIcon,
  Search,
  Home,
  PhoneCall,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    booking?: any;
    bookingReference?: string;
    otpCode?: string;
  };

  const [copied, setCopied] = useState(false);

  if (!state?.bookingReference) {
    return <Navigate to="/" replace />;
  }

  const { booking, bookingReference, otpCode } = state;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trackingUrl = `/status?ref=${encodeURIComponent(bookingReference)}&phone=${encodeURIComponent(booking?.customerPhone || '')}`;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Simple Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Booking Request Received!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your request has been submitted and is awaiting confirmation. Our dispatch desk is verifying vehicle and chauffeur availability.
          </p>
        </div>

        {/* Minimal Rounded Summary Card */}
        <Card className="p-6 sm:p-7 bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 rounded-3xl space-y-6">
          {/* Reference & Status Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Booking Reference
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-mono font-black text-navy-900 tracking-wide">
                  {bookingReference}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors"
                  title="Copy Reference"
                  aria-label="Copy booking reference"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Pending Confirmation
              </span>
              {otpCode && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Direct Verification PIN: <strong className="font-mono text-slate-700">{otpCode}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Concise Trip Summary */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trip Summary
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <CarIcon className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Selected Car</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {booking?.carDetails?.name || 'Assigned Fleet Vehicle'}
                  </span>
                  <span className="text-slate-500 block text-[11px] capitalize mt-0.5">
                    {booking?.tripType?.replace('_', ' ')} Trip
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date & Time</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {new Date(booking?.pickupDateTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Passenger Count: {booking?.passengerCount || 1}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pickup Location</span>
                    <span className="font-semibold text-slate-800">{booking?.pickupLocation}</span>
                  </div>
                </div>

                {booking?.destinationLocation && (
                  <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200/60">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Destination Location</span>
                      <span className="font-semibold text-slate-800">{booking?.destinationLocation}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fare & Cash Only Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-xs">
            <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-bold text-emerald-900">Estimated Total Fare:</span>
                <span className="text-base font-extrabold text-emerald-900">
                  ₹{Number(booking?.expectedFare || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                <strong className="font-bold">Strictly Cash Only:</strong> No advance card payment required. Settle the exact fare directly with the chauffeur in cash upon vehicle arrival or trip conclusion.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to={trackingUrl}>
              <Button size="lg" className="w-full shadow-md shadow-brand-600/20" icon={<Search className="w-4 h-4" />}>
                Track Booking
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg" className="w-full" icon={<Home className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>

        {/* Dispatch Helpline */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-brand-600" />
          <span>Need immediate dispatch assistance? Call 24/7 helpline: +91 98765 43210</span>
        </div>
      </div>
    </div>
  );
};
