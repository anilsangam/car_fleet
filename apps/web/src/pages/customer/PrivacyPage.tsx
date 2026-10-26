import React from 'react';
import { Card } from '../../components/common/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Data Protection
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Effective Date: October 2026 • EliteRide
        </p>
      </div>

      <Card className="p-8 bg-white space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">1. Information We Collect</h3>
          <p>
            When you submit a car reservation request without an account, we collect only the necessary information required for operational trip fulfillment: your name, contact mobile phone number, optional email for receipt dispatch, and pickup/destination coordinates.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">2. No Payment Card Data Collected</h3>
          <p>
            Because we operate strictly on a cash-settlement model upon arrival, we never solicit, capture, process, or store credit card numbers, debit card details, CVVs, or online bank login credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">3. How Your Information Is Used</h3>
          <p>
            Your contact details are used solely by our internal dispatch coordinators to confirm vehicle availability, dispatch your assigned chauffeur, and communicate critical itinerary updates or safety details.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-navy-900">4. Driver Information Disclosure</h3>
          <p>
            To preserve chauffeur security while ensuring passenger peace of mind, chauffeur contact coordinates are released via the secure booking status tracker within the designated safety window (typically 3 hours prior to scheduled departure).
          </p>
        </section>
      </Card>
    </div>
  );
};

