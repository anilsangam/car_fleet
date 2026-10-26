import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw, Car as CarIcon, AlertCircle, X } from 'lucide-react';
import { ICar, TripType } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { CarCard } from '../../components/customer/CarCard';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const CarsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search query from URL (e.g. from navbar search)
  const searchQuery = searchParams.get('search') || '';

  // Filters from query params or defaults
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all'
  );
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [minSeating, setMinSeating] = useState<string>(searchParams.get('passengers') || 'all');
  const [sortOrder, setSortOrder] = useState<string>('price_asc');

  // Search by Trip Schedule
  const [tripType, setTripType] = useState<TripType>(
    (searchParams.get('tripType') as TripType) || 'one_way'
  );
  const [pickupTime, setPickupTime] = useState<string>(searchParams.get('pickupTime') || '');
  const [returnTime, setReturnTime] = useState<string>(searchParams.get('returnTime') || '');
  const [durationHours, setDurationHours] = useState<string>(
    searchParams.get('duration') || '8'
  );

  const [cars, setCars] = useState<ICar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailabilityFiltered, setIsAvailabilityFiltered] = useState(false);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If user supplied pickup time, verify availability with real backend availability service
      if (pickupTime) {
        setIsAvailabilityFiltered(true);
        const queryParams = new URLSearchParams({
          tripType,
          pickupDateTime: pickupTime,
        });
        if (returnTime && tripType === 'round_trip') queryParams.set('returnDateTime', returnTime);
        if (durationHours && tripType === 'hourly') queryParams.set('durationHours', durationHours);
        if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
        if (minSeating !== 'all') queryParams.set('passengers', minSeating);

        const res = await api.get(`/availability?${queryParams.toString()}`);
        if (res.success && Array.isArray(res.data)) {
          let filtered = res.data;
          if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (c: ICar) =>
                c.name.toLowerCase().includes(sq) ||
                c.brand.toLowerCase().includes(sq) ||
                c.model.toLowerCase().includes(sq) ||
                c.category.toLowerCase().includes(sq)
            );
          }
          if (selectedTransmission !== 'all') {
            filtered = filtered.filter((c: ICar) => c.transmission === selectedTransmission);
          }
          if (sortOrder === 'price_desc') {
            filtered.sort((a: ICar, b: ICar) => b.baseRatePerKm - a.baseRatePerKm);
          } else if (sortOrder === 'seats_desc') {
            filtered.sort((a: ICar, b: ICar) => b.seatingCapacity - a.seatingCapacity);
          } else {
            filtered.sort((a: ICar, b: ICar) => a.baseRatePerKm - b.baseRatePerKm);
          }
          setCars(filtered);
        }
      } else {
        setIsAvailabilityFiltered(false);
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.set('search', searchQuery);
        if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
        if (selectedTransmission !== 'all') queryParams.set('transmission', selectedTransmission);
        if (minSeating !== 'all') queryParams.set('seating', minSeating);
        queryParams.set('sort', sortOrder);

        const res = await api.get(`/cars?${queryParams.toString()}`);
        if (res.success && Array.isArray(res.data)) {
          setCars(res.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching fleet cars', err);
      setError(err?.message || 'Failed to load fleet vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [selectedCategory, selectedTransmission, minSeating, sortOrder, searchQuery]);

  const handleApplyScheduleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCars();
  };

  const handleResetSchedule = () => {
    setPickupTime('');
    setReturnTime('');
    setDurationHours('8');
    setIsAvailabilityFiltered(false);
    // Remove query params
    setSearchParams({});
    setTimeout(fetchCars, 10);
  };

  const categories = [
    { label: 'All Fleet', value: 'all' },
    { label: 'Executive Sedans', value: 'sedan' },
    { label: 'Rugged SUVs', value: 'suv' },
    { label: 'Ultra Luxury', value: 'luxury' },
    { label: 'Vans & Tempo', value: 'tempo_traveller' },
    { label: 'City Hatchbacks', value: 'hatchback' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Direct Fleet Inventory
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Browse Our Chauffeur-Driven Vehicles
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          All vehicles are owned, maintained, and operated directly by our company with dedicated professional chauffeurs.
        </p>
      </div>

      {/* Date & Schedule Availability Checker Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-900 uppercase tracking-wider">
            <Search className="w-4 h-4 text-brand-600" />
            <span>Check Live Vehicle Availability for Your Exact Schedule</span>
          </div>
          {isAvailabilityFiltered && (
            <button
              onClick={handleResetSchedule}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Clear Schedule Filter
            </button>
          )}
        </div>

        <form onSubmit={handleApplyScheduleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Trip Type
            </label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value as TripType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="one_way">One Way Trip</option>
              <option value="round_trip">Round Trip</option>
              <option value="hourly">Hourly Rental</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Pickup Date & Time
            </label>
            <input
              type="datetime-local"
              value={pickupTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {tripType === 'round_trip' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={returnTime}
                min={pickupTime || new Date().toISOString().slice(0, 16)}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ) : tripType === 'hourly' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Rental Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="4">4 Hours Local</option>
                <option value="8">8 Hours Full Day</option>
                <option value="12">12 Hours Extended</option>
                <option value="24">24 Hours</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Estimated Duration
              </label>
              <span className="block text-xs text-slate-400 py-2">
                Standard outstation transit
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Passengers
            </label>
            <select
              value={minSeating}
              onChange={(e) => setMinSeating(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Any Passenger Count</option>
              <option value="4">Up to 4 Passengers</option>
              <option value="6">5 - 6 Passengers (SUV)</option>
              <option value="12">7 - 12 Passengers (Van)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" size="sm" variant="primary" className="w-full h-[38px]">
              Apply Availability
            </Button>
          </div>
        </form>

        {isAvailabilityFiltered && (
          <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-900 flex items-center justify-between">
            <span>
              Showing cars verified as available by the backend scheduler for your selected pickup window.
            </span>
            <span className="font-bold">{cars.length} cars available</span>
          </div>
        )}
      </div>

      {/* Filter Chips & Sorting Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Transmission & Sorting Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Transmission:</span>
            <select
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="seats_desc">Seating Capacity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            <span>
              Searching for: <strong className="font-bold">"{searchQuery}"</strong> ({cars.length} vehicles found)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('search');
              setSearchParams(next);
            }}
            className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900 bg-white px-2.5 py-1 rounded-lg border border-brand-200 shadow-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Search
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={fetchCars} className="ml-auto text-xs py-1">
            Retry
          </Button>
        </div>
      )}

      {/* Grid of Cars */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-[320px] rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <EmptyState
          icon={CarIcon}
          title="No vehicles found matching criteria"
          description={
            isAvailabilityFiltered
              ? 'All fleet vehicles in this category have existing commitments during your requested time slot. Try adjusting your dates or choose another category.'
              : 'Try clearing some of your filters to view more fleet vehicles.'
          }
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedCategory('all');
            setSelectedTransmission('all');
            setMinSeating('all');
            handleResetSchedule();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map((car) => (
            <CarCard key={car._id} car={car} selectedTripType={tripType} />
          ))}
        </div>
      )}
    </div>
  );
};

