import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Briefcase, Gauge, Fuel, ArrowRight } from 'lucide-react';
import { ICar } from '@car-rental/shared';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface CarCardProps {
  car: ICar;
  selectedTripType?: string;
}

export const CarCard: React.FC<CarCardProps> = ({ car, selectedTripType = 'one_way' }) => {
  const navigate = useNavigate();

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'luxury':
        return 'purple';
      case 'suv':
        return 'primary';
      case 'tempo_traveller':
        return 'accent';
      default:
        return 'neutral';
    }
  };

  const handleCardClick = () => {
    navigate(`/cars/${car._id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/cars/${car._id}`);
    }
  };

  return (
    <Card
      hoverEffect
      tabIndex={0}
      role="button"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full bg-white group cursor-pointer border border-slate-200/90 hover:border-brand-500/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      {/* Car Image with Fallback and Category Badge */}
      <div className="relative h-40 sm:h-44 bg-slate-100 overflow-hidden">
        <img
          src={car.primaryImage}
          alt={`${car.brand} ${car.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge variant={getCategoryBadgeVariant(car.category)} size="sm">
            {car.category.replace('_', ' ')}
          </Badge>
          <span className="bg-navy-950/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {car.registrationNumber}
          </span>
        </div>
      </div>

      {/* Card Content - Compact & Clean */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Info */}
          <div className="mb-1">
            <h3 className="text-base font-bold text-navy-900 group-hover:text-brand-600 transition-colors truncate">
              {car.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {car.brand} • {car.year || '2024'} Fleet Model
            </p>
          </div>

          {/* Compact Specs Row */}
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 py-2 my-2 border-y border-slate-100 text-[11px] text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>{car.seatingCapacity} Seats</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-brand-600" />
              <span>{car.luggageCapacity} Bags</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 capitalize">
              <Gauge className="w-3.5 h-3.5 text-brand-600" />
              <span>{car.transmission}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 capitalize">
              <Fuel className="w-3.5 h-3.5 text-brand-600" />
              <span>{car.fuelType}</span>
            </span>
          </div>
        </div>

        {/* Pricing & CTA Actions */}
        <div className="pt-2 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase leading-tight">
              Starting from
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base sm:text-lg font-black text-navy-900">
                ₹{car.baseRatePerKm}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">/km</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Link
              to={`/cars/${car._id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-2.5 py-1 hover:bg-slate-100"
              >
                Details
              </Button>
            </Link>
            <Link
              to={`/booking?carId=${car._id}&tripType=${selectedTripType}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="primary"
                className="text-xs h-8 px-3 py-1 shadow-sm"
                icon={<ArrowRight className="w-3 h-3" />}
              >
                Book
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
