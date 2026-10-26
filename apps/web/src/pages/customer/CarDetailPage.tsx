import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Gauge,
  Fuel,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Banknote,
  ArrowRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { ICar } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { Card } from '../../components/common/Card';

export const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [car, setCar] = useState<ICar | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCar() {
      try {
        setIsLoading(true);
        const res = await api.get(`/cars/${id}`);
        if (res.success && res.data) {
          setCar(res.data);
          setActiveImage(res.data.primaryImage);
        } else {
          setError('Vehicle not found or inactive');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadCar();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="h-[420px] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-navy-900">Vehicle Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested vehicle may be under maintenance or no longer part of our active fleet.
        </p>
        <Link to="/cars">
          <Button variant="primary">Return to Fleet Overview</Button>
        </Link>
      </div>
    );
  }

  const allImages = [car.primaryImage, ...(car.images || [])].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/cars" className="hover:text-brand-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Fleet
        </Link>
        <span>/</span>
        <span className="capitalize">{car.category.replace('_', ' ')}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{car.name}</span>
      </div>

      {/* Main Vehicle Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative h-[340px] sm:h-[450px] bg-slate-900 rounded-3xl overflow-hidden shadow-md">
            <img
              src={activeImage}
              alt={car.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="purple" size="md">
                {car.category.replace('_', ' ')}
              </Badge>
              <span className="bg-navy-950/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                {car.registrationNumber}
              </span>
            </div>
          </div>

          {/* Thumbnail list */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImage === img ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Banner */}
          <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Directly Owned Vehicle • Commercial GPS & Speed Governor Fitted</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-brand-600" />
              <span>100% Cash-on-Arrival</span>
            </div>
          </div>
        </div>

        {/* Specifications & Booking Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 mb-1 uppercase tracking-wider">
              <span>{car.brand}</span>
              <span>•</span>
              <span>Model Year {car.year || '2024'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {car.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              {car.description}
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Users className="w-4 h-4 text-brand-600" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Capacity</span>
                <span className="font-bold">{car.seatingCapacity} Passengers</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Luggage</span>
                <span className="font-bold">{car.luggageCapacity} Large Bags</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Gauge className="w-4 h-4 text-brand-600" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Transmission</span>
                <span className="font-bold capitalize">{car.transmission}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Fuel className="w-4 h-4 text-brand-600" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Fuel</span>
                <span className="font-bold capitalize">{car.fuelType}</span>
              </div>
            </div>
          </div>

          {/* Amenities checklist */}
          {car.amenities && car.amenities.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Included Vehicle Amenities
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                {car.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="capitalize">{amenity.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparent Pricing Matrix Card */}
          <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">
              Standard Tariff Card
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Outstation Rate</span>
                <span className="font-extrabold text-navy-900">₹{car.baseRatePerKm} / km</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Hourly Local Rate</span>
                <span className="font-extrabold text-navy-900">₹{car.baseRatePerHour} / hour</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Full Day Standby</span>
                <span className="font-extrabold text-navy-900">₹{car.fixedRatePerDay} / day</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200">
              <Link to={`/booking?carId=${car._id}`}>
                <Button size="lg" className="w-full shadow-md shadow-brand-600/20" icon={<ArrowRight className="w-4 h-4" />}>
                  Book This Car Now
                </Button>
              </Link>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                100% Cash Settlement upon vehicle arrival
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

