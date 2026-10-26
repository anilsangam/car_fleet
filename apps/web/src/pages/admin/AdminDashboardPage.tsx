import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  CalendarCheck,
  Clock,
  Banknote,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { DashboardMetrics, IBooking } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingBookings, setPendingBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      let query = '';
      const now = new Date();
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = `?dateFrom=${startOfDay}`;
      } else if (dateFilter === 'week') {
        const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = `?dateFrom=${pastWeek}`;
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = `?dateFrom=${startOfMonth}`;
      }

      const [metricsRes, pendingRes] = await Promise.all([
        api.get(`/admin/reports/metrics${query}`),
        api.get('/admin/bookings?status=pending&limit=5'),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (pendingRes.success && Array.isArray(pendingRes.data)) {
        setPendingBookings(pendingRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard metrics', err);
      toastError(err?.message || 'Error loading dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const handleQuickAccept = async (id: string, ref: string) => {
    try {
      const res = await api.post(`/admin/bookings/${id}/accept`);
      if (res.success) {
        success(`Booking ${ref} confirmed successfully!`);
        loadData();
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to accept booking. Check vehicle schedule conflict.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Live Fleet Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Dispatcher Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex rounded-xl bg-white border border-slate-200 p-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === f.id
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total & Available Fleet */}
        <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Fleet Utilization</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Car className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-navy-900">{metrics?.availableCars || 0}</span>
              <span className="text-xs text-slate-400">/ {metrics?.totalCars || 0} Cars Available</span>
            </div>
          )}
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{metrics?.unavailableCars || 0} under maintenance or inactive</span>
          </div>
        </Card>

        {/* Pending Requests Alert */}
        <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 uppercase">Pending Requests</span>
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mb-2" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900">
                {metrics?.pendingBookings || 0}
              </span>
              <span className="text-xs font-semibold text-amber-700">Awaiting Action</span>
            </div>
          )}
          <Link
            to="/admin/bookings?status=pending"
            className="mt-3 text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            Review Pending Requests <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Confirmed Upcoming & Active */}
        <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Confirmed & Active</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-navy-900">
                {metrics?.confirmedBookings || 0}
              </span>
              <span className="text-xs text-slate-400">
                Scheduled ({metrics?.inProgressBookings || 0} on road)
              </span>
            </div>
          )}
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{metrics?.completedBookings || 0} completed trips</span>
          </div>
        </Card>

        {/* Cash Collected vs Outstanding */}
        <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Cash Settlements</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28 mb-2" />
          ) : (
            <div>
              <span className="text-2xl font-black text-emerald-600">
                ₹{(metrics?.totalCashCollected || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Outstanding: ₹{(metrics?.totalOutstandingCash || 0).toLocaleString()}
              </span>
            </div>
          )}
          <Link
            to="/admin/reports"
            className="mt-3 text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Detailed Cash Flow & Export <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Urgent Action Section: Pending Booking Requests */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <span>Urgent Booking Requests Requiring Confirmation</span>
              {pendingBookings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {pendingBookings.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer itineraries, re-verify vehicle schedule availability, and confirm dispatch.
            </p>
          </div>
          <Link to="/admin/bookings">
            <Button variant="outline" size="sm">
              View All Bookings
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <span className="font-semibold text-slate-800 block">All caught up!</span>
            <span>There are no pending booking requests awaiting review right now.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Pickup Time</th>
                  <th className="py-3 px-3">Trip Route</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Fare</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-navy-900">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <span className="text-[11px] text-slate-400">{b.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3">
                      {new Date(b.pickupDateTime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate">
                      <span className="font-semibold block truncate">{b.pickupLocation}</span>
                      {b.destinationLocation && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          ➔ {b.destinationLocation}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="block font-semibold text-slate-800">
                        {b.carDetails?.name || 'Selected Car'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.carDetails?.registrationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-navy-900">
                      ₹{b.expectedFare?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs py-1 px-3"
                          onClick={() => handleQuickAccept(b._id, b.bookingReference)}
                        >
                          Accept
                        </Button>
                        <Link to={`/admin/bookings?search=${b.bookingReference}`}>
                          <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Operational Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link to="/admin/cars" className="block">
          <Card hoverEffect className="p-5 bg-white space-y-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900">Fleet Inventory</h4>
                <p className="text-xs text-slate-500">Add or manage vehicles, maintenance statuses</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/drivers" className="block">
          <Card hoverEffect className="p-5 bg-white space-y-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900">Chauffeur Rosters</h4>
                <p className="text-xs text-slate-500">Manage internal drivers, licenses & schedules</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/pricing" className="block">
          <Card hoverEffect className="p-5 bg-white space-y-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900">Tariffs & Packages</h4>
                <p className="text-xs text-slate-500">Configure fixed routes and hourly packages</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

