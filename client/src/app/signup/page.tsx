'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Hammer,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { PUBLIC_ROLES, ROLE_DESCRIPTIONS, type PublicRole } from '@/types/auth.types';
import { getRoleDashboardPath } from '@/lib/role-routing';
import { cn } from '@/lib/utils';


interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  password: string;
  confirmPassword: string;
  requestedRole: PublicRole | '';
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  requestedRole?: string;
  general?: string;
}


function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (form.phone && !/^[+\d\s\-().]{7,20}$/.test(form.phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Password must contain at least one uppercase letter.';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Password must contain at least one number.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!form.requestedRole) {
    errors.requestedRole = 'Please select your role.';
  }

  return errors;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Very weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very strong', color: 'bg-emerald-600' };
}


function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string') return error;
  const e = error as Record<string, unknown>;

  if (e.message && typeof e.message === 'string') {
    const msg = e.message.toLowerCase();
    if (msg.includes('email') && (msg.includes('exist') || msg.includes('taken') || msg.includes('already'))) {
      return 'An account with this email address already exists. Please sign in or use a different email.';
    }
    if (msg.includes('invalid') && msg.includes('role')) {
      return 'The selected role is not permitted for public registration.';
    }
    return e.message;
  }
  if (e.error && typeof e.error === 'string') return e.error;
  return 'An unexpected error occurred. Please try again.';
}


function FormField({
  label,
  id,
  required,
  error,
  helperText,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  helperText?: string;
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
      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function TextInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled,
  leftIcon,
  rightElement,
  autoComplete,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          {leftIcon}
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={cn(
          'w-full h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-400/20'
            : 'border-slate-300',
          leftIcon ? 'pl-9' : 'pl-3',
          rightElement ? 'pr-10' : 'pr-3'
        )}
      />
      {rightElement && (
        <div className="absolute right-3 flex items-center">{rightElement}</div>
      )}
    </div>
  );
}

// ─── Main Signup Page ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const uid = useId();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    requestedRole: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear individual error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
     
      const result = await authClient.signUp.email({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        requestedRole: form.requestedRole,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        fetchOptions: {
          credentials: 'include', 
        },
      });

      if (result.error) {
        setErrors({ general: extractErrorMessage(result.error) });
        return;
      }

      const sessionResult = await authClient.getSession();
      if (sessionResult.error || !sessionResult.data?.user) {
        setErrors({
          general:
            'Your account was created, but automatic sign-in could not be completed. Please sign in to continue.',
        });
        return;
      }

      const signedInUser = sessionResult.data.user as { role?: string };
      router.replace(getRoleDashboardPath(signedInUser.role));
      router.refresh();
    } catch (err: unknown) {
      setErrors({ general: extractErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">

        {/* Brand header */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Hammer className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">BuildTrack</span>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Join BuildTrack — your construction project management platform.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Amber accent top bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />

          <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">

            {/* Global error */}
            {errors.general && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Registration Failed</p>
                  <p className="text-xs text-red-700 mt-0.5">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField
                    label="Full Name"
                    id={`${uid}-name`}
                    required
                    error={errors.name}
                  >
                    <TextInput
                      id={`${uid}-name`}
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Enter your full name"
                      error={errors.name}
                      disabled={isSubmitting}
                      autoComplete="name"
                      leftIcon={<User className="h-4 w-4" />}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    label="Email Address"
                    id={`${uid}-email`}
                    required
                    error={errors.email}
                  >
                    <TextInput
                      id={`${uid}-email`}
                      type="email"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="you@company.com"
                      error={errors.email}
                      disabled={isSubmitting}
                      autoComplete="email"
                      leftIcon={<Mail className="h-4 w-4" />}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Phone Number"
                  id={`${uid}-phone`}
                  error={errors.phone}
                  helperText={!errors.phone ? 'Optional' : undefined}
                >
                  <TextInput
                    id={`${uid}-phone`}
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="+880 1XXX XXXXXX"
                    error={errors.phone}
                    disabled={isSubmitting}
                    autoComplete="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                  />
                </FormField>

                <FormField
                  label="Company Name"
                  id={`${uid}-company`}
                  helperText="Optional"
                >
                  <TextInput
                    id={`${uid}-company`}
                    value={form.company}
                    onChange={setField('company')}
                    placeholder="Your organization"
                    disabled={isSubmitting}
                    autoComplete="organization"
                    leftIcon={<Building2 className="h-4 w-4" />}
                  />
                </FormField>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                  <Lock className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Password</h2>
              </div>

              {/* Password */}
              <FormField
                label="Password"
                id={`${uid}-password`}
                required
                error={errors.password}
                helperText={!errors.password ? 'Min 8 chars, one uppercase, one number.' : undefined}
              >
                <TextInput
                  id={`${uid}-password`}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Create a strong password"
                  error={errors.password}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                {/* Password strength bar */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            i <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-xs text-slate-500">
                        Strength:{' '}
                        <span className="font-semibold text-slate-700">
                          {passwordStrength.label}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </FormField>

              {/* Confirm Password */}
              <FormField
                label="Confirm Password"
                id={`${uid}-confirm`}
                required
                error={errors.confirmPassword}
              >
                <TextInput
                  id={`${uid}-confirm`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </FormField>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ── Section: Role Selection ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Select Your Role</h2>
                <span className="text-red-500 text-sm">*</span>
              </div>

              <p className="text-xs text-slate-500 -mt-1">
                Your role will be reviewed by an Administrator. Actual access is granted only after
                approval.
              </p>

              {errors.requestedRole && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.requestedRole}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PUBLIC_ROLES.map((role) => {
                  const isSelected = form.requestedRole === role;
                  return (
                    <label
                      key={role}
                      className={cn(
                        'relative flex flex-col gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none',
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                        isSubmitting && 'pointer-events-none opacity-60'
                      )}
                    >
                      <input
                        type="radio"
                        name="requestedRole"
                        value={role}
                        checked={isSelected}
                        onChange={() => {
                          setForm((prev) => ({ ...prev, requestedRole: role }));
                          setErrors((prev) => ({ ...prev, requestedRole: undefined }));
                        }}
                        disabled={isSubmitting}
                        className="sr-only"
                      />
                      {/* Radio indicator */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{role}</span>
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'border-amber-500 bg-amber-500'
                              : 'border-slate-300 bg-white'
                          )}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Submit Button ── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full h-11 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150',
                  'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-sm border border-amber-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                  'disabled:opacity-60 disabled:pointer-events-none'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Already have account */}
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-400">
            By creating an account, you agree to BuildTrack&apos;s Terms of Service.
          </p>
          <Link href="/" className="text-xs text-slate-500 hover:text-amber-600 font-medium transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
