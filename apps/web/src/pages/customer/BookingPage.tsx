import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Compass,
  Car as CarIcon,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Banknote,
  CheckCircle,
} from 'lucide-react';
import { TripType, ICar, FareBreakdown } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Skeleton } from '../../components/common/Skeleton';
import { FareSummaryCard } from '../../components/customer/FareSummaryCard';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer, isCustomerAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  // Redirect to login if customer is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isCustomerAuthenticated) {
      const currentUrl = `/booking${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [isAuthLoading, isCustomerAuthenticated, navigate]);

  // Form State
  const [tripType, setTripType] = useState<TripType>(
    (searchParams.get('tripType') as TripType) || 'one_way'
  );
  const [pickupLocation, setPickupLocation] = useState(
    searchParams.get('pickup') || 'Aerocity Terminal 3, New Delhi'
  );
  const [destinationLocation, setDestinationLocation] = useState(
    searchParams.get('dest') || 'Taj Mahal, Agra'
  );

  const initialPickup = searchParams.get('pickupTime');
  const [pickupDate, setPickupDate] = useState(() => {
    if (initialPickup) return initialPickup.split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState(() => {
    if (initialPickup && initialPickup.includes('T')) return initialPickup.split('T')[1].slice(0, 5);
    return '09:00';
  });

  const initialReturn = searchParams.get('returnTime');
  const [returnDate, setReturnDate] = useState(() => {
    if (initialReturn) return initialReturn.split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [returnTime, setReturnTime] = useState(() => {
    if (initialReturn && initialReturn.includes('T')) return initialReturn.split('T')[1].slice(0, 5);
    return '18:00';
  });

  const [durationHours, setDurationHours] = useState(
    Number(searchParams.get('duration')) || 8
  );
  const [passengerCount, setPassengerCount] = useState(
    Number(searchParams.get('passengers')) || 2
  );

  const initialCarId = searchParams.get('carId') || '';
  const [selectedCarId, setSelectedCarId] = useState<string>(initialCarId);
  const [fleetCars, setFleetCars] = useState<Array<ICar & { isAvailable?: boolean; isOriginalSelection?: boolean }>>([]);
  const [selectedCarUnavailable, setSelectedCarUnavailable] = useState(false);
  const [originalCarName, setOriginalCarName] = useState('');

  // Customer Contact State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Available Cars & Fare State
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Autofill customer contact info from logged in account
  useEffect(() => {
    if (customer) {
      if (!customerName) setCustomerName(customer.name);
      if (!customerPhone) setCustomerPhone(customer.phone);
      if (!customerEmail && customer.email) setCustomerEmail(customer.email);
    }
  }, [customer]);

  // 2. Fetch fleet options: Exactly 4 cars (Original selection + 3 similar budget alternatives)
  useEffect(() => {
    async function fetchFleetOptions() {
      try {
        setIsLoadingCars(true);
        const pickupDateTime = `${pickupDate}T${pickupTime}`;
        const returnDateTime = tripType === 'round_trip' ? `${returnDate}T${returnTime}` : undefined;

        const targetCarId = selectedCarId || initialCarId;

        if (targetCarId) {
          const query = new URLSearchParams({
            tripType,
            pickupDateTime,
            passengers: passengerCount.toString(),
          });
          if (returnDateTime) query.set('returnDateTime', returnDateTime);
          if (tripType === 'hourly') query.set('durationHours', durationHours.toString());

          const res = await api.get(`/cars/${targetCarId}/alternatives?${query.toString()}`);
          if (res.success && res.data?.allOptions) {
            setFleetCars(res.data.allOptions);
            if (!selectedCarId) {
              setSelectedCarId(res.data.selectedCar?._id);
            }
            if (res.data.selectedCar?.isAvailable === false) {
              setSelectedCarUnavailable(true);
              setOriginalCarName(res.data.selectedCar.name);
            } else {
              setSelectedCarUnavailable(false);
            }
            return;
          }
        }

        // Fallback: fetch available fleet cars and limit to top 4 options
        const res = await api.get('/cars');
        if (res.success && Array.isArray(res.data)) {
          const fourCars = res.data.slice(0, 4);
          setFleetCars(fourCars);
          if (!selectedCarId && fourCars.length > 0) {
            setSelectedCarId(fourCars[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching vehicle options', err);
      } finally {
        setIsLoadingCars(false);
      }
    }

    fetchFleetOptions();
  }, [
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    tripType,
    durationHours,
    passengerCount,
  ]);

  // 2. Automatically calculate estimated fare on server when details or vehicle changes
  useEffect(() => {
    async function calculateFare() {
      if (!selectedCarId || !pickupLocation) return;
      if (tripType !== 'hourly' && !destinationLocation) return;

      try {
        setIsCalculatingFare(true);
        const pickupDateTime = `${pickupDate}T${pickupTime}`;
        const returnDateTime = tripType === 'round_trip' ? `${returnDate}T${returnTime}` : undefined;

        const res = await api.post('/estimate', {
          tripType,
          carId: selectedCarId,
          pickupLocation,
          destinationLocation: tripType !== 'hourly' ? destinationLocation : undefined,
          pickupDateTime,
          returnDateTime,
          durationHours: tripType === 'hourly' ? durationHours : undefined,
        });

        if (res.success && res.data) {
          setFareBreakdown(res.data);
        }
      } catch (err) {
        console.error('Fare estimate error', err);
      } finally {
        setIsCalculatingFare(false);
      }
    }

    calculateFare();
  }, [
    tripType,
    selectedCarId,
    pickupLocation,
    destinationLocation,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    durationHours,
  ]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!pickupLocation.trim()) errors.pickupLocation = 'Pickup location is required';
    if (tripType !== 'hourly' && !destinationLocation.trim()) {
      errors.destinationLocation = 'Destination is required for one-way and round trips';
    }
    if (!selectedCarId) errors.carId = 'Please select a vehicle from our fleet';
    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = 'Please enter your full name';
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      errors.customerPhone = 'Valid 10-digit mobile number required';
    }
    if (!termsAccepted) {
      errors.terms = 'You must accept the terms & conditions';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async () => {
    if (!validateForm()) {
      toastError('Please complete all required fields correctly.');
      return;
    }

    const currentCar = fleetCars.find((c) => c._id === selectedCarId);
    if (currentCar && currentCar.isAvailable === false) {
      toastError(`The vehicle "${currentCar.name}" is unavailable during the requested time window. Please select an available alternative car.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const pickupDateTime = `${pickupDate}T${pickupTime}`;
      const returnDateTime = tripType === 'round_trip' ? `${returnDate}T${returnTime}` : undefined;

      const payload = {
        tripType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        pickupLocation: pickupLocation.trim(),
        destinationLocation: tripType !== 'hourly' ? destinationLocation.trim() : undefined,
        pickupDateTime,
        returnDateTime,
        durationHours: tripType === 'hourly' ? durationHours : undefined,
        passengerCount,
        carId: selectedCarId,
        specialInstructions: specialInstructions.trim() || undefined,
        termsAccepted: true,
      };

      const res = await api.post('/bookings', payload);

      if (res.success && res.data) {
        toastSuccess('Booking request created successfully!');
        navigate('/booking/confirmation', {
          state: {
            booking: res.data.booking,
            bookingReference: res.data.bookingReference,
            otpCode: res.data.otpCode,
          },
        });
      }
    } catch (err: any) {
      console.error('Booking submission failed', err);
      toastError(err?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCar = (car: any) => {
    setSelectedCarId(car._id);
    if (car.isAvailable === false) {
      setSelectedCarUnavailable(true);
      setOriginalCarName(car.name);
    } else {
      setSelectedCarUnavailable(false);
    }
  };

  const selectedCar = fleetCars.find((c) => c._id === selectedCarId);

  if (isAuthLoading || !isCustomerAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          Direct Fleet Reservation
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Reserve Your Chauffeur-Driven Car
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Complete the form below to lock in your trip. Fares are calculated deterministically on our server. 100% Cash-on-Arrival.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Sections (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Trip Details */}
          <Card className="p-6 bg-white space-y-5">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Trip & Journey Information</span>
            </h3>

            {/* Trip Type Selector */}
            <div className="flex gap-2 pb-2">
              {[
                { type: 'one_way', label: 'One Way Outstation' },
                { type: 'round_trip', label: 'Round Trip Tour' },
                { type: 'hourly', label: 'Hourly Local Rental' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setTripType(item.type as TripType)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    tripType === item.type
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Pickup Location"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Airport Terminal 3, New Delhi"
                error={formErrors.pickupLocation}
                icon={<MapPin className="w-4 h-4" />}
              />

              {tripType !== 'hourly' ? (
                <Input
                  label="Destination Location"
                  required
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder="e.g. Hotel Clarks Shiraz, Agra"
                  error={formErrors.destinationLocation}
                  icon={<Compass className="w-4 h-4" />}
                />
              ) : (
                <Select
                  label="Rental Package Duration"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                >
                  <option value={4}>4 Hours / 40 KM Local</option>
                  <option value={8}>8 Hours / 80 KM Full Day</option>
                  <option value={12}>12 Hours / 120 KM Extended</option>
                  <option value={24}>24 Hours / 250 KM Standby</option>
                </Select>
              )}
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Pickup Date & Time *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="time"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {tripType === 'round_trip' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Return Date & Time *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={returnDate}
                      min={pickupDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="time"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Passengers
                </label>
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4 Passengers (Sedan)</option>
                  <option value={6}>5 - 6 Passengers (SUV)</option>
                  <option value={12}>7 - 12 Passengers (Van)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Vehicle Selection (4 Curated Options) */}
          <Card className="p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Fleet Vehicle</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                4 Options: Selected car + 3 budget alternatives
              </span>
            </div>

            {/* Vehicle Scheduling Alert if car is unavailable */}
            {selectedCarUnavailable && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Vehicle Scheduling Alert:</span>
                  <span>
                    {originalCarName || 'The chosen car'} is currently committed to another confirmed trip during this travel window. Please select one of our verified available alternatives below to proceed.
                  </span>
                </div>
              </div>
            )}

            {isLoadingCars ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {fleetCars.map((car) => {
                  const isSelected = selectedCarId === car._id;
                  const isAvailable = car.isAvailable !== false;

                  return (
                    <div
                      key={car._id}
                      onClick={() => handleSelectCar(car)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-brand-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={car.primaryImage}
                          alt={car.name}
                          className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80';
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-sm font-bold text-navy-900 truncate block">
                              {car.name}
                            </span>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                            <span className="capitalize font-semibold text-slate-700">
                              {car.category.replace('_', ' ')}
                            </span>
                            <span>•</span>
                            <span>{car.seatingCapacity} Seats</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAvailable ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Available for Trip
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                                Time Conflict
                              </span>
                            )}
                            {car.isOriginalSelection && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                Original Pick
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Tariff Rate</span>
                          <span className="text-sm font-extrabold text-navy-900">
                            ₹{car.baseRatePerKm}/km
                          </span>
                        </div>

                        <div>
                          {isSelected ? (
                            <span className="text-xs font-bold text-brand-700 bg-brand-100/90 px-3 py-1 rounded-lg inline-flex items-center gap-1">
                              Selected Vehicle
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCar(car);
                              }}
                              className="text-xs font-semibold text-slate-700 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1 rounded-lg transition-colors border border-slate-200"
                            >
                              Select This Car
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {formErrors.carId && <p className="text-xs text-rose-600 font-medium">{formErrors.carId}</p>}
          </Card>

          {/* Section 3: Customer Information */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Passenger Contact Information</span>
            </h3>
            <p className="text-xs text-slate-500">
              Trip reserved under your authenticated customer account ({customer?.phone}). Fares are settled 100% in cash upon arrival.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                error={formErrors.customerName}
                icon={<User className="w-4 h-4" />}
              />

              <Input
                label="Mobile Number (10 digits)"
                required
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                error={formErrors.customerPhone}
                icon={<Phone className="w-4 h-4" />}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Email Address (Optional)"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. name@example.com (for digital receipt copy)"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Special Instructions / Flight Number
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Flight AI-102 landing at 08:30 AM, need English-speaking chauffeur with luggage carrier."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sticky Column: Live Fare Summary (4 Cols) */}
        <div className="lg:col-span-4">
          <FareSummaryCard
            fare={fareBreakdown}
            isLoading={isCalculatingFare}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onSubmit={handleBookingSubmit}
            isSubmitting={isSubmitting}
            submitDisabled={!selectedCarId}
          />
        </div>
      </div>
    </div>
  );
};

