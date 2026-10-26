import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';

// Layouts
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { CarsPage } from './pages/customer/CarsPage';
import { CarDetailPage } from './pages/customer/CarDetailPage';
import { BookingPage } from './pages/customer/BookingPage';
import { BookingConfirmationPage } from './pages/customer/BookingConfirmationPage';
import { BookingStatusPage } from './pages/customer/BookingStatusPage';
import { CustomerLoginPage } from './pages/customer/CustomerLoginPage';
import { CustomerSignupPage } from './pages/customer/CustomerSignupPage';
import { CustomerBookingsPage } from './pages/customer/CustomerBookingsPage';
import { ContactPage } from './pages/customer/ContactPage';
import { TermsPage } from './pages/customer/TermsPage';
import { PrivacyPage } from './pages/customer/PrivacyPage';
import { CancellationPolicyPage } from './pages/customer/CancellationPolicyPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminCarsPage } from './pages/admin/AdminCarsPage';
import { AdminDriversPage } from './pages/admin/AdminDriversPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Customer-Facing Experience */}
                <Route path="/" element={<CustomerLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="cars" element={<CarsPage />} />
                  <Route path="cars/:id" element={<CarDetailPage />} />
                  <Route path="booking" element={<BookingPage />} />
                  <Route path="booking/confirmation" element={<BookingConfirmationPage />} />
                  <Route path="status" element={<BookingStatusPage />} />
                  <Route path="login" element={<CustomerLoginPage />} />
                  <Route path="signup" element={<CustomerSignupPage />} />
                  <Route path="my-bookings" element={<CustomerBookingsPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="cancellation" element={<CancellationPolicyPage />} />
                </Route>

                {/* Admin Login - Dedicated and Separate */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Protected Admin Experience */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="bookings" element={<AdminBookingsPage />} />
                    <Route path="cars" element={<AdminCarsPage />} />
                    <Route path="drivers" element={<AdminDriversPage />} />
                    <Route path="pricing" element={<AdminPricingPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CustomerAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
