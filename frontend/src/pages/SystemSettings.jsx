import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ModerationDashboard.css';

const SystemSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        maxFileSize: 100,
        maxVideoLength: 600,
        supportedFormats: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const allFormats = [
        { label: 'MP4 (video/mp4)', value: 'video/mp4' },
        { label: 'WebM (video/webm)', value: 'video/webm' },
        { label: 'QuickTime (video/quicktime)', value: 'video/quicktime' },
        { label: 'MPEG (video/mpeg)', value: 'video/mpeg' },
        { label: 'AVI (video/x-msvideo)', value: 'video/x-msvideo' },
        { label: 'MKV (video/x-matroska)', value: 'video/x-matroska' }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/settings');
            if (response.data.settings) {
                setSettings({
                    ...response.data.settings,
                    supportedFormats: response.data.settings.supportedFormats || []
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });
            await api.put('/settings', settings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const toggleFormat = (format) => {
        setSettings(prev => ({
            ...prev,
            supportedFormats: prev.supportedFormats.includes(format)
                ? prev.supportedFormats.filter(f => f !== format)
                : [...prev.supportedFormats, format]
        }));
    };

    if (user.role !== 'Admin') {
        return <div className="p-8">Access Denied. Admins only.</div>;
    }

    return (
        <div className="moderation-container">
            <h1 className="page-title">⚙️ System Configuration</h1>

            <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="form-group">
                            <label>Maximum File Size (MB)</label>
                            <input
                                type="number"
                                value={settings.maxFileSize}
                                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                                className="settings-input"
                                min="1"
                                max="1024"
                            />
                            <p className="field-hint">Maximum weight of a single video upload.</p>
                        </div>

                        <div className="form-group">
                            <label>Maximum Video Length (Seconds)</label>
                            <input
                                type="number"
                                value={settings.maxVideoLength}
                                onChange={(e) => setSettings({ ...settings, maxVideoLength: parseInt(e.target.value) })}
                                className="settings-input"
                                min="1"
                            />
                            <p className="field-hint">e.g. 600 = 10 minutes. Videos longer than this will be rejected.</p>
                        </div>

                        <div className="form-group">
                            <label>Supported Formats</label>
                            <div className="formats-grid">
                                {allFormats.map(format => (
                                    <div
                                        key={format.value}
                                        className={`format-tile ${settings.supportedFormats.includes(format.value) ? 'active' : ''}`}
                                        onClick={() => toggleFormat(format.value)}
                                    >
                                        {format.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {message.text && (
                            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                {message.text}
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={saving}
                                style={{ width: '200px' }}
                            >
                                {saving ? 'Saving...' : '💾 Save Settings'}
                            </button>
                            <button
                                type="button"
                                onClick={fetchSettings}
                                className="btn-secondary"
                                disabled={saving}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
                .settings-form { display: flex; flex-direction: column; gap: 2rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .settings-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 0.8rem;
                    border-radius: 8px;
                    font-size: 1rem;
                }
                .field-hint { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin: 0; }
                .formats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-top: 0.5rem;
                }
                .format-tile {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.8rem;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }
                .format-tile.active {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
                }
                .alert { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
                .alert-success { background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid #00e676; }
                .alert-error { background: rgba(255, 68, 68, 0.1); color: #ff4444; border: 1px solid #ff4444; }
            `}</style>
        </div>
    );
};

export default SystemSettings;
