import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Truck, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

interface KPI {
    totalSpendYTD: number;
    activeShipments: number;
    avgOnTimeRate: string;
    exceptionRate: number;
}

interface Shipment {
    id: number;
    origin: string;
    destination: string;
    weight: number;
    status: string;
    trackingNumber: string | null;
    createdAt: string;
    carrier?: { name: string } | null;
}

interface CarrierPerf {
    name: string;
    onTimeRate: number;
    onTimePercent: number;
    rating: number;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const statusBadgeClass = (status: string) => {
    switch (status) {
        case 'In Transit': return 'badge badge-info';
        case 'Delivered': return 'badge badge-success';
        case 'Exception': return 'badge badge-error';
        case 'Dispatched': return 'badge badge-default';
        case 'Pending': return 'badge badge-warning';
        default: return 'badge badge-default';
    }
};

export function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const { authFetch, user } = useAuth();
    const [kpis, setKpis] = useState<KPI | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [carriers, setCarriers] = useState<CarrierPerf[]>([]);
    const [spendTrend, setSpendTrend] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [kpiRes, shipRes, carrierRes, spendRes] = await Promise.all([
                    authFetch('http://localhost:3001/api/analytics/kpis'),
                    authFetch('http://localhost:3001/api/shipments'),
                    authFetch('http://localhost:3001/api/analytics/carrier-performance'),
                    authFetch('http://localhost:3001/api/analytics/spend-trend'),
                ]);
                setKpis(await kpiRes.json());
                const allShipments = await shipRes.json();
                setShipments(allShipments.slice(0, 6));
                setCarriers(await carrierRes.json());
                setSpendTrend(await spendRes.json());
            } catch (e) {
                console.error('Dashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    // Compute status breakdown from all shipments
    const statusCounts = shipments.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalShipments = shipments.length || 1;
    const statusConfig = [
        { key: 'In Transit', label: 'In Transit', dotClass: 'dot-transit', fillClass: 'fill-transit' },
        { key: 'Delivered', label: 'Delivered', dotClass: 'dot-delivered', fillClass: 'fill-delivered' },
        { key: 'Pending', label: 'Pending', dotClass: 'dot-pending', fillClass: 'fill-pending' },
        { key: 'Dispatched', label: 'Dispatched', dotClass: 'dot-dispatched', fillClass: 'fill-dispatched' },
        { key: 'Exception', label: 'Exception', dotClass: 'dot-exception', fillClass: 'fill-exception' },
    ];

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="dashboard-loading-spinner" />
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-module">
            {/* Welcome Banner */}
            <div className="dashboard-welcome">
                <div className="welcome-text">
                    <h2>{greeting}, <span>{user?.name?.split(' ')[0] || 'User'}</span></h2>
                    <p>Here's your logistics overview for today</p>
                </div>
                <div className="welcome-timestamp">
                    <Calendar size={16} />
                    {dateStr}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="dashboard-kpis">
                <div className="kpi-card kpi-spend">
                    <div className="kpi-header">
                        <span className="kpi-label">Total Spend (YTD)</span>
                        <div className="kpi-icon" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                            <DollarSign size={20} color="#FFC107" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpis ? formatCurrency(kpis.totalSpendYTD) : '—'}</div>
                    <div className="kpi-trend text-success"><ArrowUpRight size={14} /> +4.2% vs last year</div>
                </div>

                <div className="kpi-card kpi-active">
                    <div className="kpi-header">
                        <span className="kpi-label">Active Shipments</span>
                        <div className="kpi-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}>
                            <Truck size={20} color="#2196F3" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpis?.activeShipments ?? '—'}</div>
                    <div className="kpi-trend text-muted"><ArrowUpRight size={14} /> +12 this week</div>
                </div>

                <div className="kpi-card kpi-ontime">
                    <div className="kpi-header">
                        <span className="kpi-label">On-Time Rate</span>
                        <div className="kpi-icon" style={{ background: 'rgba(0, 230, 118, 0.1)' }}>
                            <Clock size={20} color="#00E676" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpis?.avgOnTimeRate ?? '—'}%</div>
                    <div className="kpi-trend text-success"><ArrowUpRight size={14} /> +0.5% vs last month</div>
                </div>

                <div className="kpi-card kpi-exceptions">
                    <div className="kpi-header">
                        <span className="kpi-label">Exception Rate</span>
                        <div className="kpi-icon" style={{ background: 'rgba(255, 23, 68, 0.1)' }}>
                            <AlertTriangle size={20} color="#FF1744" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpis?.exceptionRate ?? '—'}%</div>
                    <div className="kpi-trend text-error"><ArrowDownRight size={14} /> -0.2% improvement</div>
                </div>
            </div>

            {/* Main Grid: Recent Shipments + Carrier Leaderboard */}
            <div className="dashboard-grid">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3>Recent Shipments</h3>
                        <button className="view-all" onClick={() => onNavigate('shipments')}>View All →</button>
                    </div>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Tracking</th>
                                <th>Route</th>
                                <th>Weight</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map(s => (
                                <tr key={s.id}>
                                    <td style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                        {s.trackingNumber || `#SHP-${s.id}`}
                                    </td>
                                    <td>
                                        <div className="shipment-lane">
                                            <span className="lane-route">{s.origin} → {s.destination}</span>
                                            <span className="lane-carrier">{s.carrier?.name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {s.weight.toLocaleString()} lbs
                                    </td>
                                    <td><span className={statusBadgeClass(s.status)}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3>Carrier Leaderboard</h3>
                        <button className="view-all" onClick={() => onNavigate('carriers')}>View All →</button>
                    </div>
                    <div className="carrier-leaderboard">
                        {carriers
                            .sort((a, b) => b.onTimePercent - a.onTimePercent)
                            .slice(0, 5)
                            .map((c, idx) => (
                                <div className="leaderboard-item" key={c.name}>
                                    <div className={`leaderboard-rank ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-default'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-name">{c.name}</div>
                                        <div className="leaderboard-bar-wrapper">
                                            <div className="leaderboard-bar">
                                                <div
                                                    className="leaderboard-bar-fill"
                                                    style={{ width: `${c.onTimePercent}%` }}
                                                />
                                            </div>
                                            <span className="leaderboard-rate">{c.onTimePercent.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Spend Trend + Status Breakdown */}
            <div className="dashboard-bottom">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Spend Trend</h3>
                        <button className="view-all" onClick={() => onNavigate('reporting')}>Full Report →</button>
                    </div>
                    <div className="mini-chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={spendTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="dashSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                                <XAxis dataKey="month" stroke="#718096" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <YAxis stroke="#718096" tickFormatter={(val: any) => '$' + (val / 1000) + 'k'} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                    formatter={(val: any) => [formatCurrency(val), 'Spend']}
                                />
                                <Area type="monotone" dataKey="spend" stroke="#FFC107" strokeWidth={2} fillOpacity={1} fill="url(#dashSpend)" activeDot={{ r: 5, strokeWidth: 0, fill: '#FFC107' }} />
                                <Area type="monotone" dataKey="budget" stroke="#2196F3" strokeWidth={1.5} strokeDasharray="5 5" fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3>Shipment Status</h3>
                    </div>
                    <div className="status-breakdown">
                        {statusConfig.map(s => {
                            const count = statusCounts[s.key] || 0;
                            const pct = (count / totalShipments) * 100;
                            return (
                                <div className="status-row" key={s.key}>
                                    <div className={`status-dot ${s.dotClass}`} />
                                    <div className="status-info">
                                        <div className="status-label">{s.label}</div>
                                        <div className="status-bar-track">
                                            <div className={`status-bar-fill ${s.fillClass}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <span className="status-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
