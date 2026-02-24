import React, { useState } from 'react';
import { Search, Loader, CheckCircle, Clock, Navigation, Zap, Scale } from 'lucide-react';
import { calculateDensityClass, NMFC_CLASSES } from '../utils/nmfc';
import './RateQuoting.css';

interface RateQuote {
    carrier: string;
    service: string;
    rate: number;
    transitDays: number;
    score: number;
}

export function RateQuoting() {
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        freightClass: '50'
    });
    const [quotes, setQuotes] = useState<RateQuote[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleDimensionChange = (field: 'weight' | 'length' | 'width' | 'height', value: string) => {
        const newForm = { ...formData, [field]: value };

        // Auto-calculate freight class if all dimensions and weight are present
        const w = parseFloat(newForm.weight);
        const l = parseFloat(newForm.length);
        const wi = parseFloat(newForm.width);
        const h = parseFloat(newForm.height);

        if (!isNaN(w) && !isNaN(l) && !isNaN(wi) && !isNaN(h) && w > 0 && l > 0 && wi > 0 && h > 0) {
            newForm.freightClass = calculateDensityClass(w, l, wi, h);
        }

        setFormData(newForm);
    };

    const fetchQuotes = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        // Simulate API delay for dramatic effect
        setTimeout(async () => {
            try {
                const response = await fetch('http://localhost:3001/api/quotes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();
                setQuotes(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching quotes:', error);
                setLoading(false);
            }
        }, 1500);
    };

    const resetSearch = () => {
        setSearched(false);
        setQuotes([]);
    };

    return (
        <div className="rate-quoting-module">
            <div className="module-header flex items-center justify-between mb-xl">
                <div>
                    <h2 className="text-primary mb-sm">Rate Shopping & Quoting</h2>
                    <p className="text-secondary">Instantly compare carrier rates and transit times</p>
                </div>
            </div>

            <div className="quote-workspace">
                {/* Input Form Column */}
                <div className="card quote-form-card">
                    <h3 className="mb-lg">Shipment Details</h3>
                    <form onSubmit={fetchQuotes} className="flex-col gap-md">
                        <div className="form-group mb-0">
                            <label>Origin</label>
                            <input required type="text" placeholder="Zip code or City, ST" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} disabled={loading} />
                        </div>
                        <div className="lane-connector">
                            <div className="connector-line"></div>
                        </div>
                        <div className="form-group mb-0">
                            <label>Destination</label>
                            <input required type="text" placeholder="Zip code or City, ST" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} disabled={loading} />
                        </div>

                        <div className="form-grid-2 mt-md">
                            <div className="form-group mb-0">
                                <label>Weight (lbs)</label>
                                <input required type="number" placeholder="Total weight" value={formData.weight} onChange={e => handleDimensionChange('weight', e.target.value)} disabled={loading} />
                            </div>
                            <div className="form-group mb-0">
                                <label className="flex items-center gap-xs">Dimensions (L x W x H)</label>
                                <div className="flex gap-xs">
                                    <input type="number" placeholder="L in" value={formData.length} onChange={e => handleDimensionChange('length', e.target.value)} disabled={loading} className="w-full" />
                                    <input type="number" placeholder="W in" value={formData.width} onChange={e => handleDimensionChange('width', e.target.value)} disabled={loading} className="w-full" />
                                    <input type="number" placeholder="H in" value={formData.height} onChange={e => handleDimensionChange('height', e.target.value)} disabled={loading} className="w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="form-group mt-sm mb-0">
                            <div className="flex justify-between items-center mb-xs">
                                <label className="mb-0">Freight Class (NMFC)</label>
                                {formData.length && formData.width && formData.height && formData.weight ? (
                                    <span className="text-xs text-accent flex items-center gap-xs font-medium">
                                        <Scale size={12} /> Auto-calculated by density
                                    </span>
                                ) : null}
                            </div>
                            <select value={formData.freightClass} onChange={e => setFormData({ ...formData, freightClass: e.target.value })} disabled={loading}>
                                {NMFC_CLASSES.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-sm mt-lg">
                            {searched ? (
                                <button type="button" className="btn btn-secondary flex-1" onClick={resetSearch} disabled={loading}>Edit Details</button>
                            ) : null}
                            <button type="submit" className="btn btn-primary flex-1 search-btn" disabled={loading}>
                                {loading ? <Loader className="spin" size={18} /> : <Search size={18} />}
                                {loading ? 'Shopping Rates...' : 'Get Rates'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Column */}
                <div className="quote-results-area">
                    {!searched && !loading ? (
                        <div className="empty-results-state">
                            <div className="animated-pulse-bg"></div>
                            <Navigation size={48} className="text-primary mb-md glow-icon" />
                            <h3>Ready to shop rates</h3>
                            <p className="text-muted text-center max-w-sm">Enter you shipment details on the left to instantly search our network of carriers and find the optimal rate.</p>
                        </div>
                    ) : loading ? (
                        <div className="loading-results-state">
                            <div className="loading-spinner"></div>
                            <h3 className="mt-lg">Analyzing Carrier Network...</h3>
                            <p className="text-muted mt-sm">Comparing rates, transit times, and service levels</p>

                            <div className="loading-steps mt-xl">
                                <div className="loading-step active">
                                    <CheckCircle size={16} className="text-success" /> Validating lane
                                </div>
                                <div className="loading-step active" style={{ animationDelay: '0.4s' }}>
                                    <CheckCircle size={16} className="text-success" /> Querying contract rates
                                </div>
                                <div className="loading-step active" style={{ animationDelay: '0.8s' }}>
                                    <CheckCircle size={16} className="text-success" /> Checking spot market
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="results-container flex-col gap-md fade-in">
                            <div className="flex items-center justify-between mb-sm pr-md">
                                <h3>{quotes.length} Options Found</h3>
                                <span className="text-muted text-sm border p-xs rounded">Sorted by Score</span>
                            </div>

                            {quotes.map((quote, index) => (
                                <div key={index} className={`quote-card card ${index === 0 ? 'recommended' : ''}`}>
                                    {index === 0 && (
                                        <div className="recommended-badge">
                                            <Zap size={14} /> Recommended Choice
                                        </div>
                                    )}

                                    <div className="quote-card-inner">
                                        <div className="carrier-info">
                                            <div className="carrier-logo">{quote.carrier.charAt(0)}</div>
                                            <div>
                                                <h4>{quote.carrier}</h4>
                                                <span className="text-muted text-sm">{quote.service} Service</span>
                                            </div>
                                        </div>

                                        <div className="transit-info">
                                            <Clock size={16} className="text-secondary" />
                                            <div>
                                                <div className="font-medium">{quote.transitDays} Days</div>
                                                <span className="text-muted text-xs">Estimated Transit</span>
                                            </div>
                                        </div>

                                        <div className="rating-info">
                                            <div className="score-circle" style={{ '--score': quote.score } as React.CSSProperties}>
                                                {quote.score}
                                            </div>
                                            <span className="text-muted text-xs">Thoron Score</span>
                                        </div>

                                        <div className="price-action">
                                            <div className="price">${quote.rate.toFixed(2)}</div>
                                            <button className="btn btn-primary btn-sm">Select Rate</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
