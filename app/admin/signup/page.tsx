'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function AdminSignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    if (!formData.name.trim()) {
      newErrors.name = t('adminSignup.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('adminSignup.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('adminSignup.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('adminSignup.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('adminSignup.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('adminSignup.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('adminSignup.passwordsNotMatch');
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
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || t('adminSignup.registrationFailed') });
        }
        return;
      }

      setSuccessMessage(t('adminSignup.successMessage'));

      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (error) {
      console.error('Admin signup error:', error);
      setErrors({ general: t('adminSignup.unexpectedError') });
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
              {t('adminSignup.adminBadge')}
            </span>
          </div>

          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('adminSignup.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('adminSignup.subtitle')}{' '}
            <Link
              href="/admin/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t('adminSignup.subtitleLink')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    {successMessage}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                    {t('adminSignup.redirectMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('adminSignup.name')} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('adminSignup.namePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('adminSignup.email')} <span className="text-red-500">*</span>
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
                placeholder={t('adminSignup.emailPlaceholder')}
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
                {t('adminSignup.password')} <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('adminSignup.passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('adminSignup.confirmPassword')} <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('adminSignup.confirmPasswordPlaceholder')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? t('adminSignup.creatingAccount')
                : successMessage
                ? t('adminSignup.accountCreated')
                : t('adminSignup.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
