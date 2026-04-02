import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ================================================================ */}
      {/* Header / Navigation                                              */}
      {/* ================================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-4.5 h-4.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">
              BRI <span className="text-blue-700">Smart DocGen</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      {/* ================================================================ */}
      {/* Hero Section                                                     */}
      {/* ================================================================ */}
      <section className="pt-16 min-h-screen relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-blue-800">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-48 -right-48 w-125 h-125 rounded-full bg-blue-700/25 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full bg-blue-600/20 blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ---- Left: Text ---- */}
            <div className="text-white order-2 lg:order-1">
              {/* BRI Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-400/15 border border-yellow-400/30 rounded-full text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                PT Bank Rakyat Indonesia (Persero) Tbk
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.1] mb-6">
                Portal{' '}
                <span className="text-yellow-400">Smart Document</span>
                <br />
                Generator
              </h1>

              <p className="text-blue-200 text-lg leading-relaxed mb-10 max-w-lg">
                Solusi cerdas untuk otomatisasi pembuatan, pengelolaan, dan distribusi dokumen nasabah BRI secara efisien dan terintegrasi.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold rounded-xl shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Masuk Sekarang
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Buka Dashboard
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                {[
                  { value: '100+', label: 'Template Dokumen' },
                  { value: '24/7', label: 'Akses Kapan Saja' },
                  { value: '99%', label: 'Keandalan Sistem' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl sm:text-3xl font-extrabold text-yellow-400">{stat.value}</p>
                    <p className="text-xs text-blue-300 mt-1 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Right: Hero Image ---- */}
            <div className="relative order-1 lg:order-2">
              {/* Main image card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80"
                  alt="Smart Document Management BRI"
                  width={900}
                  height={600}
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-blue-950/60 via-transparent to-transparent" />
              </div>

              {/* Floating card – success */}
              <div className="absolute -bottom-5 -left-4 sm:-left-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3.5 flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Dokumen Terkirim</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Berhasil diproses</p>
                </div>
              </div>

              {/* Floating card – QR */}
              <div className="absolute -top-5 -right-4 sm:-right-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3.5 flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">QR Code Siap</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Scan untuk akses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg
            viewBox="0 0 1440 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 72L60 65C120 58 240 44 360 42.7C480 41.3 600 52 720 54.7C840 57.3 960 52 1080 46.7C1200 41.3 1320 36 1380 33.3L1440 30V72H0Z"
              className="fill-white dark:fill-gray-950"
            />
          </svg>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Features Section                                                 */}
      {/* ================================================================ */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Fitur Unggulan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
              Dibangun untuk memenuhi kebutuhan operasional BRI dengan teknologi terkini
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
              <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&q=80"
                  alt="Otomatisasi Dokumen"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Otomatisasi Dokumen</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Generate dokumen otomatis dari template Google Docs menggunakan data nasabah secara real-time.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
              <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src="https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80"
                  alt="QR Code dan Distribusi"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-700 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">QR Code & Distribusi</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Distribusikan formulir ke nasabah via QR Code, WhatsApp, atau SMS dalam satu klik.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
              <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
                  alt="Manajemen Terpusat"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-700 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Manajemen Terpusat</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pantau sesi formulir, riwayat dokumen, dan data nasabah dari satu dashboard terintegrasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Footer                                                           */}
      {/* ================================================================ */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">BRI Smart DocGen</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            © {new Date().getFullYear()} PT Bank Rakyat Indonesia (Persero) Tbk. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              Masuk
            </Link>
            <Link href="/dashboard" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/login" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
