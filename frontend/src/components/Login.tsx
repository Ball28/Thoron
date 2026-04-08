import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Swords } from 'lucide-react';
import './Login.css';

export function Login() {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Customer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(name, email, password, role);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <Swords size={56} />
                    <h1>THORON</h1>
                    <p>Transport Management System</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-field">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-field">
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="Customer">Customer</option>
                                <option value="Driver">Driver</option>
                                <option value="Dispatcher">Dispatcher</option>
                            </select>
                        </div>
                    )}

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="login-spinner" />
                        ) : isRegister ? (
                            'Create Account'
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-toggle">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                        {isRegister ? 'Sign In' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}
