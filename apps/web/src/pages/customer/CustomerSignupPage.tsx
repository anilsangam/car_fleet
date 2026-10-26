import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Car as CarIcon,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  normalizeIndianPhone,
  indianPhoneRegex,
  nameRegex,
} from '@car-rental/shared';

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export const CustomerSignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup } = useCustomerAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validateField = (field: keyof FormErrors, value?: any) => {
    const errors: FormErrors = { ...fieldErrors };

    switch (field) {
      case 'name': {
        const val = (value !== undefined ? value : name).trim();
        if (!val) {
          errors.name = 'Full name is required.';
        } else if (val.length < 2) {
          errors.name = 'Full name must be at least 2 characters.';
        } else if (val.length > 100) {
          errors.name = 'Full name cannot exceed 100 characters.';
        } else if (!nameRegex.test(val)) {
          errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
        } else {
          delete errors.name;
        }
        break;
      }

      case 'phone': {
        const raw = (value !== undefined ? value : phone).trim();
        const normalized = normalizeIndianPhone(raw);
        if (!raw) {
          errors.phone = 'Mobile number is required.';
        } else if (!indianPhoneRegex.test(normalized)) {
          errors.phone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
        } else {
          delete errors.phone;
        }
        break;
      }

      case 'email': {
        const val = (value !== undefined ? value : email).trim();
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors.email = 'Please enter a valid email address.';
        } else {
          delete errors.email;
        }
        break;
      }

      case 'password': {
        const val = value !== undefined ? value : password;
        if (!val) {
          errors.password = 'Password is required.';
        } else if (val.length < 8) {
          errors.password = 'Password must be at least 8 characters long.';
        } else if (val.length > 100) {
          errors.password = 'Password cannot exceed 100 characters.';
        } else {
          delete errors.password;
        }

        // Recheck confirmPassword match if already typed
        if (confirmPassword && val !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match.';
        } else if (confirmPassword && val === confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      }

      case 'confirmPassword': {
        const val = value !== undefined ? value : confirmPassword;
        if (!val) {
          errors.confirmPassword = 'Please confirm your password.';
        } else if (val !== password) {
          errors.confirmPassword = 'Passwords do not match.';
        } else {
          delete errors.confirmPassword;
        }
        break;
      }

      case 'terms': {
        const val = value !== undefined ? value : termsAccepted;
        if (!val) {
          errors.terms = 'You must accept the terms & conditions.';
        } else {
          delete errors.terms;
        }
        break;
      }
    }

    setFieldErrors(errors);
  };

  const validateAll = (): boolean => {
    const errors: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Full name cannot exceed 100 characters.';
    } else if (!nameRegex.test(trimmedName)) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!indianPhoneRegex.test(normalizedPhone)) {
      errors.phone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateAll()) {
      return;
    }

    const cleanPhone = normalizeIndianPhone(phone);

    try {
      setIsLoading(true);
      await signup({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase() || undefined,
        password,
        confirmPassword,
        termsAccepted,
      });

      toastSuccess('Account created successfully! Welcome to EliteRide.');
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Customer signup error', err);
      const msg = err?.message || 'Failed to create account. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/70">
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
          Create Customer Account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Sign up with your mobile number to reserve cars and track trips
        </p>

        {searchParams.get('redirect') && (
          <div className="mt-4 mx-2 p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Create your account to finalize your vehicle reservation.</span>
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
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                onBlur={(e) => validateField('name', e.target.value)}
                error={fieldErrors.name}
                placeholder="e.g. Aarav Sharma"
                icon={<User className="w-4 h-4 text-slate-400" />}
                autoComplete="name"
              />
            </div>

            <div>
              <Input
                label="Mobile Number"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                onBlur={(e) => validateField('phone', e.target.value)}
                error={fieldErrors.phone}
                placeholder="e.g. 9876543210 or +91 98765 43210"
                helperText="10-digit mobile number beginning with 6, 7, 8, or 9"
                icon={<Phone className="w-4 h-4 text-slate-400" />}
                autoComplete="tel"
              />
            </div>

            <div>
              <Input
                label="Email Address (Optional)"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                onBlur={(e) => validateField('email', e.target.value)}
                error={fieldErrors.email}
                placeholder="e.g. name@example.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="Create Password"
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
                helperText="Must be at least 8 characters long"
                placeholder="Minimum 8 characters"
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
                autoComplete="new-password"
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                onBlur={(e) => validateField('confirmPassword', e.target.value)}
                error={fieldErrors.confirmPassword}
                placeholder="Re-enter password"
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />
            </div>

            {/* Terms and Privacy acceptance */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (fieldErrors.terms) {
                      setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                    }
                  }}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="font-semibold text-brand-600 hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className="font-semibold text-brand-600 hover:underline">
                    Privacy Policy
                  </Link>
                  . Fares are settled 100% in cash upon vehicle arrival.
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-md shadow-brand-600/20 mt-2"
              isLoading={isLoading}
              disabled={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Continue
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center text-xs">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Sign In
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
