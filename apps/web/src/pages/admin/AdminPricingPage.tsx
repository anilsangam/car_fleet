import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { IFareRule, TripType, CarCategory } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminPricingPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [rules, setRules] = useState<IFareRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IFareRule | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    tripType: 'one_way' as TripType,
    carCategory: 'sedan' as CarCategory,
    origin: '',
    destination: '',
    fixedPrice: 3500,
    nightSurcharge: 300,
    driverAllowancePerDay: 400,
    priority: 10,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/pricing');
      if (res.success && Array.isArray(res.data)) {
        setRules(res.data);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch pricing rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      tripType: 'one_way',
      carCategory: 'sedan',
      origin: 'delhi',
      destination: 'agra',
      fixedPrice: 3800,
      nightSurcharge: 300,
      driverAllowancePerDay: 400,
      priority: 10,
      isActive: true,
    });
    setRuleModalOpen(true);
  };

  const handleOpenEditModal = (rule: IFareRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      tripType: rule.tripType,
      carCategory: rule.carCategory || 'sedan',
      origin: rule.origin || '',
      destination: rule.destination || '',
      fixedPrice: rule.fixedPrice || 0,
      nightSurcharge: rule.nightSurcharge || 300,
      driverAllowancePerDay: rule.driverAllowancePerDay || 400,
      priority: rule.priority || 0,
      isActive: rule.isActive,
    });
    setRuleModalOpen(true);
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (!window.confirm(`Delete pricing rule "${name}"?`)) return;
    try {
      await api.delete(`/admin/pricing/${id}`);
      success(`Deleted rule ${name}`);
      fetchRules();
    } catch (err: any) {
      toastError('Failed to delete fare rule');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        fixedPrice: Number(formData.fixedPrice),
        nightSurcharge: Number(formData.nightSurcharge),
        driverAllowancePerDay: Number(formData.driverAllowancePerDay),
        priority: Number(formData.priority),
      };

      if (editingRule) {
        await api.patch(`/admin/pricing/${editingRule._id}`, payload);
        success(`Updated rule ${formData.name}`);
      } else {
        await api.post('/admin/pricing', payload);
        success(`Created rule ${formData.name}`);
      }

      setRuleModalOpen(false);
      fetchRules();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save fare rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Tariff Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Pricing Rules & Packages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure fixed corridor fares, hourly packages, and deterministic pricing precedence.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
          Add Fare Rule
        </Button>
      </div>

      {/* Rules Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Tag}
              title="No pricing rules configured"
              description="Standard vehicle per-km base rates are applied when no custom rules exist."
              actionLabel="Create Fixed Route Rule"
              onAction={handleOpenAddModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Rule Name</th>
                  <th className="py-3.5 px-4 font-bold">Trip Type</th>
                  <th className="py-3.5 px-4 font-bold">Vehicle Category</th>
                  <th className="py-3.5 px-4 font-bold">Corridor / Route</th>
                  <th className="py-3.5 px-4 font-bold">Fixed Tariff</th>
                  <th className="py-3.5 px-4 font-bold">Surcharges</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-900 block">{rule.name}</span>
                      <span className="text-[10px] text-slate-400">Priority: {rule.priority}</span>
                    </td>

                    <td className="py-3.5 px-4 capitalize font-semibold">
                      {rule.tripType?.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4 capitalize">
                      {rule.carCategory ? rule.carCategory.replace('_', ' ') : 'Any Category'}
                    </td>

                    <td className="py-3.5 px-4">
                      {rule.origin && rule.destination ? (
                        <span className="capitalize font-semibold text-slate-800">
                          {rule.origin} ➔ {rule.destination}
                        </span>
                      ) : rule.hourlyPackages ? (
                        <span className="text-slate-500">Hourly Tier Package</span>
                      ) : (
                        <span className="text-slate-400">General Default</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-black text-navy-900 text-sm">
                      {rule.fixedPrice ? (
                        `₹${rule.fixedPrice.toLocaleString()}`
                      ) : rule.hourlyPackages ? (
                        `${rule.hourlyPackages.length} Tiers`
                      ) : (
                        'Per KM'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      <span>Night: ₹{rule.nightSurcharge}</span>
                      <span className="block">Allowance: ₹{rule.driverAllowancePerDay}/day</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {rule.isActive ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Inactive</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100"
                          title="Edit Rule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule._id, rule.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Add / Edit Fare Rule */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={editingRule ? `Edit Rule — ${editingRule.name}` : 'Create New Fixed Fare Rule'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <Input
            label="Rule Name / Corridor Label"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Delhi to Agra Express Fixed Fare"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Trip Type
              </label>
              <select
                value={formData.tripType}
                onChange={(e) => setFormData({ ...formData, tripType: e.target.value as TripType })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              >
                <option value="one_way">One Way</option>
                <option value="round_trip">Round Trip</option>
                <option value="hourly">Hourly Rental</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vehicle Category
              </label>
              <select
                value={formData.carCategory}
                onChange={(e) => setFormData({ ...formData, carCategory: e.target.value as CarCategory })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              >
                <option value="sedan">Executive Sedan</option>
                <option value="suv">Rugged SUV</option>
                <option value="luxury">Ultra Luxury</option>
                <option value="tempo_traveller">Tempo Traveller</option>
                <option value="hatchback">Hatchback</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Origin Keyword (lowercase)"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value.toLowerCase() })}
              placeholder="e.g. delhi"
            />
            <Input
              label="Destination Keyword (lowercase)"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value.toLowerCase() })}
              placeholder="e.g. agra"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Fixed Fare (INR)"
              type="number"
              min={0}
              required
              value={formData.fixedPrice}
              onChange={(e) => setFormData({ ...formData, fixedPrice: Number(e.target.value) })}
            />
            <Input
              label="Night Charge (INR)"
              type="number"
              min={0}
              required
              value={formData.nightSurcharge}
              onChange={(e) => setFormData({ ...formData, nightSurcharge: Number(e.target.value) })}
            />
            <Input
              label="Driver Daily Allowance"
              type="number"
              min={0}
              required
              value={formData.driverAllowancePerDay}
              onChange={(e) => setFormData({ ...formData, driverAllowancePerDay: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Rule Priority (Higher runs first)"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rule Activation
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              >
                <option value="true">Active (Apply in calculation)</option>
                <option value="false">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {editingRule ? 'Save Changes' : 'Create Fare Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

