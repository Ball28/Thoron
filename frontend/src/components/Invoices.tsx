import React, { useState, useEffect, useCallback } from 'react';
import { FileCheck, Search, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './Invoices.css';

interface InvoiceRow {
    id: number;
    shipmentId: number;
    carrierId: number;
    invoiceNumber: string;
    quotedAmount: number;
    actualAmount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    carrierName: string;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusIcon = (status: string) => {
    switch (status) {
        case 'Approved':
        case 'Paid': return <CheckCircle size={14} className="text-success" />;
        case 'Pending': return <Clock size={14} className="text-warning" />;
        case 'Disputed': return <AlertTriangle size={14} className="text-error" />;
        default: return <FileCheck size={14} />;
    }
};

export function Invoices() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const fetchInvoices = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/invoices');
            if (res.ok) {
                setInvoices(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch invoices', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/invoices/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchInvoices(); // Refresh list to get updated status
            }
        } catch (e) {
            console.error('Update failed', e);
        }
    };

    const filtered = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            inv.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
            inv.carrierName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const calculateVariance = (quoted: number, actual: number) => {
        const variance = actual - quoted;
        if (variance === 0) return { text: 'Match', className: 'text-success' };
        if (variance > 0) return { text: `+${formatCurrency(variance)}`, className: 'text-error font-medium' };
        return { text: `${formatCurrency(variance)}`, className: 'text-success font-medium' };
    };

    // Calculate totals for quick stats
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.actualAmount, 0);
    const totalDisputed = invoices.filter(i => i.status === 'Disputed').length;

    const statuses = ['All', 'Pending', 'Approved', 'Disputed', 'Paid'];

    return (
        <div className="invoices-module">
            {/* Header */}
            <div className="flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Freight Audit & Payment</h2>
                    <p className="text-secondary">Reconcile carrier invoices against quoted rates to catch discrepancies</p>
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-primary">
                        <FileCheck size={16} /> Batch Approve
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="inv-stats-strip mb-xl">
                <div className="inv-stat-card">
                    <div className="stat-label flex items-center gap-xs"><DollarSign size={14} /> Pending AP Balance</div>
                    <div className="stat-value">{formatCurrency(totalPending)}</div>
                </div>
                <div className="inv-stat-card">
                    <div className="stat-label flex items-center gap-xs"><AlertTriangle size={14} /> Action Required (Disputes)</div>
                    <div className="stat-value text-error">{totalDisputed}</div>
                </div>
                <div className="inv-stat-card">
                    <div className="stat-label flex items-center gap-xs"><CheckCircle size={14} /> Auto-Approved YTD</div>
                    <div className="stat-value text-success">94.2%</div>
                </div>
            </div>

            {/* Main Panel */}
            <div className="card p-0">
                {/* Toolbar */}
                <div className="inv-toolbar p-md border-b flex items-center justify-between gap-md">
                    <div className="search-bar" style={{ flexGrow: 1, maxWidth: '400px' }}>
                        <Search size={16} className="search-icon" />
                        <input
                            placeholder="Search invoices, carriers, loads…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="status-filter-pills flex gap-xs">
                        {statuses.map(s => (
                            <button
                                key={s}
                                className={"filter-pill " + (filterStatus === s ? 'active' : '')}
                                onClick={() => setFilterStatus(s)}
                            >{s}</button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="table-container border-0" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice Details</th>
                                <th>Shipment</th>
                                <th className="text-right">Quoted</th>
                                <th className="text-right">Billed</th>
                                <th className="text-right">Variance</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center p-xl text-muted">Loading invoices…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-xl text-muted">No invoices found</td></tr>
                            ) : filtered.map(inv => {
                                const v = calculateVariance(inv.quotedAmount, inv.actualAmount);
                                return (
                                    <tr key={inv.id} className="inv-row">
                                        <td>
                                            <div className="font-medium text-primary text-sm">{inv.invoiceNumber}</div>
                                            <div className="text-xs text-muted mt-xs">{inv.carrierName}</div>
                                        </td>
                                        <td>
                                            <div className="shipment-link">{inv.trackingNumber}</div>
                                            <div className="text-xs text-secondary mt-xs">{inv.origin.split(',')[0]} → {inv.destination.split(',')[0]}</div>
                                        </td>
                                        <td className="text-right text-secondary text-sm">{formatCurrency(inv.quotedAmount)}</td>
                                        <td className="text-right font-medium text-sm">{formatCurrency(inv.actualAmount)}</td>
                                        <td className={`text-right text-sm ${v.className}`}>{v.text}</td>
                                        <td>
                                            <div className="inv-status-cell">
                                                {statusIcon(inv.status)}
                                                <span className="text-sm font-medium">{inv.status}</span>
                                            </div>
                                            {inv.status === 'Pending' && <div className="text-xs text-muted mt-xs">Due {formatDate(inv.dueDate)}</div>}
                                        </td>
                                        <td>
                                            <div className="actions-cell flex justify-end gap-sm">
                                                {inv.status === 'Pending' && (
                                                    <>
                                                        <button className="btn btn-secondary text-success" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleUpdateStatus(inv.id, 'Approved')}>Approve</button>
                                                        <button className="btn btn-secondary text-error" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleUpdateStatus(inv.id, 'Disputed')}>Dispute</button>
                                                    </>
                                                )}
                                                {inv.status === 'Approved' && (
                                                    <button className="btn btn-secondary text-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleUpdateStatus(inv.id, 'Paid')}>Mark Paid</button>
                                                )}
                                                <button className="icon-btn" title="View PDF"><FileCheck size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
