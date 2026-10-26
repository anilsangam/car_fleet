import React from 'react';
import { Banknote, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { FareBreakdown } from '@car-rental/shared';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface FareSummaryCardProps {
  fare?: FareBreakdown | null;
  isLoading?: boolean;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
}

export const FareSummaryCard: React.FC<FareSummaryCardProps> = ({
  fare,
  isLoading,
  termsAccepted,
  onTermsChange,
  onSubmit,
  isSubmitting,
  submitDisabled,
}) => {
  return (
    <Card className="p-6 bg-white shadow-lg border-slate-200 sticky top-28">
      <h3 className="text-base font-bold text-navy-900 pb-3 border-b border-slate-100 flex items-center justify-between">
        <span>Fare Breakdown</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Cash Settlement
        </span>
      </h3>

      {isLoading ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Calculating verified backend fare...</p>
        </div>
      ) : fare ? (
        <div className="py-4 space-y-3 text-xs sm:text-sm">
          {/* Base Fare */}
          <div className="flex justify-between text-slate-600">
            <span>Base Vehicle Fare</span>
            <span className="font-semibold text-slate-900">₹{fare.baseFare.toLocaleString()}</span>
          </div>

          {/* Pricing Rule Description */}
          {fare.appliedRuleName && (
            <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg font-mono">
              Rule: {fare.appliedRuleName}
            </div>
          )}

          {/* Driver Allowance */}
          {fare.driverAllowance > 0 && (
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                Driver Daily Allowance <HelpCircle className="w-3 h-3 text-slate-400" />
              </span>
              <span className="font-semibold text-slate-900">₹{fare.driverAllowance.toLocaleString()}</span>
            </div>
          )}

          {/* Night Surcharge */}
          {fare.nightSurcharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Night Driving Surcharge (10PM-6AM)</span>
              <span className="font-semibold text-slate-900">₹{fare.nightSurcharge.toLocaleString()}</span>
            </div>
          )}

          {/* Tolls & State Taxes */}
          {fare.tollTaxesEstimated > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tolls & Highway Taxes</span>
              <span className="font-semibold text-slate-900">₹{fare.tollTaxesEstimated.toLocaleString()}</span>
            </div>
          )}

          {/* Total Fare Divider */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-navy-900 block">Total Expected Fare</span>
              <span className="text-[11px] text-slate-500">Pay directly to driver</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-brand-600">
                ₹{fare.totalFare.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Select trip locations and vehicle to calculate real-time estimated fare.
        </div>
      )}

      {/* Cash Model Notice Box */}
      <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5">
        <Banknote className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block">100% Cash-on-Arrival:</span>
          No online payments or card numbers needed. Hand over exact cash to the chauffeur upon arrival or trip completion.
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            I confirm travel details and agree to the{' '}
            <a href="/terms" target="_blank" className="text-brand-600 underline font-medium">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/cancellation" target="_blank" className="text-brand-600 underline font-medium">
              Cancellation Policy
            </a>
            .
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="mt-5">
        <Button
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={submitDisabled || !termsAccepted || !fare}
          size="lg"
          className="w-full shadow-md shadow-brand-600/20"
        >
          Submit Booking Request
        </Button>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Your request will be assigned an instant reference ID.
        </p>
      </div>
    </Card>
  );
};

