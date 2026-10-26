import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck, Car as CarIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { normalizeIndianPhone } from '@car-rental/shared';

export const CustomerLoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validateField = (field: 'identifier' | 'password', value: string) => {
    const errors = { ...fieldErrors };

    if (field === 'identifier') {
      const trimmed = value.trim();
      if (!trimmed) {
        errors.identifier = 'Mobile number or email is required.';
      } else if (trimmed.includes('@')) {
        // Email check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          errors.identifier = 'Please enter a valid email address.';
        } else {
          delete errors.identifier;
        }
      } else {
        // Mobile phone check
        const normalized = normalizeIndianPhone(trimmed);
        if (normalized.length < 10) {
          errors.identifier = 'Please enter a valid 10-digit mobile number or email.';
        } else {
          delete errors.identifier;
        }
      }
    }

    if (field === 'password') {
      if (!value) {
        errors.password = 'Password is required.';
      } else {
        delete errors.password;
      }
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: { identifier?: string; password?: string } = {};
    const trimmedId = identifier.trim();

    if (!trimmedId) {
      errors.identifier = 'Please enter your mobile number or email.';
    }
    if (!password) {
      errors.password = 'Please enter your account password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Normalize identifier if it's a phone number
    const normalizedIdentifier = trimmedId.includes('@')
      ? trimmedId.toLowerCase()
      : normalizeIndianPhone(trimmedId);

    try {
      setIsLoading(true);
      await login(normalizedIdentifier, password);
      toastSuccess('Welcome back! You are now signed in.');
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Customer login error', err);
      // Generic invalid credentials message
      const msg = err?.message || 'Invalid mobile/email or password';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-lg shadow-navy-900/20 group-hover:bg-brand-600 transition-colors">
              <CarIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-navy-900">
              Elite<span className="text-brand-600">Ride</span>
            </span>
          </Link>
        </div>

        <h2 className="mt-6 text-center text-2xl font-black text-navy-900 tracking-tight">
          Customer Sign In
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Sign in with your registered mobile number or email
        </p>

        {searchParams.get('redirect') && (
          <div className="mt-4 mx-2 p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Please sign in or create an account to finalize your booking reservation.</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <Input
                label="Mobile Number or Email"
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                  }
                }}
                onBlur={(e) => validateField('identifier', e.target.value)}
                error={fieldErrors.identifier}
                placeholder="e.g. 9876543210 or name@example.com"
                icon={<User className="w-4 h-4 text-slate-400" />}
                autoComplete="username"
              />
            </div>

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                onBlur={(e) => validateField('password', e.target.value)}
                error={fieldErrors.password}
                placeholder="Enter your account password"
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-md shadow-brand-600/20 mt-2"
              isLoading={isLoading}
              disabled={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Continue
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center text-xs">
            <p className="text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Create Account
              </Link>
            </p>

            <div>
              <Link
                to="/cars"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-navy-900 transition-colors font-medium"
              >
                <CarIcon className="w-3.5 h-3.5" /> Return to browsing fleet
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
