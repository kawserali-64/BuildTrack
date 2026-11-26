'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Hammer,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { getRoleDashboardPath } from '@/lib/role-routing';
import { cn } from '@/lib/utils';


function mapAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const e = error as Record<string, unknown>;
  const msg = (e.message as string | undefined)?.toLowerCase() ?? '';
  const status = e.status as number | undefined;

  if (status === 401 || msg.includes('invalid') || msg.includes('credentials') || msg.includes('password') || msg.includes('email')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (status === 403 || msg.includes('pending')) {
    return 'Your account is not yet active. Please contact an Administrator.';
  }
  if (msg.includes('reject')) {
    return 'Your account registration was not approved. Please contact support.';
  }
  if (msg.includes('suspend')) {
    return 'Your account has been suspended. Please contact an Administrator.';
  }
  if (e.message && typeof e.message === 'string') {
    return e.message;
  }
  return 'Login failed. Please try again.';
}


function FormField({
  label,
  id,
  required,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
        fetchOptions: {
          credentials: 'include', 
        },
      });

      if (result.error) {
        setError(mapAuthError(result.error));
        return;
      }

      if (result.data?.user) {
        const user = result.data.user as Record<string, unknown>;
        const status = user.status as string | undefined;

        if (status && !['active', 'approved'].includes(status)) {
          if (status === 'pending') {
            setError('Your account is awaiting Administrator approval. Please wait for activation.');
          } else if (status === 'rejected') {
            setError('Your account registration was not approved. Please contact support.');
          } else if (status === 'suspended') {
            setError('Your account has been suspended. Please contact an Administrator.');
          } else {
            setError(`Account access denied (status: ${status}).`);
          }
          await authClient.signOut();
          return;
        }

        router.replace(getRoleDashboardPath(typeof user.role === 'string' ? user.role : undefined));
        router.refresh(); 
      } else {
        setError('Login failed: No user data returned. Please try again.');
      }
    } catch (err: unknown) {
      console.error('[login] Unexpected error:', err);
      setError('Cannot connect to the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Hammer className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">BuildTrack</span>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Access your construction project management workspace.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />

          <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-5">

            {/* Global error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Login Failed</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <FormField label="Email Address" id="login-email" required error={fieldErrors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="you@company.com"
                  disabled={isLoading}
                  autoComplete="email"
                  className={cn(
                    'w-full h-10 rounded-lg border bg-white pl-9 pr-3 text-sm text-slate-900 transition-colors',
                    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
                    'disabled:cursor-not-allowed disabled:bg-slate-50',
                    fieldErrors.email ? 'border-red-400' : 'border-slate-300'
                  )}
                />
              </div>
            </FormField>

            {/* Password */}
            <FormField label="Password" id="login-password" required error={fieldErrors.password}>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="Your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={cn(
                    'w-full h-10 rounded-lg border bg-white pl-9 pr-10 text-sm text-slate-900 transition-colors',
                    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
                    'disabled:cursor-not-allowed disabled:bg-slate-50',
                    fieldErrors.password ? 'border-red-400' : 'border-slate-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-amber-500"
                />
                <span>Keep me signed in</span>
              </label>
              <span className="text-slate-400 text-xs">Secure session via HttpOnly cookie</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-11 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150',
                'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-sm border border-amber-600',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                'disabled:opacity-60 disabled:pointer-events-none'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Signup link */}
            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-2"
              >
                Create account
              </Link>
            </p>
          </form>
        </div>

        {/* Security note */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Secured by Better Auth · Sessions expire in 7 days</span>
        </div>

        <div className="mt-3 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-amber-600 font-medium transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
