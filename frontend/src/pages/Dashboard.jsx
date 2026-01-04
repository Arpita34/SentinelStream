import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Viewer':
                return '👁️';
            case 'Editor':
                return '✏️';
            case 'Admin':
                return '⚙️';
            default:
                return '👤';
        }
    };

    const getRoleDescription = (role) => {
        switch (role) {
            case 'Viewer':
                return 'You have read-only access to assigned videos';
            case 'Editor':
                return 'You can upload, edit, and manage video content';
            case 'Admin':
                return 'You have full system access including user management';
            default:
                return '';
        }
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav glass-card">
                <div className="nav-brand">
                    <div className="nav-logo">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                            <path d="M15 10L30 20L15 30V10Z" fill="url(#gradient)" />
                            <defs>
                                <linearGradient id="gradient" x1="15" y1="10" x2="30" y2="30">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="nav-title">Video Platform</span>
                </div>
                <button onClick={logout} className="btn-secondary logout-btn">
                    Logout
                </button>
            </nav>

            <main className="dashboard-main">
                <div className="welcome-section fade-in">
                    <div className="welcome-card glass-card">
                        <div className="welcome-header">
                            <div className="user-avatar">
                                <span className="avatar-text">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="welcome-text">
                                <h1>Welcome back, {user?.name}!</h1>
                                <p className="user-email">{user?.email}</p>
                            </div>
                        </div>

                        <div className="role-badge-container">
                            <div className={`role-badge role-${user?.role?.toLowerCase()}`}>
                                <span className="role-badge-icon">{getRoleIcon(user?.role)}</span>
                                <div className="role-badge-text">
                                    <div className="role-badge-title">{user?.role}</div>
                                    <div className="role-badge-description">
                                        {getRoleDescription(user?.role)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="features-section">
                    <h2 className="section-title">Your Capabilities</h2>
                    <div className="features-grid">
                        {user?.role === 'Viewer' && (
                            <>
                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/videos')}>
                                    <div className="feature-icon">📹</div>
                                    <h3>View Videos</h3>
                                    <p>Access and watch assigned video content</p>
                                </div>

                            </>
                        )}

                        {user?.role === 'Editor' && (
                            <>
                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/upload')}>
                                    <div className="feature-icon">📤</div>
                                    <h3>Upload Videos</h3>
                                    <p>Upload new video content to the platform</p>
                                </div>
                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/videos')}>
                                    <div className="feature-icon">✂️</div>
                                    <h3>Edit Content</h3>
                                    <p>Modify and manage your video library</p>
                                </div>

                            </>
                        )}

                        {user?.role === 'Admin' && (
                            <>
                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/admin/users')}>
                                    <div className="feature-icon">👥</div>
                                    <h3>User Management</h3>
                                    <p>Create, edit, and manage user accounts</p>
                                </div>
                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/admin/settings')}>
                                    <div className="feature-icon">⚙️</div>
                                    <h3>System Settings</h3>
                                    <p>Configure platform settings and preferences</p>
                                </div>

                                <div className="feature-card glass-card fade-in" onClick={() => navigate('/videos')}>
                                    <div className="feature-icon">📹</div>
                                    <h3>Content Control</h3>
                                    <p>Full access to all video content</p>
                                </div>

                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
