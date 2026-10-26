import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, Banknote, RefreshCw } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminReportsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [tripType, setTripType] = useState('all');
  const [status, setStatus] = useState('all');

  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        dateFrom: `${dateFrom}T00:00:00.000Z`,
        dateTo: `${dateTo}T23:59:59.999Z`,
      });
      const res = await api.get(`/admin/reports/metrics?${query.toString()}`);
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      toastError('Failed to fetch reporting metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const query = new URLSearchParams({
        startDate: `${dateFrom}T00:00:00.000Z`,
        endDate: `${dateTo}T23:59:59.999Z`,
        tripType,
        status,
      });

      // Fetch CSV text and trigger client-side download
      const response = await fetch(`/api/v1/admin/reports/export-csv?${query.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('CSV Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eliteride-bookings-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      success('CSV Report exported and downloaded successfully');
    } catch (err: any) {
      toastError(err?.message || 'Error exporting CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Financial & Fleet Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Revenue & Booking Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real database analytics on expected revenue, cash collections, and trip distribution.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleExportCSV}
          isLoading={isExporting}
          icon={<Download className="w-4 h-4" />}
        >
          Export Bookings CSV
        </Button>
      </div>

      {/* Date & Filter Card */}
      <Card className="p-5 bg-white border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchReport();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Trip Type Filter
            </label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            >
              <option value="all">All Trip Types</option>
              <option value="one_way">One Way Trips</option>
              <option value="round_trip">Round Trips</option>
              <option value="hourly">Hourly Rentals</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Booking Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <Button type="submit" size="sm" variant="outline" className="w-full h-[38px]">
              Apply Report Range
            </Button>
          </div>
        </form>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Expected Total Revenue
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-3xl font-black text-navy-900 block">
              ₹{(metrics?.totalExpectedRevenue || 0).toLocaleString()}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Sum of confirmed & active trip quotas</span>
        </Card>

        <Card className="p-6 bg-emerald-50/60 border-emerald-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Verified Cash Collected
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-3xl font-black text-emerald-700 block">
              ₹{(metrics?.totalCashCollected || 0).toLocaleString()}
            </span>
          )}
          <span className="text-[11px] text-emerald-700">Recorded and settled by chauffeurs</span>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Outstanding Cash Balance
          </span>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-3xl font-black text-brand-600 block">
              ₹{(metrics?.totalOutstandingCash || 0).toLocaleString()}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Due upon upcoming trip completion</span>
        </Card>
      </div>

      {/* Volume Summary Table */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-900">Trip Volume Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block mb-1">Confirmed Bookings</span>
            <span className="text-xl font-bold text-navy-900">{metrics?.confirmedBookings || 0}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block mb-1">Completed Trips</span>
            <span className="text-xl font-bold text-emerald-600">{metrics?.completedBookings || 0}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block mb-1">Pending Approval</span>
            <span className="text-xl font-bold text-amber-600">{metrics?.pendingBookings || 0}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block mb-1">Cancelled Trips</span>
            <span className="text-xl font-bold text-rose-600">{metrics?.cancelledBookings || 0}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

