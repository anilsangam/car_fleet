import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, ArrowRight, Compass } from 'lucide-react';
import { TripType } from '@car-rental/shared';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../common/Button';

export const QuickBookingForm: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tripType, setTripType] = useState<TripType>('one_way');
  const [pickupLocation, setPickupLocation] = useState('Aerocity T3, New Delhi');
  const [destinationLocation, setDestinationLocation] = useState('Taj Mahal, Agra');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [returnTime, setReturnTime] = useState('18:00');
  const [durationHours, setDurationHours] = useState(8);
  const [passengerCount, setPassengerCount] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pickupDateTime = `${pickupDate}T${pickupTime}`;
    const returnDateTime = tripType === 'round_trip' ? `${returnDate}T${returnTime}` : undefined;

    const queryParams = new URLSearchParams({
      tripType,
      pickup: pickupLocation,
      dest: tripType !== 'hourly' ? destinationLocation : '',
      pickupTime: pickupDateTime,
      passengers: passengerCount.toString(),
    });

    if (returnDateTime) {
      queryParams.set('returnTime', returnDateTime);
    }
    if (tripType === 'hourly') {
      queryParams.set('duration', durationHours.toString());
    }

    navigate(`/cars?${queryParams.toString()}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-5 sm:p-7 relative z-10">
      {/* Trip Type Tabs */}
      <div className="flex border-b border-slate-100 pb-4 mb-6 gap-2 sm:gap-3 overflow-x-auto">
        {(['one_way', 'round_trip', 'hourly'] as TripType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              tripType === type
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {t.tripType[type]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pickup Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.bookingForm.pickupLocation}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder={t.bookingForm.pickupLocationPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Destination Location (for one-way and round trips) */}
          {tripType !== 'hourly' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.bookingForm.destinationLocation}
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder={t.bookingForm.destinationLocationPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.bookingForm.hourlyPackage}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                >
                  <option value={4}>4 Hours / 40 km Local City</option>
                  <option value={8}>8 Hours / 80 km Full Day</option>
                  <option value={12}>12 Hours / 120 km Extended Tour</option>
                  <option value={24}>24 Hours / Full Day Standby</option>
                </select>
              </div>
            </div>
          )}

          {/* Pickup Date & Time */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.bookingForm.pickupDateTime}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Return Date / Passenger count */}
          {tripType === 'round_trip' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.bookingForm.returnDateTime}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={returnDate}
                    min={pickupDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                  <input
                    type="time"
                    required
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.bookingForm.passengerCount}
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={4}>3 - 4 Passengers (Sedan)</option>
                  <option value={6}>5 - 6 Passengers (SUV)</option>
                  <option value={12}>7 - 12 Passengers (Van / Tempo)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time availability directly checked against fleet dispatch</span>
          </div>

          <Button type="submit" size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
            Search Fleet & View Rates
          </Button>
        </div>
      </form>
    </div>
  );
};

