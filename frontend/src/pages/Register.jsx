import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Viewer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await register(formData.name, formData.email, formData.password, formData.role);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            <div className="auth-card glass-card fade-in">
                <div className="auth-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <path d="M15 10L30 20L15 30V10Z" fill="url(#gradient)" />
                                <defs>
                                    <linearGradient id="gradient" x1="15" y1="10" x2="30" y2="30">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join our video management platform</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Your Role</label>
                        <div className="role-selector">
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="viewer"
                                    name="role"
                                    value="Viewer"
                                    checked={formData.role === 'Viewer'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="viewer" className="role-label">
                                    <div className="role-icon">👁️</div>
                                    <div className="role-name">Viewer</div>
                                    <div className="role-description">Read-only access</div>
                                </label>
                            </div>

                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="editor"
                                    name="role"
                                    value="Editor"
                                    checked={formData.role === 'Editor'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="editor" className="role-label">
                                    <div className="role-icon">✏️</div>
                                    <div className="role-name">Editor</div>
                                    <div className="role-description">Upload & edit videos</div>
                                </label>
                            </div>

                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="admin"
                                    name="role"
                                    value="Admin"
                                    checked={formData.role === 'Admin'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="admin" className="role-label">
                                    <div className="role-icon">⚙️</div>
                                    <div className="role-name">Admin</div>
                                    <div className="role-description">Full system access</div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                <span style={{ marginLeft: '8px' }}>Creating account...</span>
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>

            <div className="auth-info">
                <p className="text-secondary">
                    Secure authentication powered by JWT
                </p>
            </div>
        </div>
    );
};

export default Register;
