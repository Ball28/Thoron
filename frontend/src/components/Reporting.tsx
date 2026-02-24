import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, Truck, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, DownloadCloud } from 'lucide-react';
import './Reporting.css';

interface KPI {
    totalSpendYTD: number;
    activeShipments: number;
    avgOnTimeRate: number;
    exceptionRate: number;
}

export function Reporting() {
    const [kpis, setKpis] = useState<KPI | null>(null);
    const [spendTrend, setSpendTrend] = useState<any[]>([]);
    const [carrierPerf, setCarrierPerf] = useState<any[]>([]);
    const [topLanes, setTopLanes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [kpiRes, spendRes, carrierRes, laneRes] = await Promise.all([
                    fetch('http://localhost:3001/api/analytics/kpis'),
                    fetch('http://localhost:3001/api/analytics/spend-trend'),
                    fetch('http://localhost:3001/api/analytics/carrier-performance'),
                    fetch('http://localhost:3001/api/analytics/lanes')
                ]);
                setKpis(await kpiRes.json());
                setSpendTrend(await spendRes.json());
                setCarrierPerf(await carrierRes.json());
                setTopLanes(await laneRes.json());
            } catch (e) {
                console.error('Failed to load analytics', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="reporting-module">
            <div className="flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Reporting & Analytics</h2>
                    <p className="text-secondary">Enterprise freight spend, carrier performance, and lane volume analysis</p>
                </div>
                <div className="flex gap-sm">
                    <select className="input filter-select" style={{ width: 'auto' }}>
                        <option>Last 6 Months</option>
                        <option>Year to Date</option>
                        <option>Last 30 Days</option>
                    </select>
                    <button className="btn btn-secondary">
                        <DownloadCloud size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid mb-xl">
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Total Spend (YTD)</span>
                        <div className="metric-icon bg-primary-light"><DollarSign size={18} className="text-primary" /></div>
                    </div>
                    <div className="metric-value">{kpis ? formatCurrency(kpis.totalSpendYTD) : '—'}</div>
                    <div className="metric-trend text-success"><ArrowUpRight size={14} /> +4.2% vs last year</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Active Shipments</span>
                        <div className="metric-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}><Truck size={18} color="#2196F3" /></div>
                    </div>
                    <div className="metric-value">{kpis?.activeShipments || '—'}</div>
                    <div className="metric-trend text-muted"><ArrowUpRight size={14} /> +12 this week</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Avg On-Time Rate</span>
                        <div className="metric-icon" style={{ background: 'rgba(0, 230, 118, 0.1)' }}><Clock size={18} color="#00E676" /></div>
                    </div>
                    <div className="metric-value">{kpis?.avgOnTimeRate || '—'}%</div>
                    <div className="metric-trend text-success"><ArrowUpRight size={14} /> +0.5% vs last month</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Exception Rate</span>
                        <div className="metric-icon" style={{ background: 'rgba(255, 23, 68, 0.1)' }}><AlertTriangle size={18} color="#FF1744" /></div>
                    </div>
                    <div className="metric-value">{kpis?.exceptionRate || '—'}%</div>
                    <div className="metric-trend text-error"><ArrowDownRight size={14} /> -0.2% improvement</div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="chart-row mb-xl">
                {/* Main Spend Chart */}
                <div className="chart-card spend-chart">
                    <h3 className="chart-title">Freight Spend Trend</h3>
                    <p className="chart-subtitle">Actual Spend vs. Target Budget</p>
                    <div className="chart-wrapper">
                        {loading ? <div className="chart-loader">Loading...</div> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={spendTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFC107" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2196F3" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                                    <XAxis dataKey="month" stroke="#718096" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                    <YAxis stroke="#718096" tickFormatter={(val: any) => '$' + (val / 1000) + 'k'} tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(val: any) => [formatCurrency(val), 'Spend']}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="spend" name="Actual Spend" stroke="#FFC107" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0, fill: '#FFC107' }} />
                                    <Area type="monotone" dataKey="budget" name="Target Budget" stroke="#2196F3" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorBudget)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Lanes Table */}
                <div className="chart-card lanes-table-card">
                    <h3 className="chart-title">Top Lanes by Volume</h3>
                    <p className="chart-subtitle">Highest frequency routes (YTD)</p>
                    <div className="table-container border-0 mt-md">
                        <table>
                            <thead>
                                <tr>
                                    <th>Lane</th>
                                    <th className="text-right">Volume</th>
                                    <th className="text-right">Avg Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={3} className="text-center p-xl">Loading...</td></tr> :
                                    topLanes.map((lane, idx) => (
                                        <tr key={idx}>
                                            <td className="font-medium text-sm">{lane.lane}</td>
                                            <td className="text-right text-secondary">{lane.volume}</td>
                                            <td className="text-right text-primary">{formatCurrency(lane.avgCost)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="chart-row">
                {/* Carrier Perf Chart */}
                <div className="chart-card w-full">
                    <h3 className="chart-title">Carrier Performance Benchmarking</h3>
                    <p className="chart-subtitle">On-Time Delivery Rate (%) by Active Carrier</p>
                    <div className="chart-wrapper mt-md">
                        {loading ? <div className="chart-loader">Loading...</div> : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={carrierPerf.sort((a, b) => b.onTimePercent - a.onTimePercent)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                                    <XAxis dataKey="name" stroke="#718096" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                    <YAxis domain={['dataMin - 5', 100]} stroke="#718096" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,193,7,0.05)' }}
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                                        formatter={(val: any) => [val.toFixed(1) + '%', 'On-Time Rate']}
                                    />
                                    <Bar dataKey="onTimePercent" name="On-Time %" fill="#FFC107" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
