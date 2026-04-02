'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import LanguageToggle from '@/components/LanguageToggle';
import { QRCodeSVG } from 'qrcode.react';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading } = useAuthCheck();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrData, setQrData] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // ---------------------------------------------------------------------------
  // Ops on-login form
  // ---------------------------------------------------------------------------
  interface OpsField {
    label: string;
    variable: string;
    answer: string;
  }
  const [showOpsFormModal, setShowOpsFormModal] = useState(false);
  const [opsFields, setOpsFields] = useState<OpsField[]>([]);
  const [isSubmittingOps, setIsSubmittingOps] = useState(false);
  const [opsFormError, setOpsFormError] = useState('');
  // Full-screen loading while create-form (long-running) is in progress
  const [isGenerating, setIsGenerating] = useState(false);
  // When true, the ops form submit only calls submit-form (no create-form)
  const [editOpsOnly, setEditOpsOnly] = useState(false);
  // Set of variable names whose answer is empty (for inline validation)
  const [opsFieldErrors, setOpsFieldErrors] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Form Sessions (form_sessions table)
  // ---------------------------------------------------------------------------
  interface DocDetail {
    doc_temp_title: string;
    doc_id: string;
    original_title: string;
  }
  interface FormSession {
    id: string;
    created_at: string;
    form_link: string | null;
    doc_details: DocDetail[] | null;
    form_filled_customer: Record<string, { question: string; answers: string[] }> | null;
    user_id: string;
  }
  const [formSessions, setFormSessions] = useState<FormSession[]>([]);
  const [loadingFormSessions, setLoadingFormSessions] = useState(true);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(new Set());
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<FormSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // ---------------------------------------------------------------------------
  // Document templates (stored_document_templates)
  // ---------------------------------------------------------------------------
  interface DocTemplate {
    id: string;
    title: string;
    description: string | null;
    google_file_id: string | null;
    link: string | null;
  }
  const TEMPLATES_PER_PAGE = 10;
  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePage, setTemplatePage] = useState(1);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Helper: get a fresh Supabase access-token for every outbound API call
  // ---------------------------------------------------------------------------
  const getAccessToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // ---------------------------------------------------------------------------
  // Call POST /api/ops/on-login on every login → show form modal if data exists.
  // The answer for date-related variables is replaced with today's date values.
  // ---------------------------------------------------------------------------
  const callOnLogin = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/ops/on-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data && Object.keys(json.data).length > 0) {
        // Pre-fill date fields with today's values
        const now = new Date();

        console.log(user?.user_metadata)
        const overridesField: Record<string, string> = {
          '{BLN}': String(now.getMonth() + 1).padStart(2, '0'), // e.g. "04"
          '{TGL}': String(now.getDate()).padStart(2, '0'),       // e.g. "01"
          '{THN}': String(now.getFullYear()),                    // e.g. "2026"
          '{NAMA_PTGS}': String(user?.user_metadata?.name) ?? '', // ops_user.name
        };
        const fields: OpsField[] = (Object.values(json.data) as OpsField[]).map(
          (field) => ({
            ...field,
            answer: overridesField[field.variable] ?? field.answer,
          })
        );
        setOpsFields(fields);
        setShowOpsFormModal(true);
      }
    } catch (err) {
      console.error('[callOnLogin] Error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Handle ops form field change – also clears per-field validation error
  // ---------------------------------------------------------------------------
  const handleOpsFieldChange = (variable: string, value: string) => {
    setOpsFields((prev) =>
      prev.map((f) => (f.variable === variable ? { ...f, answer: value } : f))
    );
    // Clear the validation error for this field when user types
    if (value.trim()) {
      setOpsFieldErrors((prev) => {
        const next = new Set(prev);
        next.delete(variable);
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Submit the ops form → POST /api/ops/submit-form
  // Validates that every field has a non-empty answer before submitting.
  // If editOpsOnly=true (triggered from "Edit data petugas"), skip create-form.
  // Otherwise, if rows are selected, call POST /api/customer/create-form.
  // ---------------------------------------------------------------------------
  const handleOpsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required-field validation: mark all empty fields and abort
    const emptyVars = new Set(
      opsFields
        .filter((f) => !f.answer.trim())
        .map((f) => f.variable)
    );
    if (emptyVars.size > 0) {
      setOpsFieldErrors(emptyVars);
      return;
    }
    setOpsFieldErrors(new Set());

    setIsSubmittingOps(true);
    setOpsFormError('');
    // Capture current flags before any async work
    const isEditOnly = editOpsOnly;
    setEditOpsOnly(false);
    try {
      const token = await getAccessToken();
      if (!token) return;

      // Step 1 – submit ops form fields
      const submitRes = await fetch('/api/ops/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(opsFields),
      });
      if (!submitRes.ok) {
        const data = await submitRes.json().catch(() => ({}));
        setOpsFormError(data.message || 'Gagal menyimpan form');
        return;
      }

      // Close the modal immediately
      setShowOpsFormModal(false);
      setIsSubmittingOps(false);

      // Refresh form sessions after any ops submit
      if (user?.id) fetchFormSessions(user.id);

      // Step 2 – generate documents only when not in edit-only mode
      if (!isEditOnly && selectedTemplateIds.size > 0) {
        const docIds = docTemplates
          .filter((tpl) => selectedTemplateIds.has(tpl.id) && tpl.google_file_id)
          .map((tpl) => tpl.google_file_id as string);

        if (docIds.length > 0) {
          setIsGenerating(true);
          try {
            const createRes = await fetch('/api/customer/create-form', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ doc_ids: docIds }),
            });
            if (!createRes.ok) {
              const errData = await createRes.json().catch(() => ({}));
              alert(errData.message || 'Gagal membuat dokumen');
            } else {
              alert('Dokumen berhasil dibuat!');
            }
          } catch (err) {
            console.error('[handleOpsFormSubmit → create-form] Error:', err);
            alert('Terjadi kesalahan saat membuat dokumen');
          } finally {
            setIsGenerating(false);
            // Reset Daftar Dokumen state after generation (success or error)
            setSelectedTemplateIds(new Set());
            setTemplateSearch('');
            setTemplatePage(1);
            // Refresh sessions again after create-form
            if (user?.id) fetchFormSessions(user.id);
          }
        }
      }
    } catch (err) {
      console.error('[handleOpsFormSubmit] Error:', err);
      setOpsFormError('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsSubmittingOps(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Call the Golang refresh endpoint on every page load / tab focus while
  // the user is authenticated.
  // ---------------------------------------------------------------------------
  const callDocumentRefresh = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch('/api/document/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('[callDocumentRefresh] Error:', err);
    }
  };

  // Fetch documents + call refresh whenever the verified user becomes available.
  // callOnLogin fires only ONCE per login session (not on every page refresh).
  // We track this with a sessionStorage key composed of uid + last_sign_in_at.
  // On a fresh login last_sign_in_at changes → new key → callOnLogin fires.
  // On a page refresh the key is already present → skip.
  useEffect(() => {
    if (!user?.id) return;

    const sessionKey = `opsLoginCalled_${user.id}_${user.last_sign_in_at ?? ''}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      callOnLogin();
    }

    callDocumentRefresh();
    fetchDocumentTemplates();
    fetchFormSessions(user.id);
  }, [user?.id]);

  const fetchFormSessions = async (userUid: string) => {
    try {
      setLoadingFormSessions(true);
      const token = await getAccessToken();
      const response = await fetch(`/api/form-sessions?userUid=${userUid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (response.ok) {
        setFormSessions(result.data ?? []);
      } else {
        console.error('Error fetching form sessions:', result.message);
      }
    } catch (err) {
      console.error('Error fetching form sessions:', err);
    } finally {
      setLoadingFormSessions(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeletingSession(true);
    try {
      const token = await getAccessToken();
      // Call the Golang API via the Next.js proxy
      const response = await fetch(`/api/ops/session?id=${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // 204 No Content is also a success
      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Gagal menghapus session');
        return;
      }
      setShowDeleteSessionConfirm(false);
      setSessionToDelete(null);
      if (user?.id) fetchFormSessions(user.id);
    } catch {
      alert('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsDeletingSession(false);
    }
  };

  const toggleCustomerExpanded = (id: string) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchDocumentTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const token = await getAccessToken();
      const response = await fetch('/api/document-templates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (response.ok) {
        setDocTemplates(result.data ?? []);
      } else {
        console.error('Error fetching document templates:', result.message);
      }
    } catch (err) {
      console.error('Error fetching document templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllTemplates = (currentPageIds: string[]) => {
    setSelectedTemplateIds((prev) => {
      const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleQRCode = () => {
    const userName = user?.user_metadata?.name || user?.email || 'User';
    const userEmail = user?.email || '';
    
    // Generate mailto link for QR Code with custom subject
    const subject = emailSubject || ''; // Use custom subject or empty
    const body = `Tujuan: ${userName}%0D%0ADari: [Mohon isi nama lengkap anda]`;
    const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
    
    setQrData(mailtoLink);
    setShowEmailDialog(false);
    setShowQRDialog(true);
  };

  const handleSMSWA = () => {
    // Logic untuk SMS/WA akan diimplementasikan nanti
    // Subjek juga akan menggunakan emailSubject
    setShowEmailDialog(false);
  };

  // ---------------------------------------------------------------------------
  // Derived values: document-template filtering & pagination
  // ---------------------------------------------------------------------------
  const filteredTemplates = docTemplates.filter(
    (tpl) =>
      !templateSearch ||
      tpl.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (tpl.description ?? '').toLowerCase().includes(templateSearch.toLowerCase())
  );
  const totalTemplatePages = Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE));
  const safePage = Math.min(templatePage, totalTemplatePages);
  const paginatedTemplates = filteredTemplates.slice(
    (safePage - 1) * TEMPLATES_PER_PAGE,
    safePage * TEMPLATES_PER_PAGE
  );
  const currentPageIds = paginatedTemplates.map((r) => r.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageToggle />
                {/* Send Email Button */}
                <button
                  onClick={() => setShowEmailDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow transition-all hover:shadow-lg text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('dashboard.sendEmail')}
                </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('dashboard.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('dashboard.welcomeTitle')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('dashboard.userInfo')}
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.email')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.userId')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{user?.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.name')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.user_metadata?.name || t('dashboard.notSet')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.role')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.user_metadata?.role === 'cs' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {user?.user_metadata?.role === 'cs' ? t('dashboard.roleCS') : user?.user_metadata?.role === 'ub' ? t('dashboard.roleUB') : t('dashboard.notSet')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.createdAt')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.lastSignIn')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>


      
        {/* ------------------------------------------------------------------ */}
        {/* Form Sessions                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Form Sessions</h3>
              <button
                onClick={() => user?.id && fetchFormSessions(user.id)}
                disabled={loadingFormSessions}
                title="Refresh Form Sessions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-4 h-4 ${loadingFormSessions ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {loadingFormSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Memuat sessions...</p>
              </div>
            ) : formSessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                Belum ada form session
              </p>
            ) : (
              <div className="space-y-4">
                {formSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30"
                  >
                    {/* Session header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-gray-200">Dibuat: </span>
                        {new Date(session.created_at).toLocaleString('id-ID')}
                      </p>
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {/* Button 1 – Tampilkan QR */}
                        {session.form_link ? (
                          <button
                            onClick={() => { setQrData(session.form_link!); setShowQRDialog(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Tampilkan QR
                          </button>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Tampilkan QR
                          </button>
                        )}
                        {/* Button 2 – Edit data petugas */}
                        <button
                          onClick={() => { setEditOpsOnly(true); callOnLogin(); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit data petugas
                        </button>
                        {/* Button 3 – Hapus session */}
                        <button
                          onClick={() => { setSessionToDelete(session); setShowDeleteSessionConfirm(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus Session
                        </button>
                      </div>
                    </div>

                    {/* doc_details table */}
                    {session.doc_details && session.doc_details.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Dokumen
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Judul Dokumen
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {session.doc_details.map((doc, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                                    {doc.original_title}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* form_filled_customer dropdown */}
                    {session.form_filled_customer && (
                      <div>
                        <button
                          onClick={() => toggleCustomerExpanded(session.id)}
                          className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${expandedCustomerIds.has(session.id) ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Data nasabah
                        </button>
                        {expandedCustomerIds.has(session.id) && (
                          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(session.form_filled_customer, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Daftar Dokumen                                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Daftar Dokumen
                </h3>
                {selectedTemplateIds.size > 0 && (
                  <>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {selectedTemplateIds.size} dipilih
                    </span>
                    {/* Generate Document button — visible when ≥1 row selected */}
                    <button
                      onClick={callOnLogin}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Buat Dokumen
                    </button>
                  </>
                )}
              </div>
              {/* Search bar */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => { setTemplateSearch(e.target.value); setTemplatePage(1); }}
                  placeholder="Cari judul atau deskripsi..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full sm:w-64"
                />
              </div>
            </div>

            {loadingTemplates ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Memuat dokumen...</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={currentPageIds.length > 0 && currentPageIds.every((id) => selectedTemplateIds.has(id))}
                            onChange={() => toggleSelectAllTemplates(currentPageIds)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Judul
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Deskripsi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Google File ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedTemplates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            {templateSearch ? 'Tidak ada hasil yang cocok' : 'Belum ada dokumen'}
                          </td>
                        </tr>
                      ) : (
                        paginatedTemplates.map((tpl) => (
                          <tr
                            key={tpl.id}
                            onClick={() => toggleTemplateSelection(tpl.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedTemplateIds.has(tpl.id)
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedTemplateIds.has(tpl.id)}
                                onChange={() => toggleTemplateSelection(tpl.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {tpl.title}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                              <span className="line-clamp-2">{tpl.description ?? '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {tpl.google_file_id ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {tpl.link ? (
                                <a
                                  href={tpl.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Buka
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalTemplatePages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Halaman {safePage} dari {totalTemplatePages}
                      <span className="ml-1 text-gray-400">({filteredTemplates.length} dokumen)</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTemplatePage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setTemplatePage((p) => Math.min(totalTemplatePages, p + 1))}
                        disabled={safePage === totalTemplatePages}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Email Options Dialog */}
        {showEmailDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('dashboard.selectOption')}
              </h3>
              
              {/* Subject Input Field */}
              <div className="mb-4">
                <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dashboard.emailSubjectLabel')}
                </label>
                <input
                  id="emailSubject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={t('dashboard.emailSubjectPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleQRCode}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg transition-colors"
                >
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.qrCode')}
                  </span>
                </button>
                <button
                  onClick={handleSMSWA}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg transition-colors"
                >
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.sendWhatsappSMS')}
                  </span>
                </button>
              </div>
              <button
                onClick={() => setShowEmailDialog(false)}
                className="mt-4 w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('dashboard.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* QR Code Dialog (for email) */}
        {showQRDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {t('dashboard.qrCode')}
              </h3>
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <QRCodeSVG value={qrData} size={256} level="H" />
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                <p>{user?.user_metadata?.name || user?.email}</p>
              </div>
              {qrData && (
                <div className="mt-3 text-center">
                  <a
                    href={qrData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {qrData}
                  </a>
                </div>
              )}
              <button
                onClick={() => setShowQRDialog(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {t('dashboard.close')}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Delete Session Confirm Dialog                                       */}
        {/* ------------------------------------------------------------------ */}
        {showDeleteSessionConfirm && sessionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hapus Session</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Yakin ingin menghapus session ini? Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteSessionConfirm(false); setSessionToDelete(null); }}
                  disabled={isDeletingSession}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  disabled={isDeletingSession}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeletingSession ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Ops On-Login Form Modal                                             */}
        {/* ------------------------------------------------------------------ */}
        {showOpsFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Pengaturan Surat
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pastikan kelengkapan data berikut
                  </p>
                </div>
              </div>

              {/* Error */}
              {opsFormError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">{opsFormError}</p>
                </div>
              )}

              {/* Dynamic Fields */}
              <form onSubmit={handleOpsFormSubmit} className="space-y-4">
                {opsFields.map((field) => {
                  const hasError = opsFieldErrors.has(field.variable);
                  return (
                    <div key={field.variable}>
                      <label
                        htmlFor={`ops-${field.variable}`}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {field.label}
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        id={`ops-${field.variable}`}
                        type="text"
                        value={field.answer}
                        onChange={(e) => handleOpsFieldChange(field.variable, e.target.value)}
                        placeholder={field.label}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                          hasError
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                      />
                      {hasError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {field.label} wajib diisi
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingOps}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingOps ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Full-screen generating overlay (create-form is long-running)        */}
        {/* ------------------------------------------------------------------ */}
        {isGenerating && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
              {/* Animated rings */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin [animation-duration:1.5s]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sedang Membuat Dokumen
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Proses ini mungkin membutuhkan beberapa saat.
                  <br />Mohon jangan tutup halaman ini.
                </p>
              </div>
              {/* Pulsing dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                {t('dashboard.infoTitle')}
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  {t('dashboard.infoMessage')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
