import React, { useState } from 'react';
import { Search, Loader, CheckCircle, Clock, Navigation, Zap } from 'lucide-react';
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
        freightClass: '50'
    });
    const [quotes, setQuotes] = useState<RateQuote[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

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
                                <input required type="number" placeholder="Enter weight" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} disabled={loading} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Freight Class</label>
                                <select value={formData.freightClass} onChange={e => setFormData({ ...formData, freightClass: e.target.value })} disabled={loading}>
                                    <option value="50">50</option>
                                    <option value="60">60</option>
                                    <option value="70">70</option>
                                    <option value="85">85</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
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
