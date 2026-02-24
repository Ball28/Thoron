import React, { useState, useEffect } from 'react';
import { Plus, Star, Phone, Mail, Shield, TrendingUp, AlertTriangle, Search, X, ChevronRight } from 'lucide-react';
import './Carriers.css';

interface Carrier {
    id: number;
    name: string;
    mcNumber: string;
    dotNumber: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    insuranceLimit: number;
    serviceLevel: string;
    modes: string;
    onTimeRate: number;
    claimRate: number;
    rating: number;
    status: string;
    createdAt: string;
}

const emptyForm = {
    name: '', mcNumber: '', dotNumber: '', contactName: '', contactEmail: '',
    contactPhone: '', insuranceLimit: '100000', serviceLevel: 'Standard',
    modes: 'LTL', status: 'Active',
};

export function Carriers() {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Carrier | null>(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchCarriers(); }, []);

    const fetchCarriers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/carriers');
            setCarriers(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddCarrier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:3001/api/carriers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            setShowForm(false);
            setForm(emptyForm);
            fetchCarriers();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this carrier from the network?')) return;
        await fetch(`http://localhost:3001/api/carriers/${id}`, { method: 'DELETE' });
        setSelected(null);
        fetchCarriers();
    };

    const getStatusClass = (status: string) =>
        status === 'Active' ? 'badge-success' : status === 'Pending' ? 'badge-warning' : 'badge-error';

    const getRatingColor = (rating: number) =>
        rating >= 4.5 ? '#00E676' : rating >= 4.0 ? '#FFC107' : '#FF1744';

    const filtered = carriers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.mcNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.serviceLevel || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="carriers-module">
            {/* Header */}
            <div className="flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Carrier Directory</h2>
                    <p className="text-secondary">Manage your carrier network, lane coverage, and performance</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Add Carrier
                </button>
            </div>

            {/* Stats Bar */}
            <div className="carrier-stats-bar mb-xl">
                <div className="stat-pill">
                    <span className="stat-pill-value text-primary">{carriers.filter(c => c.status === 'Active').length}</span>
                    <span className="stat-pill-label">Active Carriers</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-pill-value" style={{ color: '#00E676' }}>
                        {carriers.length > 0 ? (carriers.reduce((a, c) => a + (c.onTimeRate || 0), 0) / carriers.length * 100).toFixed(1) : 0}%
                    </span>
                    <span className="stat-pill-label">Avg On-Time Rate</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-pill-value text-warning">
                        {carriers.filter(c => c.status === 'Pending').length}
                    </span>
                    <span className="stat-pill-label">Pending Approval</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-pill-value" style={{ color: '#FFC107' }}>
                        {carriers.length > 0 ? (carriers.reduce((a, c) => a + (c.rating || 0), 0) / carriers.length).toFixed(1) : 0}
                    </span>
                    <span className="stat-pill-label">Avg Rating</span>
                </div>
            </div>

            <div className="carriers-layout">
                {/* Table Panel */}
                <div className="carriers-table-panel card p-0">
                    <div className="table-toolbar p-md border-b flex items-center gap-md">
                        <div className="search-bar" style={{ flexGrow: 1, maxWidth: '380px' }}>
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search carriers, MC#, service level…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>
                            {filtered.length} carriers
                        </span>
                    </div>

                    <div className="table-container border-0" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Carrier</th>
                                    <th>Modes</th>
                                    <th>Service</th>
                                    <th>On-Time</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center p-xl text-muted">Loading carriers…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center p-xl text-muted">No carriers found</td></tr>
                                ) : filtered.map(c => (
                                    <tr
                                        key={c.id}
                                        className={selected?.id === c.id ? 'row-selected' : ''}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelected(c)}
                                    >
                                        <td>
                                            <div className="carrier-name-cell">
                                                <div className="carrier-avatar">{c.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-medium">{c.name}</div>
                                                    <div className="text-muted text-xs">{c.mcNumber || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="modes-chips">
                                                {(c.modes || '').split(',').map(m => (
                                                    <span key={m} className="mode-chip">{m.trim()}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="text-secondary">{c.serviceLevel}</td>
                                        <td>
                                            <span style={{ color: c.onTimeRate >= 0.95 ? '#00E676' : c.onTimeRate >= 0.90 ? '#FFC107' : '#FF1744', fontWeight: 600 }}>
                                                {((c.onTimeRate || 0) * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td>
                                            <div className="rating-display">
                                                <Star size={13} fill={getRatingColor(c.rating)} color={getRatingColor(c.rating)} />
                                                <span style={{ color: getRatingColor(c.rating), fontWeight: 600 }}>{(c.rating || 0).toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status}</span></td>
                                        <td><ChevronRight size={16} className="text-muted" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail / Scorecard Panel */}
                {selected && (
                    <div className="carrier-detail-panel card">
                        <div className="flex items-center justify-between mb-lg border-b pb-md">
                            <h3>{selected.name}</h3>
                            <button className="btn btn-ghost p-sm" onClick={() => setSelected(null)}><X size={18} /></button>
                        </div>

                        <span className={`badge ${getStatusClass(selected.status)} mb-md`}>{selected.status}</span>

                        {/* Performance Scorecard */}
                        <div className="scorecard-section mb-lg">
                            <h4 className="scorecard-title">Performance Scorecard</h4>
                            <div className="scorecard-grid">
                                <div className="scorecard-metric">
                                    <TrendingUp size={20} className="text-primary" />
                                    <div>
                                        <div className="metric-value" style={{ color: selected.onTimeRate >= 0.95 ? '#00E676' : '#FFC107' }}>
                                            {((selected.onTimeRate || 0) * 100).toFixed(1)}%
                                        </div>
                                        <div className="metric-label">On-Time Delivery</div>
                                    </div>
                                </div>
                                <div className="scorecard-metric">
                                    <AlertTriangle size={20} className="text-warning" />
                                    <div>
                                        <div className="metric-value" style={{ color: selected.claimRate <= 0.01 ? '#00E676' : '#FF1744' }}>
                                            {((selected.claimRate || 0) * 100).toFixed(1)}%
                                        </div>
                                        <div className="metric-label">Claim Rate</div>
                                    </div>
                                </div>
                                <div className="scorecard-metric">
                                    <Star size={20} fill="#FFC107" color="#FFC107" />
                                    <div>
                                        <div className="metric-value" style={{ color: getRatingColor(selected.rating) }}>
                                            {(selected.rating || 0).toFixed(1)} / 5.0
                                        </div>
                                        <div className="metric-label">Overall Rating</div>
                                    </div>
                                </div>
                                <div className="scorecard-metric">
                                    <Shield size={20} className="text-info" />
                                    <div>
                                        <div className="metric-value text-primary">${(selected.insuranceLimit || 0).toLocaleString()}</div>
                                        <div className="metric-label">Insurance Limit</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="detail-section mb-lg">
                            <h4 className="scorecard-title">Compliance & Authority</h4>
                            <div className="detail-rows">
                                <div className="detail-row"><span className="detail-label">MC Number</span><span className="detail-value">{selected.mcNumber || '—'}</span></div>
                                <div className="detail-row"><span className="detail-label">DOT Number</span><span className="detail-value">{selected.dotNumber || '—'}</span></div>
                                <div className="detail-row"><span className="detail-label">Service Level</span><span className="detail-value">{selected.serviceLevel}</span></div>
                                <div className="detail-row">
                                    <span className="detail-label">Modes</span>
                                    <div className="modes-chips">
                                        {(selected.modes || '').split(',').map(m => (
                                            <span key={m} className="mode-chip">{m.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section mb-lg">
                            <h4 className="scorecard-title">Contact Information</h4>
                            <div className="detail-rows">
                                <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selected.contactName || '—'}</span></div>
                                <div className="detail-row">
                                    <span className="detail-label">Email</span>
                                    <a href={`mailto:${selected.contactEmail}`} className="detail-value text-primary" style={{ textDecoration: 'none' }}>
                                        <Mail size={13} style={{ marginRight: 4 }} />{selected.contactEmail || '—'}
                                    </a>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value"><Phone size={13} style={{ marginRight: 4 }} />{selected.contactPhone || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-md">
                            <button className="btn btn-secondary flex-1">Edit Carrier</button>
                            <button className="btn btn-ghost text-error flex-1" onClick={() => handleDelete(selected.id)}>Remove</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Carrier Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-card card" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-lg border-b pb-md">
                            <h3>Add New Carrier</h3>
                            <button className="btn btn-ghost p-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddCarrier} className="add-carrier-form">
                            <div className="form-section-title">Company Info</div>
                            <div className="form-grid">
                                <div className="form-group mb-0">
                                    <label>Carrier Name *</label>
                                    <input required placeholder="e.g. Acme Freight" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Service Level</label>
                                    <select value={form.serviceLevel} onChange={e => setForm({ ...form, serviceLevel: e.target.value })}>
                                        <option>Standard</option><option>Priority</option><option>Guaranteed</option><option>Spot</option>
                                    </select>
                                </div>
                                <div className="form-group mb-0">
                                    <label>MC Number</label>
                                    <input placeholder="MC-XXXXXXX" value={form.mcNumber} onChange={e => setForm({ ...form, mcNumber: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>DOT Number</label>
                                    <input placeholder="DOT-XXXXXXX" value={form.dotNumber} onChange={e => setForm({ ...form, dotNumber: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Freight Modes</label>
                                    <input placeholder="LTL, FTL, Intermodal" value={form.modes} onChange={e => setForm({ ...form, modes: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Insurance Limit ($)</label>
                                    <input type="number" placeholder="100000" value={form.insuranceLimit} onChange={e => setForm({ ...form, insuranceLimit: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-section-title mt-lg">Contact</div>
                            <div className="form-grid">
                                <div className="form-group mb-0">
                                    <label>Contact Name</label>
                                    <input placeholder="Full name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Contact Email</label>
                                    <input type="email" placeholder="email@carrier.com" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Contact Phone</label>
                                    <input placeholder="555-000-0000" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                                </div>
                                <div className="form-group mb-0">
                                    <label>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option>Active</option><option>Pending</option><option>Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-md mt-xl">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Carrier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
