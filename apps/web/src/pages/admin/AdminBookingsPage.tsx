import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Filter,
  UserCheck,
  Banknote,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Clock,
  Car,
  Phone,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { IBooking, ICar, IDriver, BookingStatus, PaymentStatus } from '@car-rental/shared';
import { api } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminBookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [tripTypeFilter, setTripTypeFilter] = useState(searchParams.get('tripType') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Active Fleets & Drivers for Assignment
  const [activeCars, setActiveCars] = useState<ICar[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<IDriver[]>([]);

  // Modals state
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<IBooking | null>(null);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [discloseDriver, setDiscloseDriver] = useState(false);
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [bookingForStatus, setBookingForStatus] = useState<IBooking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed');
  const [statusReason, setStatusReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Cash Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingForPayment, setBookingForPayment] = useState<IBooking | null>(null);
  const [finalFare, setFinalFare] = useState(0);
  const [amountCollected, setAmountCollected] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('collected');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        status: statusFilter,
        tripType: tripTypeFilter,
        search: searchTerm,
      });

      const res = await api.get(`/admin/bookings?${query.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
        setTotalBookings(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      toastError(err?.message || 'Error fetching bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentPage, statusFilter, tripTypeFilter]);

  // Load cars and drivers for assignment dropdowns
  useEffect(() => {
    async function loadResources() {
      try {
        const [carsRes, driversRes] = await Promise.all([
          api.get('/admin/cars?status=active&limit=50'),
          api.get('/admin/drivers?status=active&limit=50'),
        ]);
        if (carsRes.success && Array.isArray(carsRes.data)) {
          setActiveCars(carsRes.data);
        }
        if (driversRes.success && Array.isArray(driversRes.data)) {
          setActiveDrivers(driversRes.data);
        }
      } catch (err) {
        console.error('Failed to load fleet resources', err);
      }
    }
    loadResources();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBookings();
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await api.get(`/admin/bookings/${id}`);
      if (res.success && res.data) {
        setSelectedBookingDetails(res.data);
        setDetailsModalOpen(true);
      }
    } catch (err: any) {
      toastError('Failed to load booking details');
    }
  };

  const handleAccept = async (id: string, ref: string) => {
    try {
      const res = await api.post(`/admin/bookings/${id}/accept`);
      if (res.success) {
        success(`Booking ${ref} confirmed successfully`);
        fetchBookings();
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to accept booking. Vehicle schedule conflict detected.');
    }
  };

  const handleOpenAssignModal = (b: IBooking) => {
    setBookingToAssign(b);
    setSelectedCarId(b.carId?.toString() || '');
    setSelectedDriverId(b.driverId?.toString() || '');
    setDiscloseDriver(b.discloseDriverToCustomer || false);
    setAssignNotes(b.statusNotes || '');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingToAssign) return;

    try {
      setIsAssigning(true);
      const res = await api.post(`/admin/bookings/${bookingToAssign._id}/assign`, {
        carId: selectedCarId,
        driverId: selectedDriverId || undefined,
        discloseDriverToCustomer: discloseDriver,
        notes: assignNotes,
      });

      if (res.success) {
        success(`Assigned vehicle & driver for ${bookingToAssign.bookingReference}`);
        setAssignModalOpen(false);
        fetchBookings();
      }
    } catch (err: any) {
      toastError(err?.message || 'Assignment failed. Check for schedule conflicts.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenStatusModal = (b: IBooking) => {
    setBookingForStatus(b);
    setNewStatus(b.status === 'pending' ? 'confirmed' : b.status);
    setStatusReason('');
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForStatus) return;

    try {
      setIsUpdatingStatus(true);
      const res = await api.patch(`/admin/bookings/${bookingForStatus._id}/status`, {
        status: newStatus,
        reason: statusReason,
        notes: statusNotes,
      });

      if (res.success) {
        success(`Status updated to ${newStatus}`);
        setStatusModalOpen(false);
        fetchBookings();
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenPaymentModal = (b: IBooking) => {
    setBookingForPayment(b);
    setFinalFare(b.finalFare || b.expectedFare);
    setAmountCollected(b.amountCollected || b.expectedFare);
    setPaymentStatus('collected');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForPayment) return;

    try {
      setIsRecordingPayment(true);
      const res = await api.post(`/admin/bookings/${bookingForPayment._id}/payment`, {
        finalFare: Number(finalFare),
        amountCollected: Number(amountCollected),
        paymentStatus,
        notes: paymentNotes,
      });

      if (res.success) {
        success('Cash collection recorded successfully');
        setPaymentModalOpen(false);
        fetchBookings();
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to record cash payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="primary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="accent">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
            Dispatch Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Bookings & Fleet Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review requests, prevent double-booking, assign internal chauffeurs, and record cash collections.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBookings}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Reload Bookings
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reference, customer, route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" size="sm" variant="primary" className="text-xs">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={CalendarCheck}
              title="No bookings found"
              description="No booking records match the chosen search criteria or status filter."
              actionLabel="Clear Filters"
              onAction={() => {
                setStatusFilter('all');
                setTripTypeFilter('all');
                setSearchTerm('');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Reference</th>
                  <th className="py-3.5 px-4 font-bold">Customer</th>
                  <th className="py-3.5 px-4 font-bold">Pickup Time</th>
                  <th className="py-3.5 px-4 font-bold">Trip Route</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Car</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Chauffeur</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Cash Payable</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Reference */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-navy-900 block">
                        {b.bookingReference}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {b.tripType?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{b.customerPhone}</span>
                    </td>

                    {/* Pickup Time */}
                    <td className="py-3.5 px-4">
                      <span className="block font-semibold text-slate-900">
                        {new Date(b.pickupDateTime).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(b.pickupDateTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <span className="block truncate font-semibold">{b.pickupLocation}</span>
                      {b.destinationLocation && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          ➔ {b.destinationLocation}
                        </span>
                      )}
                    </td>

                    {/* Car */}
                    <td className="py-3.5 px-4">
                      {b.carDetails ? (
                        <div>
                          <span className="font-semibold block text-slate-800">
                            {b.carDetails.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-navy-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            {b.carDetails.registrationNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Driver */}
                    <td className="py-3.5 px-4">
                      {b.driverDetails ? (
                        <div>
                          <span className="font-semibold block text-slate-800">
                            {b.driverDetails.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.discloseDriverToCustomer ? (
                              <span className="text-emerald-600 font-bold">Disclosed</span>
                            ) : (
                              'Hidden from customer'
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">Needs Driver</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>

                    {/* Cash */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-900 block">
                        ₹{(b.finalFare || b.expectedFare)?.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-emerald-600 block">
                        Collected: ₹{(b.amountCollected || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs py-1 px-2.5"
                            onClick={() => handleAccept(b._id, b.bookingReference)}
                          >
                            Accept
                          </Button>
                        )}

                        <button
                          onClick={() => handleOpenAssignModal(b)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100"
                          title="Assign Car & Driver"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenPaymentModal(b)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                          title="Record Cash Collection"
                        >
                          <Banknote className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenStatusModal(b)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Change Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDetails(b._id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                          title="View Full Booking Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalBookings}
          itemsPerPage={15}
        />
      </Card>

      {/* Modal 1: Booking Details Dossier */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Booking Dossier — ${selectedBookingDetails?.booking?.bookingReference}`}
        maxWidth="2xl"
      >
        {selectedBookingDetails && (
          <div className="space-y-6 text-xs text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
            {/* Passenger & Status Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Customer</span>
                <span className="text-sm font-bold text-navy-900">
                  {selectedBookingDetails.booking.customerName}
                </span>
                <span className="text-slate-500 block">
                  {selectedBookingDetails.booking.customerPhone} • {selectedBookingDetails.booking.customerEmail || 'No email provided'}
                </span>
              </div>
              <div>{getStatusBadge(selectedBookingDetails.booking.status)}</div>
            </div>

            {/* Journey Spec */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-0.5">Pickup Location</span>
                <span className="font-semibold block">{selectedBookingDetails.booking.pickupLocation}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Destination</span>
                <span className="font-semibold block">{selectedBookingDetails.booking.destinationLocation || 'Local City Route'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Scheduled Pickup</span>
                <span className="font-semibold block">
                  {new Date(selectedBookingDetails.booking.pickupDateTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Service Interval With Buffer</span>
                <span className="font-mono text-[11px] block">
                  {new Date(selectedBookingDetails.booking.serviceInterval?.start).toLocaleTimeString()} to{' '}
                  {new Date(selectedBookingDetails.booking.serviceInterval?.end).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Special instructions */}
            {selectedBookingDetails.booking.specialInstructions && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold block mb-0.5">Passenger Special Instructions:</span>
                <p>{selectedBookingDetails.booking.specialInstructions}</p>
              </div>
            )}

            {/* Itemized Fare Snapshot */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-navy-900 uppercase tracking-wider block mb-2">
                Applied Fare Snapshot (Frozen at Booking)
              </span>
              <div className="flex justify-between">
                <span>Base Fare:</span>
                <span className="font-bold">₹{selectedBookingDetails.booking.fareBreakdown?.baseFare}</span>
              </div>
              {selectedBookingDetails.booking.fareBreakdown?.driverAllowance > 0 && (
                <div className="flex justify-between">
                  <span>Driver Daily Allowance:</span>
                  <span className="font-bold">₹{selectedBookingDetails.booking.fareBreakdown?.driverAllowance}</span>
                </div>
              )}
              {selectedBookingDetails.booking.fareBreakdown?.nightSurcharge > 0 && (
                <div className="flex justify-between">
                  <span>Night Driving Surcharge:</span>
                  <span className="font-bold">₹{selectedBookingDetails.booking.fareBreakdown?.nightSurcharge}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-sm text-navy-900">
                <span>Total Expected Cash:</span>
                <span>₹{selectedBookingDetails.booking.finalFare}</span>
              </div>
            </div>

            {/* Status Change Audit History */}
            <div>
              <span className="font-bold text-navy-900 uppercase tracking-wider block mb-2">
                Status Audit Trail
              </span>
              <div className="space-y-2">
                {selectedBookingDetails.history?.map((h: any) => (
                  <div key={h._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {h.fromStatus} ➔ {h.toStatus}
                      </span>
                      <span className="text-slate-400 block text-[11px]">{h.reason || 'Status updated'}</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <span>{h.changedBy}</span>
                      <span className="block">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Receipts History */}
            {selectedBookingDetails.payments && selectedBookingDetails.payments.length > 0 && (
              <div>
                <span className="font-bold text-navy-900 uppercase tracking-wider block mb-2">
                  Recorded Cash Collections
                </span>
                <div className="space-y-2">
                  {selectedBookingDetails.payments.map((p: any) => (
                    <div key={p._id} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                      <div>
                        <span className="font-bold">₹{p.amount.toLocaleString()} Cash Received</span>
                        <span className="text-[11px] text-emerald-700 block">Collected by: {p.collectedBy}</span>
                      </div>
                      <span className="text-[11px] text-emerald-700">{new Date(p.collectedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal 2: Assign Car & Driver */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Resources — ${bookingToAssign?.bookingReference}`}
        maxWidth="md"
      >
        {bookingToAssign && (
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Scheduled Service Interval:</span>
              <span className="font-bold text-navy-900">
                {new Date(bookingToAssign.pickupDateTime).toLocaleString()}
              </span>
            </div>

            {/* Car Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Assign Vehicle *
              </label>
              <select
                required
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Active Vehicle --</option>
                {activeCars.map((car) => (
                  <option key={car._id} value={car._id}>
                    {car.name} ({car.registrationNumber}) — {car.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Assign Internal Chauffeur
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Unassigned / Assign Later --</option>
                {activeDrivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({driver.phone}) — {driver.experienceYears}y exp
                  </option>
                ))}
              </select>
            </div>

            {/* Disclose Driver Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discloseDriver}
                  onChange={(e) => setDiscloseDriver(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-slate-700 font-semibold">
                  Disclose Driver Name & Mobile to Customer now
                </span>
              </label>
              <p className="text-[11px] text-slate-400 ml-6">
                If unchecked, driver details remain private until the standard 3-hour pre-pickup window.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Dispatch Notes
              </label>
              <textarea
                rows={2}
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Optional internal dispatcher notes..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isAssigning}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Update Booking Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Status — ${bookingForStatus?.bookingReference}`}
        maxWidth="sm"
      >
        {bookingForStatus && (
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Target Booking Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">Trip In Progress</option>
                <option value="completed">Completed & Settled</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected / Declined</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Reason / Note for Customer & Audit
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Flight rescheduled, or Customer confirmed via phone."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isUpdatingStatus}>
                Update Status
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 4: Record Cash Payment */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Cash Settlement — ${bookingForPayment?.bookingReference}`}
        maxWidth="sm"
      >
        {bookingForPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
              <span className="font-bold block">Cash-Only Billing Protocol:</span>
              Verify the cash collected by your chauffeur before updating final fare accounts.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Final Agreed Fare (INR)
              </label>
              <input
                type="number"
                required
                min={0}
                value={finalFare}
                onChange={(e) => setFinalFare(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Total Cash Amount Collected (INR)
              </label>
              <input
                type="number"
                required
                min={0}
                value={amountCollected}
                onChange={(e) => setAmountCollected(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold text-emerald-700 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
              >
                <option value="collected">Collected in Full (100% Cash)</option>
                <option value="partially_collected">Partially Collected</option>
                <option value="pending">Payment Still Pending</option>
                <option value="refunded_or_waived">Waived / Adjusted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Payment Notes / Receipt No.
              </label>
              <input
                type="text"
                placeholder="e.g. Receipt #DL-8492 issued by Driver Vikram"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isRecordingPayment}>
                Save Payment Record
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

