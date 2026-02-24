import React, { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, CheckCircle, Truck, Package, Clock, MapPin, RefreshCw, ChevronRight } from 'lucide-react';
import './Tracking.css';

interface ShipmentRow {
    id: number;
    origin: string;
    destination: string;
    weight: number;
    status: string;
    carrierId: number;
    carrierName: string;
    trackingNumber: string;
    estimatedDelivery: string;
    lastEventType: string;
    lastLocation: string;
    lastEventTime: string;
    createdAt: string;
}

interface TrackingEvent {
    id: number;
    shipmentId: number;
    eventType: string;
    location: string;
    message: string;
    eventTime: string;
}

interface ShipmentDetail extends ShipmentRow {
    events: TrackingEvent[];
    carrierPhone: string;
}

const STATUS_MILESTONES = ['Pending', 'Dispatched', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

const statusIcon = (status: string) => {
    switch (status) {
        case 'Delivered': return <CheckCircle size={16} />;
        case 'In Transit': return <Truck size={16} />;
        case 'Exception': return <AlertTriangle size={16} />;
        case 'Dispatched': return <Truck size={16} />;
        case 'Pending': return <Clock size={16} />;
        default: return <Package size={16} />;
    }
};

const statusClass = (status: string) => {
    switch (status) {
        case 'Delivered': return 'badge-success';
        case 'In Transit': return 'badge-info';
        case 'Exception': return 'badge-error';
        case 'Dispatched': return 'badge-warning';
        default: return 'badge-neutral';
    }
};

const eventIcon = (type: string) => {
    switch (type) {
        case 'Delivered': return '✅';
        case 'Exception': return '⚠️';
        case 'Out for Delivery': return '🚚';
        case 'In Transit': return '🔵';
        case 'Departed Terminal': return '🏭';
        case 'Picked Up': return '📦';
        case 'Dispatched': return '🔔';
        default: return '•';
    }
};

function formatDateTime(dt: string) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDate(dt: string) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Tracking() {
    const [shipments, setShipments] = useState<ShipmentRow[]>([]);
    const [selected, setSelected] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    const fetchBoard = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch('http://localhost:3001/api/tracking');
            setShipments(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchDetail = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:3001/api/tracking/${id}`);
            setSelected(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchBoard(); }, [fetchBoard]);

    const exceptions = shipments.filter(s => s.status === 'Exception');
    const inTransit = shipments.filter(s => s.status === 'In Transit');
    const delivered = shipments.filter(s => s.status === 'Delivered');

    const filtered = shipments.filter(s => {
        const matchesSearch =
            s.origin?.toLowerCase().includes(search.toLowerCase()) ||
            s.destination?.toLowerCase().includes(search.toLowerCase()) ||
            (s.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.carrierName || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Determine timeline progress for selected shipment
    const getProgressStep = (shipment: ShipmentDetail) => {
        if (shipment.status === 'Exception') return -1;
        const events = shipment.events.map(e => e.eventType);
        let step = 0;
        if (events.includes('Dispatched') || shipment.status === 'Dispatched') step = 1;
        if (events.includes('Picked Up')) step = 2;
        if (events.includes('In Transit')) step = 3;
        if (events.includes('Out for Delivery')) step = 4;
        if (events.includes('Delivered') || shipment.status === 'Delivered') step = 5;
        return step;
    };

    return (
        <div className="tracking-module">
            {/* Header */}
            <div className="flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Tracking & Visibility</h2>
                    <p className="text-secondary">Live shipment status board with milestone tracking and exception management</p>
                </div>
                <button className={`btn btn-secondary ${refreshing ? 'refreshing' : ''}`} onClick={fetchBoard}>
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* KPI Strip */}
            <div className="tracking-kpi-strip mb-xl">
                <div className="kpi-card kpi-transit">
                    <Truck size={22} />
                    <div>
                        <div className="kpi-value">{inTransit.length}</div>
                        <div className="kpi-label">In Transit</div>
                    </div>
                </div>
                <div className={`kpi-card kpi-exception ${exceptions.length > 0 ? 'kpi-pulse' : ''}`}>
                    <AlertTriangle size={22} />
                    <div>
                        <div className="kpi-value">{exceptions.length}</div>
                        <div className="kpi-label">Exceptions</div>
                    </div>
                </div>
                <div className="kpi-card kpi-delivered">
                    <CheckCircle size={22} />
                    <div>
                        <div className="kpi-value">{delivered.length}</div>
                        <div className="kpi-label">Delivered Today</div>
                    </div>
                </div>
                <div className="kpi-card kpi-total">
                    <Package size={22} />
                    <div>
                        <div className="kpi-value">{shipments.length}</div>
                        <div className="kpi-label">Total Tracked</div>
                    </div>
                </div>
            </div>

            {/* Exception Banner */}
            {exceptions.length > 0 && (
                <div className="exception-banner mb-xl">
                    <AlertTriangle size={18} />
                    <span><strong>{exceptions.length} exception{exceptions.length > 1 ? 's' : ''} require attention:</strong>{' '}
                        {exceptions.map(e => `${e.trackingNumber || `SHP-${String(e.id).padStart(4, '0')}`} (${e.origin} → ${e.destination})`).join(', ')}
                    </span>
                </div>
            )}

            <div className="tracking-layout">
                {/* Board Panel */}
                <div className="tracking-board card p-0">
                    {/* Toolbar */}
                    <div className="tracking-toolbar p-md border-b flex items-center gap-md">
                        <div className="search-bar" style={{ flexGrow: 1 }}>
                            <Search size={16} className="search-icon" />
                            <input
                                placeholder="Search tracking #, carrier, origin, destination…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="status-filter-pills">
                            {['All', 'In Transit', 'Dispatched', 'Pending', 'Exception', 'Delivered'].map(s => (
                                <button
                                    key={s}
                                    className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
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
                                    <th>Tracking #</th>
                                    <th>Lane</th>
                                    <th>Carrier</th>
                                    <th>Last Update</th>
                                    <th>ETA</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center p-xl text-muted">Loading shipments…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center p-xl text-muted">No shipments found</td></tr>
                                ) : filtered.map(s => (
                                    <tr
                                        key={s.id}
                                        className={`tracking-row ${selected?.id === s.id ? 'row-selected' : ''} ${s.status === 'Exception' ? 'row-exception' : ''}`}
                                        onClick={() => fetchDetail(s.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <div className="trk-id-cell">
                                                <span className="trk-badge">{statusIcon(s.status)}</span>
                                                <div>
                                                    <div className="font-medium text-sm">{s.trackingNumber || `SHP-${String(s.id).padStart(4, '0')}`}</div>
                                                    <div className="text-xs text-muted">{s.weight?.toLocaleString()} lbs</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="lane-cell">
                                                <span className="text-xs">{s.origin}</span>
                                                <ChevronRight size={12} className="text-muted" />
                                                <span className="text-xs">{s.destination}</span>
                                            </div>
                                        </td>
                                        <td className="text-secondary text-sm">{s.carrierName || '—'}</td>
                                        <td>
                                            {s.lastEventType ? (
                                                <div>
                                                    <div className="text-xs font-medium">{s.lastEventType}</div>
                                                    <div className="text-xs text-muted">{s.lastLocation} · {formatDateTime(s.lastEventTime)}</div>
                                                </div>
                                            ) : <span className="text-muted text-xs">No events yet</span>}
                                        </td>
                                        <td className="text-sm text-secondary">{formatDate(s.estimatedDelivery)}</td>
                                        <td><span className={`badge ${statusClass(s.status)}`}>{s.status}</span></td>
                                        <td><ChevronRight size={16} className="text-muted" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="tracking-detail card">
                        <div className="flex items-center justify-between mb-md border-b pb-md">
                            <div>
                                <div className="text-xs text-muted mb-xs">Tracking #</div>
                                <div className="font-bold text-primary" style={{ fontSize: 'var(--font-size-md)' }}>
                                    {selected.trackingNumber || `SHP-${String(selected.id).padStart(4, '0')}`}
                                </div>
                            </div>
                            <span className={`badge ${statusClass(selected.status)}`}>{selected.status}</span>
                        </div>

                        {/* Lane summary */}
                        <div className="detail-lane mb-lg">
                            <div className="lane-endpoint">
                                <MapPin size={14} className="text-primary" />
                                <div>
                                    <div className="text-xs text-muted">Origin</div>
                                    <div className="font-medium text-sm">{selected.origin}</div>
                                </div>
                            </div>
                            <div className="lane-arrow">→</div>
                            <div className="lane-endpoint">
                                <MapPin size={14} className="text-muted" />
                                <div>
                                    <div className="text-xs text-muted">Destination</div>
                                    <div className="font-medium text-sm">{selected.destination}</div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Progress Bar */}
                        {selected.status !== 'Exception' && (
                            <div className="milestone-track mb-lg">
                                {STATUS_MILESTONES.map((step, idx) => {
                                    const progress = getProgressStep(selected);
                                    const done = idx <= progress;
                                    const active = idx === progress;
                                    return (
                                        <div key={step} className={`milestone-step ${done ? 'done' : ''} ${active ? 'current' : ''}`}>
                                            <div className="milestone-dot">{done ? '✓' : idx + 1}</div>
                                            <div className="milestone-label">{step}</div>
                                            {idx < STATUS_MILESTONES.length - 1 && (
                                                <div className={`milestone-connector ${done && idx < progress ? 'filled' : ''}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Exception call-out */}
                        {selected.status === 'Exception' && (
                            <div className="exception-callout mb-lg">
                                <AlertTriangle size={18} />
                                <div>
                                    <div className="font-medium">Exception Detected</div>
                                    <div className="text-xs text-muted mt-xs">
                                        {selected.events.filter(e => e.eventType === 'Exception').map(e => e.message).join(' ')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detail rows */}
                        <div className="detail-rows mb-lg">
                            <div className="detail-row"><span className="detail-label">Carrier</span><span className="detail-value">{selected.carrierName || '—'}</span></div>
                            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{selected.carrierPhone || '—'}</span></div>
                            <div className="detail-row"><span className="detail-label">Weight</span><span className="detail-value">{selected.weight?.toLocaleString()} lbs</span></div>
                            <div className="detail-row"><span className="detail-label">ETA</span><span className="detail-value">{formatDate(selected.estimatedDelivery)}</span></div>
                        </div>

                        {/* Event Timeline */}
                        <div className="event-timeline-section">
                            <div className="text-xs text-muted font-medium uppercase tracking-wider mb-md">Milestone History</div>
                            {selected.events.length === 0 ? (
                                <p className="text-muted text-xs">No events recorded yet.</p>
                            ) : (
                                <div className="event-timeline">
                                    {[...selected.events].reverse().map((ev, idx) => (
                                        <div key={ev.id} className={`event-item ${idx === 0 ? 'event-latest' : ''}`}>
                                            <div className="event-icon">{eventIcon(ev.eventType)}</div>
                                            <div className="event-body">
                                                <div className="event-type">{ev.eventType}</div>
                                                <div className="event-location text-muted text-xs">{ev.location}</div>
                                                <div className="event-message text-xs">{ev.message}</div>
                                                <div className="event-time text-muted" style={{ fontSize: '10px' }}>{formatDateTime(ev.eventTime)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
