import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, Building2, Phone, FileText } from 'lucide-react';
import { IBusinessSettings } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState<IBusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const res = await api.get('/admin/settings');
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err: any) {
        toastError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      const res = await api.put('/admin/settings', {
        ...settings,
        bufferMinutesBetweenTrips: Number(settings.bufferMinutesBetweenTrips),
        advanceBookingHoursRequired: Number(settings.advanceBookingHoursRequired),
        discloseDriverHoursBeforePickup: Number(settings.discloseDriverHoursBeforePickup),
      });

      if (res.success) {
        success('Business configuration updated successfully');
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Business Customization
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Fleet & Business Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure company branding, dispatch coordinates, buffer buffers, and customer policy text.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
        {/* Company Identity & Contact */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Company Brand & Dispatch Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Legal Name"
              required
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
            <Input
              label="Brand Tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
            <Input
              label="24x7 Dispatch Support Phone"
              required
              value={settings.supportPhone}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            />
            <Input
              label="Support Email"
              required
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Physical Office / Garage Hub Address"
                required
                value={settings.officeAddress}
                onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Operational Dispatch Logic */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Scheduling, Turnaround & Driver Safety Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Turnaround Buffer Between Trips (Minutes)"
              type="number"
              min={15}
              max={360}
              required
              value={settings.bufferMinutesBetweenTrips}
              onChange={(e) =>
                setSettings({ ...settings, bufferMinutesBetweenTrips: Number(e.target.value) })
              }
              helperText="Enforced by double-booking engine to sanitize and refuel"
            />

            <Input
              label="Advance Booking Notice Required (Hours)"
              type="number"
              min={0}
              max={48}
              required
              value={settings.advanceBookingHoursRequired}
              onChange={(e) =>
                setSettings({ ...settings, advanceBookingHoursRequired: Number(e.target.value) })
              }
            />

            <Input
              label="Disclose Driver Coordinates to Customer (Hours Pre-Pickup)"
              type="number"
              min={1}
              max={24}
              required
              value={settings.discloseDriverHoursBeforePickup}
              onChange={(e) =>
                setSettings({ ...settings, discloseDriverHoursBeforePickup: Number(e.target.value) })
              }
            />
          </div>
        </Card>

        {/* Customer Policies & Cash Instructions */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Customer-Facing Cash Instructions & Policies</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cash Payment Instructions Box (Rendered on Confirmation & Summary)
            </label>
            <textarea
              rows={2}
              value={settings.cashPaymentInstructions}
              onChange={(e) => setSettings({ ...settings, cashPaymentInstructions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cancellation Policy Text
            </label>
            <textarea
              rows={2}
              value={settings.cancellationPolicyText}
              onChange={(e) => setSettings({ ...settings, cancellationPolicyText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Terms & Conditions Text
            </label>
            <textarea
              rows={3}
              value={settings.termsAndConditionsText}
              onChange={(e) => setSettings({ ...settings, termsAndConditionsText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" size="lg" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            Save Business Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
