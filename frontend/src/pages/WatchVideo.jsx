import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideoById } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import './WatchVideo.css';

const WatchVideo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                const data = await getVideoById(id);
                setVideo(data);
            } catch (err) {
                console.error('Error fetching video:', err);
                setError(err.message || 'Failed to load video');
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id]);

    if (loading) {
        return (
            <div className="watch-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="watch-container">
                <div className="alert alert-error">{error || 'Video not found'}</div>
                <button onClick={() => navigate('/videos')} className="back-btn">
                    Back to Library
                </button>
            </div>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="watch-container fade-in">
            <div className="video-player-wrapper">
                <video
                    src={video.filePath}
                    controls
                    className="main-player"
                    autoPlay
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="video-details-section">
                <div className="media-info-box">
                    <div className="info-thumbnail-wrapper">
                        {/* Use the video filePath as a source for a simple preview image if a thumbnail isn't separately provided */}
                        <video src={video.filePath} className="info-thumbnail" />
                    </div>

                    <div className="info-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h1 className="video-title">{video.title}</h1>
                            <button onClick={() => navigate('/videos')} className="back-btn">
                                ← Back
                            </button>
                        </div>

                        <div className="video-meta-row">
                            <span>👤 {video.userId?.name || 'Unknown'}</span>
                            <span className="separator">•</span>
                            <span>📅 {formatDate(video.createdAt)}</span>
                        </div>

                        {/* Moderation Actions for Admin/Editor - Moved Inside Info Content */}
                        {(user?.role === 'Admin' || user?.role === 'Editor') && (
                            <div className="moderation-bar glass-card" style={{
                                padding: '1rem',
                                marginBottom: '0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: video.status === 'flagged' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                border: video.status === 'flagged' ? '1px solid rgba(255, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <div>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: video.status === 'flagged' ? '#ff4444' : '#00e676',
                                        textTransform: 'uppercase',
                                        fontSize: '0.9rem'
                                    }}>
                                        {video.status === 'flagged' ? '⚠️ Flagged' : '✓ Safe'}
                                    </span>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                        {video.moderation?.details?.decisionReason || 'Automated analysis complete'}
                                    </p>
                                </div>

                                {user.role === 'Admin' && video.status !== 'safe' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '6px 16px', background: '#00e676', borderColor: '#00e676' }}
                                            onClick={async () => {
                                                if (window.confirm('Mark this video as Safe and make it live?')) {
                                                    try {
                                                        const { default: api } = await import('../services/api');
                                                        await api.post(`/videos/${video._id}/moderate`, { action: 'approve' });
                                                        window.location.reload();
                                                    } catch (err) { alert('Failed to approve'); }
                                                }
                                            }}
                                        > Approve </button>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '6px 16px', color: '#ff4444', borderColor: '#ff4444' }}
                                            onClick={async () => {
                                                if (window.confirm('Rejecting will delete this video. Continue?')) {
                                                    try {
                                                        const { default: api } = await import('../services/api');
                                                        await api.post(`/videos/${video._id}/moderate`, { action: 'reject' });
                                                        navigate('/videos');
                                                    } catch (err) { alert('Failed to reject'); }
                                                }
                                            }}
                                        > Reject </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="video-description-box">
                    <h3>Description</h3>
                    <p>{video.description || 'No description provided.'}</p>
                </div>

                {video.tags && video.tags.length > 0 && (
                    <div className="video-tags" style={{ marginTop: '1rem' }}>
                        {video.tags.map(tag => (
                            <span key={tag} className="tag" style={{
                                marginRight: '8px',
                                padding: '4px 8px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: 'var(--color-accent-primary)'
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchVideo;
