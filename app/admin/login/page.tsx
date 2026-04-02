'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = t('adminLogin.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('adminLogin.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('adminLogin.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Step 1 – Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: t('adminLogin.invalidCredentials') });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: t('adminLogin.emailNotConfirmed') });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      if (!data.user || !data.session) {
        setErrors({ general: t('adminLogin.unexpectedError') });
        return;
      }

      // Step 2 – Server-side role check via ops_user table
      const roleRes = await fetch('/api/auth/check-role', {
        method: 'GET',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!roleRes.ok) {
        await supabase.auth.signOut();
        const roleData = await roleRes.json().catch(() => ({}));
        setErrors({ general: roleData?.message ?? t('adminLogin.unexpectedError') });
        return;
      }

      const roleData = await roleRes.json();
      if (roleData.role !== 'admin') {
        await supabase.auth.signOut();
        setErrors({ general: t('adminLogin.notAdmin') });
        return;
      }

      // Step 3 – Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ general: t('adminLogin.unexpectedError') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Admin badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              {t('adminLogin.adminBadge')}
            </span>
          </div>

          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('adminLogin.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('adminLogin.subtitle')}{' '}
            <Link
              href="/admin/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t('adminLogin.subtitleLink')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('adminLogin.email')} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('adminLogin.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('adminLogin.password')} <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('adminLogin.passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('adminLogin.signingIn') : t('adminLogin.signin')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('adminLogin.terms')}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
