import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Car,
  User,
  Phone,
  Banknote,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Calendar,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';

export const BookingStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { error: toastError, info: toastInfo } = useToast();

  const [bookingReference, setBookingReference] = useState(searchParams.get('ref') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (otpToVerify?: string) => {
    if (!bookingReference.trim() || !phone.trim()) {
      setError('Please enter both your Booking Reference and Registered Mobile Number.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await api.post('/bookings/status', {
        bookingReference: bookingReference.trim().toUpperCase(),
        phone: phone.trim(),
        otpCode: otpToVerify || undefined,
      });

      if (res.success && res.data) {
        setBooking(res.data);
        if (res.isOtpVerified) {
          setIsOtpStep(false);
        } else if (res.otpSentForDemo) {
          // In real SMS gateway mode, an SMS is sent. In demo/dev mode, the system surfaces the code.
          setDemoOtpHint(res.otpSentForDemo);
          setIsOtpStep(true);
          toastInfo(`Security OTP generated: ${res.otpSentForDemo}`);
        }
      }
    } catch (err: any) {
      console.error('Status lookup error', err);
      setError(err?.message || 'Unable to find booking. Please verify reference code and phone.');
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  // If query params are provided, auto-trigger lookup
  useEffect(() => {
    if (searchParams.get('ref') && searchParams.get('phone')) {
      handleLookup();
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed & Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="primary">Trip in Progress</Badge>;
      case 'completed':
        return <Badge variant="accent">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="danger">Declined by Dispatcher</Badge>;
      default:
        return <Badge variant="warning">Pending Confirmation</Badge>;
    }
  };

  const steps = ['pending', 'confirmed', 'in_progress', 'completed'];
  const currentStepIndex = booking ? steps.indexOf(booking.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Secure Customer Portal
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Track Your Booking Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Enter your reference code and registered phone number to view real-time trip assignment and chauffeur details.
        </p>
      </div>

      {/* Lookup Form Card */}
      <Card className="p-6 bg-white shadow-sm border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(isOtpStep ? otpCode : undefined);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Booking Reference Code"
              required
              placeholder="e.g. CR-202610-A8F2"
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
            />

            <Input
              label="Registered Mobile Number"
              required
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {isOtpStep && (
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-2">
              <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider">
                Enter 6-Digit Verification OTP
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="bg-white border border-brand-300 rounded-xl px-4 py-2 text-base font-mono tracking-widest text-slate-900 w-44 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" size="sm" isLoading={isLoading}>
                  Verify & Unlock Chauffeur Details
                </Button>
              </div>
              {demoOtpHint && (
                <p className="text-[11px] text-brand-700">
                  Demo Security OTP: <strong>{demoOtpHint}</strong> (Sent to {phone})
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isOtpStep && (
            <div className="flex justify-end pt-1">
              <Button type="submit" isLoading={isLoading} icon={<Search className="w-4 h-4" />}>
                Retrieve Booking Details
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Booking Details Display */}
      {booking && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status Tracker Banner */}
          <Card className="p-6 bg-white space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Booking Reference</span>
                <span className="text-xl font-mono font-black text-navy-900">
                  {booking.bookingReference}
                </span>
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            {/* Stepper Progress Bar (for standard positive statuses) */}
            {booking.status !== 'cancelled' && booking.status !== 'rejected' ? (
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Requested', desc: 'Placed online' },
                  { label: 'Confirmed', desc: 'Approved by desk' },
                  { label: 'Chauffeur Dispatched', desc: 'On route' },
                  { label: 'Completed', desc: 'Trip settled' },
                ].map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={idx} className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDone ? 'bg-brand-600' : 'bg-slate-200'
                        }`}
                      />
                      <span
                        className={`font-bold block ${
                          isCurrent ? 'text-brand-600' : isDone ? 'text-navy-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>
                  This booking is marked as <strong>{booking.status}</strong>. Please reach out to our dispatch desk for assistance.
                </span>
              </div>
            )}
          </Card>

          {/* Assigned Vehicle & Chauffeur Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Card */}
            <Card className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-600" />
                <span>Assigned Fleet Vehicle</span>
              </h3>

              {booking.carDetails ? (
                <div className="flex items-center gap-4">
                  {booking.carDetails.primaryImage && (
                    <img
                      src={booking.carDetails.primaryImage}
                      alt={booking.carDetails.name}
                      className="w-24 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <span className="text-sm font-bold text-navy-900 block">
                      {booking.carDetails.name}
                    </span>
                    <span className="text-slate-500 block capitalize">
                      {booking.carDetails.brand} • {booking.carDetails.category?.replace('_', ' ')}
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-navy-950 text-white font-mono font-bold text-[11px]">
                      {booking.carDetails.registrationNumber}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Vehicle assignment will be displayed here once dispatch assigns a car.
                </p>
              )}
            </Card>

            {/* Chauffeur Details */}
            <Card className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                <span>Assigned Commercial Chauffeur</span>
              </h3>

              {booking.driverDetails ? (
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                      {booking.driverDetails.name[0]}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-navy-900 block">
                        {booking.driverDetails.name}
                      </span>
                      <span className="text-slate-500 block">Verified Fleet Driver</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`tel:${booking.driverDetails.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Driver: {booking.driverDetails.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="leading-relaxed">
                    Chauffeur coordinates are verified and released 3 hours prior to scheduled pickup for passenger safety and schedule coordination.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    If this is a same-day trip, our dispatch desk will call you directly.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Cash Payment Status Card */}
          <Card className="p-6 bg-white space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Cash Settlement Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Agreed Final Fare</span>
                <span className="text-base font-extrabold text-navy-900">
                  ₹{booking.finalFare?.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Cash Collected so far</span>
                <span className="text-base font-extrabold text-emerald-600">
                  ₹{booking.amountCollected?.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Outstanding Cash Balance</span>
                <span className="text-base font-extrabold text-brand-600">
                  ₹{Math.max(0, (booking.finalFare || 0) - (booking.amountCollected || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1 leading-relaxed">
              Pay the balance in cash directly to your chauffeur. Please collect your printed or digital trip receipt upon payment.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

