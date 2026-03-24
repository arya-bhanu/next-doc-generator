'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setLocale('id')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          locale === 'id'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}
