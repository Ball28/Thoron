import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, FileText, Search, Download, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './Documents.css';

interface DocumentRow {
    id: number;
    shipmentId: number;
    type: string;
    filename: string;
    size: number;
    status: string;
    uploadedAt: string;
    trackingNumber: string | null;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const statusIcon = (status: string) => {
    switch (status) {
        case 'Verified': return <CheckCircle size={14} className="text-success" />;
        case 'Pending': return <Clock size={14} className="text-warning" />;
        case 'Rejected': return <AlertCircle size={14} className="text-error" />;
        default: return <FileText size={14} />;
    }
};

export function Documents() {
    const [documents, setDocuments] = useState<DocumentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [uploading, setUploading] = useState(false);

    const fetchDocs = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/documents');
            if (res.ok) {
                setDocuments(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch documents', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        // Simulate upload delay
        await new Promise(r => setTimeout(r, 800));

        let inferredType = 'Other';
        const name = file.name.toLowerCase();
        if (name.includes('bol')) inferredType = 'BOL';
        else if (name.includes('pod')) inferredType = 'POD';
        else if (name.includes('inv')) inferredType = 'Invoice';
        else if (name.includes('rate') || name.includes('con')) inferredType = 'Rate Confirmation';
        else if (name.includes('customs')) inferredType = 'Customs';

        try {
            const res = await fetch('http://localhost:3001/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipmentId: null, // Would normally prompt for or infer shipment association
                    type: inferredType,
                    filename: file.name,
                    size: file.size
                })
            });
            if (res.ok) {
                fetchDocs(); // Refresh list
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this document?')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDocuments(docs => docs.filter(d => d.id !== id));
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const filtered = documents.filter(d => {
        const matchesSearch = d.filename.toLowerCase().includes(search.toLowerCase()) ||
            (d.trackingNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'All' || d.type === filterType;
        return matchesSearch && matchesType;
    });

    const docTypes = ['All', 'BOL', 'POD', 'Invoice', 'Rate Confirmation', 'Customs'];

    return (
        <div className="documents-module">
            {/* Header */}
            <div className="flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Document Management</h2>
                    <p className="text-secondary">Centralized repository for BOLs, PODs, Invoices, and Customs paperwork</p>
                </div>
                <div className="flex gap-sm">
                    <div className="file-upload-wrapper">
                        <button className="btn btn-primary" disabled={uploading}>
                            {uploading ? <Clock size={16} className="spin" /> : <UploadCloud size={16} />}
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                        <input type="file" onChange={handleFileUpload} disabled={uploading} title="Upload Document" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="doc-stats-strip mb-xl">
                <div className="doc-stat-card">
                    <div className="stat-label">Total Documents</div>
                    <div className="stat-value">{documents.length}</div>
                </div>
                <div className="doc-stat-card">
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-value text-warning">{documents.filter(d => d.status === 'Pending').length}</div>
                </div>
                <div className="doc-stat-card">
                    <div className="stat-label">Missing PODs (Dispatched)</div>
                    <div className="stat-value text-error">3</div>
                </div>
            </div>

            {/* Main Panel */}
            <div className="card p-0">
                {/* Toolbar */}
                <div className="doc-toolbar p-md border-b flex items-center justify-between gap-md">
                    <div className="search-bar" style={{ flexGrow: 1, maxWidth: '400px' }}>
                        <Search size={16} className="search-icon" />
                        <input
                            placeholder="Search filenames, tracking numbers…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="status-filter-pills">
                        {docTypes.map(t => (
                            <button
                                key={t}
                                className={"filter-pill " + (filterType === t ? 'active' : '')}
                                onClick={() => setFilterType(t)}
                            >{t}</button>
                        ))}
                    </div>
                </div>

                {/* Document Table */}
                <div className="table-container border-0" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Associated Shipment</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Uploaded At</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center p-xl text-muted">Loading documents…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center p-xl text-muted">No documents found</td></tr>
                            ) : filtered.map(doc => (
                                <tr key={doc.id} className="doc-row">
                                    <td>
                                        <div className="doc-name-cell">
                                            <div className="doc-icon"><FileText size={18} /></div>
                                            <div>
                                                <div className="font-medium text-sm text-primary">{doc.filename}</div>
                                                <div className="text-xs text-muted">{formatBytes(doc.size)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {doc.trackingNumber ? (
                                            <span className="shipment-link">{doc.trackingNumber}</span>
                                        ) : (
                                            <span className="text-muted text-sm">— Unassigned —</span>
                                        )}
                                    </td>
                                    <td><span className="badge badge-neutral">{doc.type}</span></td>
                                    <td>
                                        <div className="doc-status-cell">
                                            {statusIcon(doc.status)}
                                            <span className="text-sm">{doc.status}</span>
                                        </div>
                                    </td>
                                    <td className="text-sm text-secondary">{formatDate(doc.uploadedAt)}</td>
                                    <td>
                                        <div className="actions-cell flex justify-end gap-sm">
                                            <button className="icon-btn" title="Download"><Download size={16} /></button>
                                            <button className="icon-btn text-error" title="Delete" onClick={() => handleDelete(doc.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
