import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car as CarIcon,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  ShieldCheck,
  User,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { IBooking, BookingStatus } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const CustomerBookingsPage: React.FC = () => {
  const { customer, isCustomerAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isCustomerAuthenticated) {
      navigate('/login?redirect=/my-bookings', { replace: true });
    }
  }, [isAuthLoading, isCustomerAuthenticated, navigate]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/customer/bookings');
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to load customer bookings', err);
      setError(err?.message || 'Could not load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCustomerAuthenticated) {
      fetchBookings();
    }
  }, [isCustomerAuthenticated]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="primary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="neutral">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="danger">Unavailable</Badge>;
      default:
        return <Badge variant="warning">Pending Dispatch</Badge>;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            My Bookings & Trip History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{customer?.name}</span> ({customer?.phone})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Link to="/booking">
            <Button size="sm" variant="primary" icon={<CarIcon className="w-3.5 h-3.5" />}>
              Book New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            Try Again
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="You have not placed any car bookings yet. Browse our premium fleet and reserve your chauffeur-driven vehicle."
          actionLabel="Browse Fleet & Book"
          onAction={() => navigate('/cars')}
          icon={CarIcon}
        />
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => (
            <Card key={booking._id} className="p-5 sm:p-6 bg-white hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-black text-navy-900 tracking-tight">
                    {booking.bookingReference}
                  </span>
                  {getStatusBadge(booking.status)}
                  <span className="text-xs text-slate-400 capitalize">
                    {booking.tripType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      Fare (Cash on Arrival)
                    </span>
                    <span className="text-lg font-black text-navy-900">
                      ₹{(booking.finalFare || booking.expectedFare).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Body Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
                {/* Route & Times */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Pickup</span>
                      <span className="font-semibold text-slate-800">{booking.pickupLocation}</span>
                    </div>
                  </div>

                  {booking.destinationLocation && (
                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Destination</span>
                        <span className="font-semibold text-slate-800">{booking.destinationLocation}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      Pickup: {new Date(booking.pickupDateTime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Assigned Vehicle */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CarIcon className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-slate-800">
                      {booking.carDetails?.name || 'Assigned Fleet Vehicle'}
                    </span>
                  </div>
                  <div className="text-slate-500 space-y-1">
                    <p>Registration: <span className="font-semibold text-slate-700">{booking.carDetails?.registrationNumber || 'Assigned upon dispatch'}</span></p>
                    <p>Capacity: {booking.carDetails?.seatingCapacity || booking.passengerCount} Seater</p>
                  </div>
                </div>

                {/* Driver / Payment Status */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {booking.discloseDriverToCustomer && booking.driverDetails ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="font-bold block flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Chauffeur Assigned
                        </span>
                        <span>{booking.driverDetails.name} • {booking.driverDetails.phone}</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>Chauffeur contact disclosed prior to pickup.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>
                        Payment Status:{' '}
                        <span className="font-semibold text-slate-700 capitalize">
                          {booking.paymentStatus.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/status?ref=${encodeURIComponent(booking.bookingReference)}&phone=${encodeURIComponent(booking.customerPhone)}`}
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Track Live Booking Status
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
