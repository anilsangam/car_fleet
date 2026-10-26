import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail, Car, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('admin@eliteride.com');
  const [password, setPassword] = useState('Admin@12345');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setLoginError(null);
      await login(email, password);
      success('Welcome back, Administrator!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password';
      setLoginError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@eliteride.com');
    setPassword('Admin@12345');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Elite<span className="text-brand-400">Ride</span> Fleet Admin
        </h2>
        <p className="text-xs text-slate-400">
          Internal operations portal for fleet dispatch, driver scheduling & cash collections.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Card className="py-8 px-6 sm:px-10 bg-white shadow-2xl border-slate-100 rounded-3xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Admin Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eliteride.com"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
            />

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full shadow-md shadow-brand-600/25"
              isLoading={isSubmitting || authLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Fleet Control
            </Button>
          </form>

          {/* Demo Credentials Helper Pill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Default Setup Admin:</span>
                <span className="text-[11px] text-slate-500 font-mono">admin@eliteride.com / Admin@12345</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline"
              >
                Auto-fill
              </button>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HTTP-only secure cookie session with rate limiting enabled</span>
        </p>
      </div>
    </div>
  );
};

