import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Search,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Gauge,
  Fuel,
  Users,
} from 'lucide-react';
import { ICar, CarCategory, CarStatus, FuelType, Transmission } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminCarsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [cars, setCars] = useState<ICar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<ICar | null>(null);

  // Upcoming Bookings Modal
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [selectedCarForUpcoming, setSelectedCarForUpcoming] = useState<ICar | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'sedan' as CarCategory,
    registrationNumber: '',
    seatingCapacity: 4,
    luggageCapacity: 2,
    transmission: 'manual' as Transmission,
    fuelType: 'diesel' as FuelType,
    primaryImage: '',
    description: '',
    baseRatePerKm: 14,
    baseRatePerHour: 250,
    fixedRatePerDay: 2800,
    status: 'active' as CarStatus,
    year: 2024,
    color: 'White',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        category: categoryFilter,
        search: searchTerm,
        limit: '50',
      });
      const res = await api.get(`/admin/cars?${query.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setCars(res.data);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch fleet inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [categoryFilter]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setEditingCar(null);
    setFormData({
      name: '',
      brand: '',
      model: '',
      category: 'sedan',
      registrationNumber: '',
      seatingCapacity: 4,
      luggageCapacity: 2,
      transmission: 'manual',
      fuelType: 'diesel',
      primaryImage: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
      description: 'Well-maintained, chauffeur-driven luxury vehicle.',
      baseRatePerKm: 15,
      baseRatePerHour: 280,
      fixedRatePerDay: 2800,
      status: 'active',
      year: 2024,
      color: 'White',
    });
    setCarModalOpen(true);
  };

  const handleOpenEditModal = (car: ICar) => {
    setFieldErrors({});
    setEditingCar(car);
    setFormData({
      name: car.name,
      brand: car.brand,
      model: car.model || '',
      category: car.category,
      registrationNumber: car.registrationNumber,
      seatingCapacity: car.seatingCapacity,
      luggageCapacity: car.luggageCapacity,
      transmission: car.transmission,
      fuelType: car.fuelType,
      primaryImage: car.primaryImage,
      description: car.description,
      baseRatePerKm: car.baseRatePerKm,
      baseRatePerHour: car.baseRatePerHour,
      fixedRatePerDay: car.fixedRatePerDay,
      status: car.status,
      year: car.year || 2024,
      color: car.color || 'White',
    });
    setCarModalOpen(true);
  };

  const handleCheckUpcoming = async (car: ICar) => {
    try {
      setSelectedCarForUpcoming(car);
      const res = await api.get(`/admin/cars/${car._id}/upcoming-bookings`);
      if (res.success && Array.isArray(res.data)) {
        setUpcomingBookings(res.data);
        setUpcomingModalOpen(true);
      }
    } catch (err: any) {
      toastError('Failed to check upcoming car bookings');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side quick validation to prevent unnecessary bad requests
    const localErrors: Record<string, string> = {};
    if (!formData.name.trim()) localErrors.name = 'Vehicle display name is required';
    if (!formData.brand.trim()) localErrors.brand = 'Brand / Make is required';
    if (!formData.model.trim()) localErrors.model = 'Model is required (e.g. Camry, Innova, Swift)';
    if (!formData.registrationNumber.trim()) localErrors.registrationNumber = 'Registration number is required';
    if (!formData.primaryImage.trim()) localErrors.primaryImage = 'Photo URL is required';
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      localErrors.description = 'Description must be at least 10 characters';
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      toastError('Please correct the highlighted fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        seatingCapacity: Number(formData.seatingCapacity),
        luggageCapacity: Number(formData.luggageCapacity),
        baseRatePerKm: Number(formData.baseRatePerKm),
        baseRatePerHour: Number(formData.baseRatePerHour),
        fixedRatePerDay: Number(formData.fixedRatePerDay),
        year: Number(formData.year || 2024),
        color: formData.color.trim() || 'White',
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        primaryImage: formData.primaryImage.trim(),
        description: formData.description.trim(),
        amenities: ['ac', 'water_bottle', 'charger', 'bluetooth'],
      };

      if (editingCar) {
        await api.patch(`/admin/cars/${editingCar._id}`, payload);
        success(`Updated vehicle "${formData.name}" successfully`);
      } else {
        await api.post('/admin/cars', payload);
        success(`Added new vehicle "${formData.name}" to fleet`);
      }

      setCarModalOpen(false);
      fetchCars();
    } catch (err: any) {
      console.error('Failed to save vehicle:', err);
      if (err?.errors && typeof err.errors === 'object' && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
        toastError(err.message || 'Please correct the highlighted fields.');
      } else {
        toastError(err?.message || 'Failed to save vehicle');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: CarStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'under_maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
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
            Fleet Asset Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Company-Owned Fleet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your fleet of 20–50 owned cars, update operational status, and inspect upcoming assignments.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
          Add New Vehicle
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['all', 'sedan', 'suv', 'luxury', 'tempo_traveller', 'hatchback'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCars();
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search car, model, reg plate..."
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

      {/* Cars Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Car}
              title="No fleet vehicles found"
              description="No vehicles match the selected filter."
              actionLabel="Add Vehicle"
              onAction={handleOpenAddModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Vehicle</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Registration Plate</th>
                  <th className="py-3.5 px-4 font-bold">Specs</th>
                  <th className="py-3.5 px-4 font-bold">Base Rates</th>
                  <th className="py-3.5 px-4 font-bold">Operational Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cars.map((car) => (
                  <tr key={car._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={car.primaryImage}
                          alt={car.name}
                          className="w-14 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div>
                          <span className="font-bold text-navy-900 block">{car.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {car.brand} • Year {car.year || '2024'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 capitalize font-semibold">
                      {car.category?.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-navy-900 bg-slate-100 px-2 py-1 rounded">
                        {car.registrationNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px] text-slate-500">
                        <span>{car.seatingCapacity} seats • {car.luggageCapacity} bags</span>
                        <span className="block capitalize">{car.transmission} • {car.fuelType}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-900 block">₹{car.baseRatePerKm}/km</span>
                      <span className="text-[11px] text-slate-400">₹{car.baseRatePerHour}/hr</span>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(car.status)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCheckUpcoming(car)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                          title="View Scheduled Trips Before Deactivation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(car)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100"
                          title="Edit Vehicle Details"
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

      {/* Modal: Add / Edit Car */}
      <Modal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        title={editingCar ? `Edit Vehicle — ${editingCar.name}` : 'Add New Vehicle to Fleet'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Vehicle Display Name"
              required
              value={formData.name}
              error={fieldErrors.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Toyota Camry Hybrid"
            />
            <Input
              label="Brand / Make"
              required
              value={formData.brand}
              error={fieldErrors.brand}
              onChange={(e) => {
                setFormData({ ...formData, brand: e.target.value });
                if (fieldErrors.brand) setFieldErrors((prev) => ({ ...prev, brand: undefined }));
              }}
              placeholder="e.g. Toyota"
            />
            <Input
              label="Model"
              required
              value={formData.model}
              error={fieldErrors.model}
              onChange={(e) => {
                setFormData({ ...formData, model: e.target.value });
                if (fieldErrors.model) setFieldErrors((prev) => ({ ...prev, model: undefined }));
              }}
              placeholder="e.g. Camry"
              helperText="Vehicle model line"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value as CarCategory });
                  if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`w-full bg-white border ${
                  fieldErrors.category ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-300'
                } rounded-xl p-2.5 text-xs text-slate-900 font-medium`}
              >
                <option value="sedan">Executive Sedan</option>
                <option value="suv">Rugged SUV</option>
                <option value="luxury">Ultra Luxury</option>
                <option value="tempo_traveller">Tempo Traveller / Van</option>
                <option value="hatchback">City Hatchback</option>
              </select>
              {fieldErrors.category && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.category}</p>
              )}
            </div>

            <Input
              label="Registration Number"
              required
              value={formData.registrationNumber}
              error={fieldErrors.registrationNumber}
              onChange={(e) => {
                setFormData({ ...formData, registrationNumber: e.target.value });
                if (fieldErrors.registrationNumber) {
                  setFieldErrors((prev) => ({ ...prev, registrationNumber: undefined }));
                }
              }}
              placeholder="DL01-CA-1001"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  setFormData({ ...formData, status: e.target.value as CarStatus });
                  if (fieldErrors.status) setFieldErrors((prev) => ({ ...prev, status: undefined }));
                }}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              >
                <option value="active">Active & Bookable</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="inactive">Inactive / Out of Fleet</option>
              </select>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              label="Seating Capacity"
              type="number"
              min={1}
              max={25}
              required
              value={formData.seatingCapacity}
              error={fieldErrors.seatingCapacity}
              onChange={(e) => {
                setFormData({ ...formData, seatingCapacity: Number(e.target.value) });
                if (fieldErrors.seatingCapacity) {
                  setFieldErrors((prev) => ({ ...prev, seatingCapacity: undefined }));
                }
              }}
            />
            <Input
              label="Luggage Bags"
              type="number"
              min={0}
              max={20}
              required
              value={formData.luggageCapacity}
              error={fieldErrors.luggageCapacity}
              onChange={(e) => {
                setFormData({ ...formData, luggageCapacity: Number(e.target.value) });
                if (fieldErrors.luggageCapacity) {
                  setFieldErrors((prev) => ({ ...prev, luggageCapacity: undefined }));
                }
              }}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Transmission
              </label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value as Transmission })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fuel Type
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input
              label="Rate / KM (₹)"
              type="number"
              required
              min={0}
              value={formData.baseRatePerKm}
              error={fieldErrors.baseRatePerKm}
              onChange={(e) => {
                setFormData({ ...formData, baseRatePerKm: Number(e.target.value) });
                if (fieldErrors.baseRatePerKm) {
                  setFieldErrors((prev) => ({ ...prev, baseRatePerKm: undefined }));
                }
              }}
            />
            <Input
              label="Hourly Rate (₹)"
              type="number"
              required
              min={0}
              value={formData.baseRatePerHour}
              error={fieldErrors.baseRatePerHour}
              onChange={(e) => {
                setFormData({ ...formData, baseRatePerHour: Number(e.target.value) });
                if (fieldErrors.baseRatePerHour) {
                  setFieldErrors((prev) => ({ ...prev, baseRatePerHour: undefined }));
                }
              }}
            />
            <Input
              label="Day Rate (₹)"
              type="number"
              required
              min={0}
              value={formData.fixedRatePerDay}
              error={fieldErrors.fixedRatePerDay}
              onChange={(e) => {
                setFormData({ ...formData, fixedRatePerDay: Number(e.target.value) });
                if (fieldErrors.fixedRatePerDay) {
                  setFieldErrors((prev) => ({ ...prev, fixedRatePerDay: undefined }));
                }
              }}
            />
            <Input
              label="Model Year"
              type="number"
              min={2000}
              max={2035}
              value={formData.year}
              error={fieldErrors.year}
              onChange={(e) => {
                setFormData({ ...formData, year: Number(e.target.value) });
                if (fieldErrors.year) {
                  setFieldErrors((prev) => ({ ...prev, year: undefined }));
                }
              }}
            />
            <Input
              label="Color"
              value={formData.color}
              error={fieldErrors.color}
              onChange={(e) => {
                setFormData({ ...formData, color: e.target.value });
                if (fieldErrors.color) {
                  setFieldErrors((prev) => ({ ...prev, color: undefined }));
                }
              }}
              placeholder="e.g. White"
            />
          </div>

          <Input
            label="Photo URL (High Resolution)"
            required
            type="url"
            value={formData.primaryImage}
            error={fieldErrors.primaryImage}
            onChange={(e) => {
              setFormData({ ...formData, primaryImage: e.target.value });
              if (fieldErrors.primaryImage) {
                setFieldErrors((prev) => ({ ...prev, primaryImage: undefined }));
              }
            }}
            placeholder="https://images.unsplash.com/..."
            helperText="Direct public HTTPS image link for vehicle display"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Vehicle Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="e.g. Executive German sedan with ambient lighting, plush leather seating and tinted privacy glass."
              className={`w-full bg-white border ${
                fieldErrors.description ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-300'
              } rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFieldErrors({});
                setCarModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
              {editingCar ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Upcoming Bookings Before Deactivation */}
      <Modal
        isOpen={upcomingModalOpen}
        onClose={() => setUpcomingModalOpen(false)}
        title={`Upcoming Bookings — ${selectedCarForUpcoming?.name} (${selectedCarForUpcoming?.registrationNumber})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="text-slate-500">
            Review existing confirmed or in-progress trips for this vehicle before updating its status to under maintenance or inactive.
          </p>

          {upcomingBookings.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">No upcoming bookings scheduled</span>
              <span className="text-[11px] text-slate-400">
                It is safe to mark this vehicle as under maintenance or take it offline.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  This car has <strong>{upcomingBookings.length}</strong> active / confirmed scheduled trip(s)! Reassign them before deactivating.
                </span>
              </div>

              {upcomingBookings.map((b: any) => (
                <div key={b._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-navy-900 block">{b.bookingReference}</span>
                    <span className="text-slate-500 block">{b.customerName} • {b.pickupLocation}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{new Date(b.pickupDateTime).toLocaleDateString()}</span>
                    <Badge variant="success" size="sm">{b.status}</Badge>
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

