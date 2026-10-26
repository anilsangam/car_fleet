import React from 'react';
import { Card } from '../../components/common/Card';
import { ShieldCheck, Banknote } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Legal Agreement
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Terms & Conditions of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Effective Date: October 2026 • EliteRide Chauffeur Fleet Operations
        </p>
      </div>

      <Card className="p-8 bg-white space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">1. Nature of Business & Single-Owner Fleet</h3>
          <p>
            EliteRide operates as a single commercial fleet enterprise. All vehicles listed on this website are directly owned, insured, and managed by our business. We are not a broker, aggregator, or peer-to-peer ride-sharing marketplace.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">2. Payment Model: 100% Cash-on-Arrival</h3>
          <p>
            Our service operates exclusively on a cash-settlement model. We do not require, store, or process advance credit cards, debit cards, or electronic merchant transactions. The full confirmed fare must be paid in cash directly to your assigned chauffeur upon vehicle arrival or trip completion.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">3. Chauffeur Service & Prohibitions</h3>
          <p>
            Every vehicle reservation is dispatched with an experienced commercial chauffeur holding a valid commercial driving license. Self-driving of our fleet vehicles is strictly prohibited. Smoking, consumption of alcohol, carriage of contraband, or illegal substances is strictly forbidden inside all vehicles.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">4. Tolls, Border Taxes & Parking</h3>
          <p>
            Unless specified as an all-inclusive fixed package quote, all actual state entry permits, toll plaza charges, and commercial airport parking fees are settled directly in cash as per physical/digital receipts.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">5. Passenger Capacity & Luggage Guidelines</h3>
          <p>
            For safety compliance and insurance reasons, passengers must not exceed the certified seating capacity specified for each vehicle category (Sedan: 4 passengers; SUV: 6 passengers; Urbania: 12 passengers). Overloading is strictly denied by our chauffeurs.
          </p>
        </section>
      </Card>
    </div>
  );
};

