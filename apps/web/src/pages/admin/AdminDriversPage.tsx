import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { IDriver, DriverStatus } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminDriversPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);

  // Upcoming Trips Modal
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [selectedDriverForUpcoming, setSelectedDriverForUpcoming] = useState<IDriver | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    licenseNumber: '',
    experienceYears: 5,
    status: 'active' as DriverStatus,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        status: statusFilter,
        search: searchTerm,
        limit: '50',
      });
      const res = await api.get(`/admin/drivers?${query.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setDrivers(res.data);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch driver roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter]);

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      alternatePhone: '',
      licenseNumber: '',
      experienceYears: 5,
      status: 'active',
      notes: '',
    });
    setDriverModalOpen(true);
  };

  const handleOpenEditModal = (driver: IDriver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      alternatePhone: driver.alternatePhone || '',
      licenseNumber: driver.licenseNumber,
      experienceYears: driver.experienceYears || 5,
      status: driver.status,
      notes: driver.notes || '',
    });
    setDriverModalOpen(true);
  };

  const handleCheckUpcoming = async (driver: IDriver) => {
    try {
      setSelectedDriverForUpcoming(driver);
      const res = await api.get(`/admin/drivers/${driver._id}/upcoming-bookings`);
      if (res.success && Array.isArray(res.data)) {
        setUpcomingTrips(res.data);
        setUpcomingModalOpen(true);
      }
    } catch (err: any) {
      toastError('Failed to fetch driver upcoming schedule');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        experienceYears: Number(formData.experienceYears),
        licenseNumber: formData.licenseNumber.toUpperCase().trim(),
        phone: formData.phone.trim(),
      };

      if (editingDriver) {
        await api.patch(`/admin/drivers/${editingDriver._id}`, payload);
        success(`Updated driver ${formData.name}`);
      } else {
        await api.post('/admin/drivers', payload);
        success(`Added new chauffeur ${formData.name}`);
      }

      setDriverModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active Chauffeur</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      case 'inactive':
        return <Badge variant="danger">Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Chauffeur Roster
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Internal Company Chauffeurs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your dedicated background-verified chauffeurs. Drivers do not have independent logins.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
          Add New Chauffeur
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['all', 'active', 'on_leave', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchDrivers();
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, phone, license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900"
              />
            </div>
            <Button type="submit" size="sm" variant="primary" className="text-xs">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Drivers Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Users}
              title="No drivers registered"
              description="No driver profiles match your search criteria."
              actionLabel="Add Chauffeur"
              onAction={handleOpenAddModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Chauffeur</th>
                  <th className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th className="py-3.5 px-4 font-bold">Commercial License</th>
                  <th className="py-3.5 px-4 font-bold">Experience</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Speciality / Notes</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {driver.name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-navy-900 block">{driver.name}</span>
                          <span className="text-[10px] text-slate-400">Company Employee</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {driver.phone}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      <span className="bg-slate-100 px-2 py-1 rounded">{driver.licenseNumber}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {driver.experienceYears} Years
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(driver.status)}</td>

                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-500">
                      {driver.notes || 'No notes'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCheckUpcoming(driver)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                          title="View Driver Schedule"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(driver)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100"
                          title="Edit Driver Details"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Modal: Add / Edit Driver */}
      <Modal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        title={editingDriver ? `Edit Chauffeur — ${editingDriver.name}` : 'Register New Chauffeur'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <Input
            label="Chauffeur Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Vikram Singh"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Primary Phone Number"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98222 33445"
            />
            <Input
              label="Alternate Emergency Phone"
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              placeholder="e.g. 9811122334"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Commercial Driving License"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="DL-042012008451"
              />
            </div>
            <Input
              label="Experience (Years)"
              type="number"
              min={0}
              max={50}
              required
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Operational Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DriverStatus })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
            >
              <option value="active">Active & Available for Dispatch</option>
              <option value="on_leave">On Scheduled Leave</option>
              <option value="inactive">Inactive / Off Roster</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Specialities, Language Skills or Route Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. English speaking, experienced with luxury Mercedes fleet, hill station certified."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setDriverModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {editingDriver ? 'Save Changes' : 'Register Chauffeur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Driver Upcoming Schedule */}
      <Modal
        isOpen={upcomingModalOpen}
        onClose={() => setUpcomingModalOpen(false)}
        title={`Chauffeur Schedule — ${selectedDriverForUpcoming?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700">
          {upcomingTrips.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">No trips currently assigned</span>
              <span className="text-[11px] text-slate-400">
                This chauffeur is available for new trip assignments.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="font-bold text-navy-900 uppercase tracking-wider block">
                Scheduled Trips ({upcomingTrips.length}):
              </span>
              {upcomingTrips.map((b: any) => (
                <div key={b._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-navy-900 block">{b.bookingReference}</span>
                    <span className="text-slate-500 block">{b.pickupLocation} ➔ {b.destinationLocation || 'Local'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{new Date(b.pickupDateTime).toLocaleString()}</span>
                    <Badge variant="primary" size="sm">{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setUpcomingModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

