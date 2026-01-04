import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVideoById, updateVideo } from '../services/videoService';
import './UploadVideo.css'; // Reuse styles

const EditVideo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: '',
        status: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const video = await getVideoById(id);
                // Permission check (Client-side UX only, backend enforces security)
                if (user.role !== 'Admin' && user.role !== 'Editor' && user.id !== video.userId._id) {
                    setError('You do not have permission to edit this video');
                    setLoading(false);
                    return;
                }

                setFormData({
                    title: video.title || '',
                    description: video.description || '',
                    tags: video.tags ? video.tags.join(', ') : '',
                    status: video.status || 'uploaded' // Ensure a default value from model
                });
            } catch (err) {
                setError(err.message || 'Failed to fetch video');
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id, user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateVideo(id, {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            });
            setSuccess('Video updated successfully!');
            setTimeout(() => {
                navigate('/videos');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to update video');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="upload-container">
            <div className="upload-header">
                <button onClick={() => navigate('/videos')} className="back-btn">
                    ← Back to Library
                </button>
                <h1 className="upload-title">Edit Video</h1>
                <p className="upload-subtitle">Update video details and settings</p>
            </div>

            <div className="upload-content">
                <form onSubmit={handleSubmit} className="upload-form glass-card">
                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                    <div className="form-section">
                        <label className="form-label">Video Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="text-input"
                            placeholder="Give your video a clear title"
                            required
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="text-input"
                            placeholder="What is your video about?"
                            rows="5"
                        ></textarea>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Tags (comma separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="text-input"
                            placeholder="e.g., travel, nature, vlog"
                        />
                    </div>

                    {/* Status Dropdown - Only for Admins */}
                    {user.role === 'Admin' && (
                        <div className="form-section status-override-section">
                            <label className="form-label">Moderation Decision Override</label>
                            <div className="ai-select-wrapper">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="text-select ai-status-select"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        color: '#fff',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        appearance: 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <option value="safe" style={{ background: '#121212', color: '#00e676' }}> Safe</option>
                                    <option value="flagged" style={{ background: '#121212', color: '#ff4444' }}> Flagged</option>
                                    <option value="failed" style={{ background: '#121212', color: '#ff4444' }}> Reject / Failed</option>
                                </select>
                            </div>
                            <p className="field-hint">Admins can manually override the AI analysis results.</p>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/videos')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <div className="upload-info-sidebar">
                    <div className="info-card glass-card">
                        <h3>Editing Tips</h3>
                        <ul className="info-list">
                            <li>Keep titles concise and descriptive.</li>
                            <li>Use relevant tags to help users find your content.</li>
                            <li>Admins can override the moderation status if needed.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditVideo;
