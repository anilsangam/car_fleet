import React from 'react';
import { Card } from '../../components/common/Card';
import { Banknote, Clock, CheckCircle } from 'lucide-react';

export const CancellationPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Cash Model Policies
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Cancellation & Cash Settlement Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Clear, transparent rules adapted to cash-on-arrival vehicle bookings.
        </p>
      </div>

      <Card className="p-8 bg-white space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Zero Prepayment Required</span>
            <p className="mt-0.5 text-emerald-800">
              Unlike online portals that withhold advance payments, you pay nothing until your vehicle arrives. Therefore, no bank refund cycles or card dispute delays apply.
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">1. Free Cancellation Window</h3>
          <p>
            You may cancel any confirmed trip free of charge up to <strong>4 hours before</strong> your scheduled pickup time. If your flight is delayed or rescheduled, please call our 24x7 dispatch helpline (+91 98765 43210) so we can adjust your chauffeur standby without penalty.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">2. Same-Day or Late Cancellations</h3>
          <p>
            When a vehicle is dispatched and is already en route to your pickup point within 2 hours of departure, fuel and chauffeur allocation costs are incurred. We respectfully request customers notify dispatch immediately if cancellation is unavoidable to allow the chauffeur to return safely to base.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">3. Cash Receipt & Records</h3>
          <p>
            Upon paying the cash fare to your chauffeur, your driver will stamp your trip manifest or issue a digital confirmation code. The administrator records every cash collection in the central system for billing transparency and passenger safety.
          </p>
        </section>
      </Card>
    </div>
  );
};

