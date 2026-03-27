'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { QRCodeSVG } from 'qrcode.react';
import { DocOps } from './type';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrData, setQrData] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', url: '' });
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<DocOps[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showDocumentQRDialog, setShowDocumentQRDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocOps | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocOps | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocOps | null>(null);
  const [editForm, setEditForm] = useState({ title: '', url: '' });
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
      
      // Fetch documents
      fetchDocuments(user.id);
    };

    checkUser();
  }, [router]);

  const fetchDocuments = async (userUid: string) => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(`/api/documents?userUid=${userUid}`);
      const result = await response.json();
      
      if (response.ok) {
        setDocuments(result.data || []);
      } else {
        console.error('Error fetching documents:', result.message);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
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

  const handleDocumentClick = (doc: DocOps) => {
    setSelectedDocument(doc);
    setShowDocumentDialog(true);
  };

  const handleDocumentQRCode = () => {
    if (selectedDocument) {
      setQrData(selectedDocument.url);
      setShowDocumentDialog(false);
      setShowDocumentQRDialog(true);
    }
  };

  const handleDocumentSMSWA = () => {
    // Logic untuk SMS/WA akan diimplementasikan nanti
    setShowDocumentDialog(false);
  };

  const handleDocumentEmail = () => {
    // Logic untuk Email akan diimplementasikan nanti
    setShowDocumentDialog(false);
  };

  const handleEditDocument = (doc: DocOps, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocumentToEdit(doc);
    setEditForm({ title: doc.title, url: doc.url });
    setEditErrors({});
    setShowEditDialog(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentToEdit) return;

    const errors: { [key: string]: string } = {};
    if (!editForm.title.trim()) errors.title = t('dashboard.titleRequired');
    if (!editForm.url.trim()) {
      errors.url = t('dashboard.urlRequired');
    } else {
      try { new URL(editForm.url); } catch { errors.url = t('dashboard.urlInvalid'); }
    }
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: documentToEdit.id, title: editForm.title, url: editForm.url }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) { setEditErrors(data.errors); }
        else { setEditErrors({ general: data.message || t('dashboard.documentUpdateFailed') }); }
        return;
      }
      setShowEditDialog(false);
      setDocumentToEdit(null);
      alert(t('dashboard.documentUpdated'));
      if (user?.id) fetchDocuments(user.id);
    } catch {
      setEditErrors({ general: t('dashboard.unexpectedError') });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDocument = (doc: DocOps, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setShowDeleteConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents?id=${documentToDelete.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || t('dashboard.documentDeleteFailed'));
        return;
      }
      setShowDeleteConfirmDialog(false);
      setDocumentToDelete(null);
      alert(t('dashboard.documentDeleted'));
      if (user?.id) fetchDocuments(user.id);
    } catch {
      alert(t('dashboard.unexpectedError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUploadForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (uploadErrors[name]) {
      setUploadErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: { [key: string]: string } = {};

    if (!uploadForm.title.trim()) {
      errors.title = 'Judul wajib diisi';
    }

    if (!uploadForm.url.trim()) {
      errors.url = 'URL wajib diisi';
    } else {
      try {
        new URL(uploadForm.url);
      } catch {
        errors.url = 'URL tidak valid';
      }
    }

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      return;
    }

    setIsUploading(true);
    setUploadErrors({});

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uploadForm.title,
          url: uploadForm.url,
          userUid: user?.id, // User's auth UID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setUploadErrors(data.errors);
        } else {
          setUploadErrors({ general: data.message || 'Gagal menyimpan dokumen' });
        }
        return;
      }

      // Success - reset form and close dialog
      setUploadForm({ title: '', url: '' });
      setShowUploadDialog(false);
      alert('Dokumen berhasil dibuat!');
      
      // Refresh documents list
      if (user?.id) {
        fetchDocuments(user.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadErrors({ general: 'Terjadi kesalahan yang tidak terduga' });
    } finally {
      setIsUploading(false);
    }
  };

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
              <button
                onClick={() => setShowUploadDialog(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('dashboard.uploadForm')}
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

        {/* Actions Section */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              {t('dashboard.quickActions')}
            </h3>
            
            {loadingDocuments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('dashboard.loadingDocuments')}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {/* Send Email Button */}
                <button
                  onClick={() => setShowEmailDialog(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow transition-all hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('dashboard.sendEmail')}
                </button>

                {/* Document Buttons */}
                {documents.map((doc) => (
                  <div key={doc.id} className="inline-flex items-center shadow rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleDocumentClick(doc)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {doc.title}
                    </button>
                    <button
                      onClick={(e) => handleEditDocument(doc, e)}
                      title={t('dashboard.edit')}
                      className="px-3 py-3 bg-yellow-500 hover:bg-yellow-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-colors border-l border-yellow-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteDocument(doc, e)}
                      title={t('dashboard.delete')}
                      className="px-3 py-3 bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors border-l border-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}

                {documents.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                    {t('dashboard.noDocuments')}
                  </p>
                )}
              </div>
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

        {/* Upload Form Dialog */}
        {showUploadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('dashboard.uploadForm')}
              </h3>
              
              {uploadErrors.general && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">{uploadErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Title Field */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.titleLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={uploadForm.title}
                    onChange={handleUploadFormChange}
                    placeholder={t('dashboard.titlePlaceholder')}
                    className={`w-full px-4 py-2 border ${
                      uploadErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  />
                  {uploadErrors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{uploadErrors.title}</p>
                  )}
                </div>

                {/* URL Field */}
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.urlLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    value={uploadForm.url}
                    onChange={handleUploadFormChange}
                    placeholder={t('dashboard.urlPlaceholder')}
                    className={`w-full px-4 py-2 border ${
                      uploadErrors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  />
                  {uploadErrors.url && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{uploadErrors.url}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadDialog(false);
                      setUploadForm({ title: '', url: '' });
                      setUploadErrors({});
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('dashboard.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? t('dashboard.saving') : t('dashboard.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Options Dialog */}
        {showDocumentDialog && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedDocument.title}
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDocumentQRCode}
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
                  onClick={handleDocumentSMSWA}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg transition-colors"
                >
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.smsWA')}
                  </span>
                </button>
                <button
                  onClick={handleDocumentEmail}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-lg transition-colors"
                >
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.email')}
                  </span>
                </button>
              </div>
              <button
                onClick={() => setShowDocumentDialog(false)}
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
              <button
                onClick={() => setShowQRDialog(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {t('dashboard.close')}
              </button>
            </div>
          </div>
        )}

        {/* Document QR Code Dialog */}
        {showDocumentQRDialog && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {t('dashboard.qrCode')} - {selectedDocument.title}
              </h3>
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <QRCodeSVG value={selectedDocument.url} size={256} level="H" />
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                <p className="break-all">{selectedDocument.url}</p>
              </div>
              <button
                onClick={() => setShowDocumentQRDialog(false)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {t('dashboard.close')}
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirmDialog && documentToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('dashboard.deleteDocument')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t('dashboard.deleteConfirmMessage').replace('{title}', documentToDelete.title)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmDialog(false);
                    setDocumentToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('dashboard.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? t('dashboard.deleting') : t('dashboard.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Document Dialog */}
        {showEditDialog && documentToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('dashboard.editDocument')}
              </h3>

              {editErrors.general && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">{editErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.titleLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    value={editForm.title}
                    onChange={handleEditFormChange}
                    placeholder={t('dashboard.titlePlaceholder')}
                    className={`w-full px-4 py-2 border ${
                      editErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  />
                  {editErrors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.title}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.urlLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-url"
                    name="url"
                    type="url"
                    value={editForm.url}
                    onChange={handleEditFormChange}
                    placeholder={t('dashboard.urlPlaceholder')}
                    className={`w-full px-4 py-2 border ${
                      editErrors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  />
                  {editErrors.url && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.url}</p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditDialog(false);
                      setDocumentToEdit(null);
                      setEditErrors({});
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('dashboard.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? t('dashboard.updating') : t('dashboard.save')}
                  </button>
                </div>
              </form>
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
