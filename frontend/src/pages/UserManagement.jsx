import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ModerationDashboard.css'; // Reuse some layout styles

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('users'); // 'users' or 'logs'
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchData();
    }, [tab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (tab === 'users') {
                const response = await api.get('/users');
                setUsers(response.data.users);
            } else {
                const response = await api.get('/users/logs');
                setLogs(response.data.logs);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setUpdating(userId);
            await api.patch(`/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            setUpdating(userId);
            const newStatus = !currentStatus;
            await api.patch(`/users/${userId}/status`, { isActive: newStatus });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: newStatus } : u));
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    if (currentUser.role !== 'Admin') {
        return <div className="p-8">Access Denied. Admins only.</div>;
    }

    return (
        <div className="moderation-container">
            <h1 className="page-title">👥 User & Activity Management</h1>

            <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn-${tab === 'users' ? 'primary' : 'secondary'}`}
                    onClick={() => setTab('users')}
                >
                    Manage Users
                </button>
                <button
                    className={`btn-${tab === 'logs' ? 'primary' : 'secondary'}`}
                    onClick={() => setTab('logs')}
                >
                    Activity Logs
                </button>
            </div>

            <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : tab === 'users' ? (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            disabled={updating === user._id || user._id === currentUser.id}
                                            className="role-select"
                                        >
                                            <option value="Viewer">Viewer</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.isActive ? 'safe' : 'failed'}`}>
                                            {user.isActive ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {user._id !== currentUser.id && (
                                            <button
                                                className={`btn-text ${user.isActive ? 'text-danger' : 'text-success'}`}
                                                onClick={() => handleStatusToggle(user._id, user.isActive)}
                                                disabled={updating === user._id}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="logs-list">
                        {logs.map(log => (
                            <div key={log._id} className="log-item" style={{
                                padding: '1rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--color-primary)' }}>{log.action}</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                                        User: {log.userId?.name} ({log.userId?.email})
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
                                        Target: {log.targetType} ({log.targetId})
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.6 }}>
                                    {new Date(log.createdAt).toLocaleString()}
                                    <br />
                                    IP: {log.ipAddress || 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .management-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: white;
                }
                .management-table th, .management-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .role-select {
                    background: #2a2a2a;
                    color: white;
                    border: 1px solid #444;
                    padding: 4px;
                    border-radius: 4px;
                }
                .text-danger { color: #ff4444; }
                .text-success { color: #00e676; }
                .log-item:hover { background: rgba(255,255,255,0.02); }
            `}</style>
        </div>
    );
};

export default UserManagement;
