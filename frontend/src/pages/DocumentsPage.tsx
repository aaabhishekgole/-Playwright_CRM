import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { deleteDocument, fetchDocuments, getApiErrorMessage, uploadDocument } from '../services/api';
import type { DocumentItem } from '../types/models';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const CATEGORIES = ['SOP', 'Policy', 'Training', 'Template', 'Report', 'Other'];

export function DocumentsPage() {
  const { role } = useAuth();
  const { showSuccess, showError } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = role === 'ADMIN' || role === 'CUSTOMER_SUPPORT' || role === 'BACKEND_TEAM';
  const canDelete = role === 'ADMIN';

  async function loadDocuments() {
    setLoading(true);
    try {
      const data = await fetchDocuments(filterCategory || undefined);
      setDocuments(data);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!uploadFile) {
      showError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    try {
      const doc = await uploadDocument(uploadName, uploadDescription, uploadCategory, uploadFile);
      setDocuments((prev) => [doc, ...prev]);
      setUploadName('');
      setUploadDescription('');
      setUploadCategory('');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showSuccess('Document uploaded successfully.');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DocumentItem) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      showSuccess('Document deleted.');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function isViewable(contentType: string): boolean {
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  }

  return (
    <section className="workspace-page">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h2>Document Library</h2>
          <p>Browse, upload, and manage shared reference documents, SOPs, and templates.</p>
        </div>
      </div>

      {canUpload && (
        <article className="card action-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload Document</h3>
          <form onSubmit={handleUpload} className="action-form-grid">
            <label className="action-field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Document name (optional)"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
            </label>
            <label className="action-field">
              <span>Category</span>
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                <option value="">— Select category —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label className="action-field" style={{ gridColumn: '1 / -1' }}>
              <span>Description</span>
              <input
                type="text"
                placeholder="Brief description (optional)"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </label>
            <label className="action-field" style={{ gridColumn: '1 / -1' }}>
              <span>File</span>
              <input
                ref={fileInputRef}
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="action-row" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="primary-button" disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload Document'}
              </button>
            </div>
          </form>
        </article>
      )}

      <article className="card action-card">
        <div className="split-row" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Documents</h3>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: 'auto', minWidth: '10rem' }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>Loading documents…</p>
        ) : documents.length === 0 ? (
          <div className="workspace-empty">
            <p>{filterCategory ? `No documents in category "${filterCategory}".` : 'No documents uploaded yet.'}</p>
          </div>
        ) : (
          documents.map((doc) => (
            <article key={doc.id} className="card action-card" style={{ marginBottom: '0.75rem' }}>
              <div className="split-row">
                <div>
                  <strong>{doc.name}</strong>
                  {doc.category && <span className="status-badge" style={{ marginLeft: '0.5rem' }}>{doc.category}</span>}
                  {doc.description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', opacity: 0.7 }}>{doc.description}</p>}
                </div>
                <div className="action-row">
                  {isViewable(doc.contentType) && (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      View
                    </a>
                  )}
                  <a
                    href={doc.signedUrl}
                    download={doc.fileName}
                    className="primary-button"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    Download
                  </a>
                  {canDelete && (
                    <button
                      className="secondary-button"
                      style={{ color: 'var(--color-danger, #e74c3c)', borderColor: 'var(--color-danger, #e74c3c)' }}
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc)}
                    >
                      {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              <div className="data-grid" style={{ marginTop: '0.75rem' }}>
                <span>File</span><strong>{doc.fileName}</strong>
                <span>Type</span><strong>{doc.contentType}</strong>
                <span>Size</span><strong>{formatFileSize(doc.fileSize)}</strong>
                <span>Uploaded By</span><strong>{doc.uploadedBy}</strong>
                <span>Uploaded At</span><strong>{formatDateTime(doc.uploadedAt)}</strong>
              </div>
            </article>
          ))
        )}
      </article>
    </section>
  );
}
