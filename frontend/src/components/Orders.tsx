import React, { useState, useEffect, useCallback } from 'react';
import { Package, Truck, Network, CheckCircle, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import './Orders.css';

interface OrderRow {
    id: number;
    customerName: string;
    poNumber: string;
    origin: string;
    destination: string;
    weight: number;
    dimensions: string;
    status: string;
    createdAt: string;
}

export function Orders() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [planning, setPlanning] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/orders?status=Unplanned');
            if (res.ok) {
                setOrders(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)));
        }
    };

    const selectedOrders = orders.filter(o => selectedIds.has(o.id));
    const totalWeight = selectedOrders.reduce((sum, o) => sum + o.weight, 0);
    const isOverweight = totalWeight > 45000; // Standard truckload max

    const handlePlanLoad = async () => {
        if (selectedOrders.length === 0) return;
        setPlanning(true);

        const origin = selectedOrders[0].origin;
        const destination = selectedOrders[selectedOrders.length - 1].destination;
        const dimensions = `${selectedOrders.length} Orders Consolidated`;

        try {
            const res = await fetch('http://localhost:3001/api/orders/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: Array.from(selectedIds),
                    origin,
                    destination,
                    weight: totalWeight,
                    dimensions
                })
            });

            if (res.ok) {
                // Clear selection and refresh list
                setSelectedIds(new Set());
                fetchOrders();
                alert('Load successfully planned and shipment created!');
            }
        } catch (e) {
            console.error('Failed to plan load', e);
        } finally {
            setPlanning(false);
        }
    };

    return (
        <div className="orders-module flex gap-xl h-full">
            {/* Left Panel: Available Orders */}
            <div className="orders-list-panel flex-1 flex flex-col min-h-0 card p-0">
                <div className="p-lg border-b bg-surface-base">
                    <h2 className="text-primary flex items-center gap-sm mb-xs">
                        <Package size={20} className="text-accent" /> Available Orders
                    </h2>
                    <p className="text-secondary text-sm">Select LTL and parcel orders to consolidate into a full truckload.</p>
                </div>

                <div className="table-container flex-1 overflow-auto p-0 border-0">
                    <table className="orders-table">
                        <thead className="sticky top-0 bg-surface-base z-10 shadow-sm">
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={orders.length > 0 && selectedIds.size === orders.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>PO Number</th>
                                <th>Customer</th>
                                <th>Lane</th>
                                <th className="text-right">Weight (lbs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-xl text-muted">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-xl">
                                        <div className="flex flex-col items-center justify-center text-muted gap-sm">
                                            <ShieldCheck size={32} className="text-success opacity-50" />
                                            <div>No unplanned orders! All caught up.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr
                                    key={order.id}
                                    className={`order-row ${selectedIds.has(order.id) ? 'selected-row' : ''}`}
                                    onClick={() => handleSelect(order.id)}
                                >
                                    <td onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(order.id)}
                                            onChange={() => handleSelect(order.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="font-medium text-primary">{order.poNumber}</div>
                                        <div className="text-xs text-muted mt-xs">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td>{order.customerName}</td>
                                    <td>
                                        <div className="lane-display flex items-center gap-xs text-sm">
                                            <span className="truncate max-w-[100px]">{order.origin.split(',')[0]}</span>
                                            <ArrowRight size={12} className="text-muted flex-shrink-0" />
                                            <span className="truncate max-w-[100px]">{order.destination.split(',')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="text-right font-mono text-sm">{order.weight.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Panel: Load Builder */}
            <div className="load-builder-panel w-80 flex flex-col card p-0 bg-surface-highlight border-l shadow-lg">
                <div className="p-xl border-b flex items-center gap-sm">
                    <Truck size={24} className="text-primary" />
                    <h3 className="m-0 text-primary">Load Builder</h3>
                </div>

                <div className="flex-1 p-xl overflow-y-auto">
                    {selectedIds.size === 0 ? (
                        <div className="empty-load-state text-center text-muted mt-2xl p-xl border-dashed border-2 rounded-lg border-opacity-20 flex flex-col items-center gap-md">
                            <Network size={32} className="opacity-40" />
                            <p className="text-sm">Select orders from the left to build a consolidated load.</p>
                        </div>
                    ) : (
                        <div className="active-load flex flex-col gap-lg">
                            <div className="load-summary card bg-surface-base border shadow-sm p-lg">
                                <div className="text-xs text-muted uppercase tracking-wider mb-sm">Consolidated Lane</div>
                                <div className="flex flex-col gap-xs font-medium text-primary">
                                    <div className="flex items-center gap-sm"><div className="dot origin-dot"></div> {selectedOrders[0].origin}</div>
                                    <div className="flex items-center gap-sm"><div className="dot dest-dot"></div> {selectedOrders[selectedOrders.length - 1].destination}</div>
                                </div>
                            </div>

                            <div className="stat-group flex justify-between items-center p-md bg-surface-base rounded-md border">
                                <span className="text-sm text-secondary">Orders</span>
                                <span className="font-bold text-lg">{selectedIds.size}</span>
                            </div>

                            <div className={`stat-group flex justify-between items-center p-md bg-surface-base rounded-md border ${isOverweight ? 'border-error bg-error bg-opacity-10' : ''}`}>
                                <span className="text-sm text-secondary">Total Weight</span>
                                <div className="text-right">
                                    <div className={`font-bold text-lg ${isOverweight ? 'text-error' : 'text-primary'}`}>{totalWeight.toLocaleString()} lbs</div>
                                    <div className="text-xs text-muted">Max: 45,000 lbs</div>
                                </div>
                            </div>

                            {isOverweight && (
                                <div className="text-xs text-error flex items-center gap-xs p-sm bg-error bg-opacity-20 rounded">
                                    <AlertTriangle size={14} /> Exceeds legal truck weight!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-xl border-t bg-surface-base">
                    <button
                        className="btn btn-primary w-full justify-center py-md shadow-md"
                        disabled={selectedIds.size === 0 || isOverweight || planning}
                        onClick={handlePlanLoad}
                    >
                        {planning ? 'Planning Load...' : 'Create Shipment'}
                    </button>
                    <p className="text-center text-xs text-muted mt-md">This will transition the selected orders into an active Shipment in the tracking module.</p>
                </div>
            </div >
        </div >
    );
}
