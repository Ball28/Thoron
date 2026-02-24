import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, MoreVertical, MapPin, Truck as TruckIcon } from 'lucide-react';
import './Shipments.css';

interface Shipment {
    id: number;
    origin: string;
    destination: string;
    weight: number;
    dimensions: string;
    freightClass: string;
    status: string;
    carrierId: number;
    trackingNumber: string;
    estimatedDelivery: string;
    createdAt: string;
}

export function Shipments() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/shipments');
            const data = await response.json();
            setShipments(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shipments:', error);
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        weight: '',
        dimensions: '',
        freightClass: '50',
        status: 'Pending'
    });

    const handleCreateShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowCreateForm(false);
                fetchShipments();
                // Reset form
                setFormData({
                    origin: '', destination: '', weight: '', dimensions: '', freightClass: '50', status: 'Pending'
                });
            }
        } catch (error) {
            console.error('Error creating shipment:', error);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Delivered': return 'badge-success';
            case 'In Transit': return 'badge-info';
            case 'Exception': return 'badge-error';
            case 'Pending': return 'badge-warning';
            default: return 'badge-default';
        }
    };

    return (
        <div className="shipments-module">
            <div className="module-header flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">All Shipments</h2>
                    <p className="text-secondary">Manage and track your active freight movements</p>
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-secondary">
                        <Filter size={18} /> Filters
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                        <Plus size={18} /> New Shipment
                    </button>
                </div>
            </div>

            {showCreateForm ? (
                <div className="card mb-xl create-shipment-card">
                    <div className="flex justify-between items-center mb-lg border-b pb-md">
                        <h3>Create New Shipment</h3>
                        <button className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>Cancel</button>
                    </div>
                    <form onSubmit={handleCreateShipment} className="shipment-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Origin (City, ST or Zip)</label>
                                <div className="input-with-icon">
                                    <MapPin size={16} className="input-icon" />
                                    <input required type="text" placeholder="e.g. Chicago, IL" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Destination (City, ST or Zip)</label>
                                <div className="input-with-icon">
                                    <MapPin size={16} className="input-icon" />
                                    <input required type="text" placeholder="e.g. Los Angeles, CA" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Total Weight (lbs)</label>
                                <input required type="number" placeholder="0" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Dimensions (LxWxH in inches)</label>
                                <input type="text" placeholder="48x48x48" value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Freight Class</label>
                                <select value={formData.freightClass} onChange={e => setFormData({ ...formData, freightClass: e.target.value })}>
                                    <option value="50">50 - Clean Freight</option>
                                    <option value="60">60 - Auto Parts</option>
                                    <option value="70">70 - Foodstuffs</option>
                                    <option value="85">85 - Castings</option>
                                    <option value="100">100 - Car Covers</option>
                                    <option value="250">250 - Mattresses</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Initial Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Pending">Pending</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="In Transit">In Transit</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-lg">
                            <button type="submit" className="btn btn-primary">Create Shipment</button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="card table-card p-0">
                <div className="table-actions p-md flex items-center justify-between border-b">
                    <div className="search-bar w-full max-w-md">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search by ID, Origin, Destination..." />
                    </div>
                </div>
                <div className="table-container border-0 border-radius-0">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Lane</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-xl">Loading shipments...</td></tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-xl empty-state">
                                        <TruckIcon size={48} className="empty-icon mb-md mx-auto text-muted" />
                                        <h3 className="text-secondary mb-sm">No shipments found</h3>
                                        <p className="text-muted mb-md">Get started by creating your first shipment.</p>
                                        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>Create Shipment</button>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map(shipment => (
                                    <tr key={shipment.id}>
                                        <td className="font-mono text-primary">#SHP-{shipment.id.toString().padStart(4, '0')}</td>
                                        <td>
                                            <div className="font-medium">{shipment.origin}</div>
                                            <div className="text-muted text-xs flex items-center gap-xs mt-xs">
                                                <span className="lane-arrow">→</span> {shipment.destination}
                                            </div>
                                        </td>
                                        <td>
                                            <div>{shipment.weight} lbs</div>
                                            <div className="text-muted text-xs mt-xs">Class {shipment.freightClass} {shipment.dimensions && `• ${shipment.dimensions}`}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(shipment.status)}`}>{shipment.status}</span>
                                        </td>
                                        <td className="text-right">
                                            <button className="btn btn-ghost p-sm"><MoreVertical size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
