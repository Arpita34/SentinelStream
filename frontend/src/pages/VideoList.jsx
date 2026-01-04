import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVideos, deleteVideo } from '../services/videoService';
import api from '../services/api';
import './VideoList.css';

const VideoList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async (filters = {}) => {
        try {
            setLoading(true);
            console.log('[VideoList] Fetching videos with filters:', filters);
            const response = await getVideos(filters);
            console.log('[VideoList] Fetch success. Count:', response.videos?.length);
            setVideos(response.videos || []);
            setError('');
        } catch (err) {
            console.error('[VideoList] Fetch error:', err);
            setError(err.message || 'Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVideos({ search: searchTerm, tags: selectedTag });
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video?')) {
            return;
        }

        try {
            await deleteVideo(videoId);
            setVideos(videos.filter(v => v._id !== videoId));
        } catch (err) {
            alert(err.message || 'Failed to delete video');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleReprocess = async (videoId) => {
        try {
            await api.post(`/videos/${videoId}/reprocess`);
            alert('Processing started! Check the dashboard.');
            // Optimistic update
            setVideos(prev => prev.map(v => v._id === videoId ? { ...v, status: 'processing', progress: 0 } : v));
        } catch (err) {
            alert(err.response?.data?.message || 'Reprocessing failed');
        }
    };

    const handleModeration = async (videoId, action) => {
        try {
            if (action === 'reject' && !window.confirm('Rejecting will permanently delete this video. Continue?')) {
                return;
            }
            const response = await api.post(`/videos/${videoId}/moderate`, { action }); // action: 'approve' | 'reject'

            if (action === 'reject') {
                setVideos(prev => prev.filter(v => v._id !== videoId));
                alert('Video rejected and deleted');
            } else {
                const updatedVideo = response.data.video;
                setVideos(prev => prev.map(v => v._id === videoId ? updatedVideo : v));
            }
        } catch (err) {
            alert('Moderation failed');
        }
    };

    // RBAC Action Renderer
    const renderRoleBasedAction = (video) => {
        const role = user.role;
        const status = video.status;

        // Processing State
        if (status === 'processing' || status === 'uploaded') {
            return (
                <div style={{ width: '100%', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <small style={{ color: '#aaa' }}>Analyzing...</small>
                        <small style={{ color: '#aaa' }}>{video.progress || 0}%</small>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px' }}>
                        <div style={{ width: `${video.progress || 0}%`, height: '100%', backgroundColor: '#007bff', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                    </div>
                </div>
            );
        }

        // Flagged State
        if (status === 'flagged') {
            if (role === 'Viewer') return <span className="badge badge-warning" style={{ color: 'orange' }}>🚫 Under Review</span>;

            // Editor sees flagged logic - REMOVED early return so it falls through to moderation buttons
            // if (role === 'Editor') return <span className="badge badge-error" style={{ color: 'red' }}>⚠️ Flagged</span>;

            // Admin & Editor Logic
            if (role === 'Admin' || role === 'Editor') {
                const isAdmin = role === 'Admin';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>⚠️ Flagged: {video.moderation?.details?.decisionReason || 'Manual review needed'}</span>

                        {isAdmin ? (
                            <>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ color: '#00e676', borderColor: '#00e676', flex: 1, padding: '4px' }}
                                        onClick={() => handleModeration(video._id, 'approve')}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ color: '#ff4444', borderColor: '#ff4444', flex: 1, padding: '4px' }}
                                        onClick={() => handleModeration(video._id, 'reject')}
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleReprocess(video._id)}
                                    style={{ fontSize: '0.8rem', width: '100%' }}
                                >
                                    🔄 Reprocess
                                </button>
                            </>
                        ) : (
                            <span className="badge badge-error" style={{ color: 'red', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', padding: '4px', borderRadius: '4px' }}>
                                View Only
                            </span>
                        )}
                    </div>
                );
            }
        }

        // Safe State
        if (status === 'safe') {
            return (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className="btn-secondary action-btn"
                        onClick={() => navigate(`/videos/${video._id}`)}
                    >
                        ▶ Play
                    </button>
                    {role === 'Admin' && (
                        <button
                            className="btn-text"
                            onClick={() => handleReprocess(video._id)}
                            title="Reprocess Video"
                            style={{ fontSize: '0.8rem', opacity: 0.7 }}
                        >
                            🔄
                        </button>
                    )}
                </div>
            );
        }

        // Fallback (Pending, etc.)
        return <span style={{ color: '#888' }}>{status}</span>;
    };

    const canEditDelete = (video) => {
        if (!user) return false;
        return user.role === 'Admin' ||
            user.role === 'Editor' ||
            video.userId?._id === user.id ||
            video.userId === user.id;
    };

    const allTags = [...new Set((videos || []).flatMap(v => v?.tags || []))];

    return (
        <div className="video-list-container">
            <div className="video-list-header">
                <div className="header-navigation">
                    <button onClick={() => navigate('/dashboard')} className="back-btn">
                        ← Back to Dashboard
                    </button>
                    <div className="header-content">
                        <h1 className="page-title">Video Library</h1>
                        <p className="page-subtitle">{videos.length} videos available</p>
                    </div>
                </div>

                {(user.role === 'Editor' || user.role === 'Admin') && (
                    <button
                        onClick={() => navigate('/upload')}
                        className="btn-primary upload-btn"
                    >
                        + Upload Video
                    </button>
                )}
            </div>

            {/* Search and Filter */}
            <div className="search-filter-section glass-card">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="btn-primary search-btn">
                        Search
                    </button>
                </form>

                {allTags.length > 0 && (
                    <div className="tag-filter">
                        <button
                            className={`tag-chip ${!selectedTag ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedTag('');
                                fetchVideos({ search: searchTerm });
                            }}
                        >
                            All
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedTag(tag);
                                    fetchVideos({ search: searchTerm, tags: tag });
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {(user.role === 'Admin' || user.role === 'Editor') && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ color: '#fff' }}>Status:</label>
                        <select
                            onChange={(e) => fetchVideos({ search: searchTerm, tags: selectedTag, status: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px' }}
                        >
                            <option value="">All Statuses</option>
                            <option value="safe">Safe (Live)</option>
                            <option value="flagged">Flagged</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {
                loading && (
                    <div className="loading-container">
                        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                        <p>Loading videos...</p>
                    </div>
                )
            }

            {/* Error State */}
            {
                error && !loading && (
                    <div className="alert alert-error">{error}</div>
                )
            }

            {/* Empty State */}
            {
                !loading && !error && videos.length === 0 && (
                    <div className="empty-state glass-card">
                        <div className="empty-icon">📹</div>
                        <h3>No videos found</h3>
                        <p>
                            {searchTerm || selectedTag
                                ? 'Try adjusting your search or filters'
                                : 'Upload your first video to get started'}
                        </p>
                        {(user.role === 'Editor' || user.role === 'Admin') && (
                            <button
                                onClick={() => navigate('/upload')}
                                className="btn-primary"
                                style={{ marginTop: 'var(--spacing-lg)' }}
                            >
                                Upload Video
                            </button>
                        )}
                    </div>
                )
            }

            {/* Video Grid */}
            {
                !loading && !error && videos.length > 0 && (
                    <div className="video-grid">
                        {videos.map(video => (
                            <div key={video._id} className="video-card glass-card fade-in">
                                <div className="video-thumbnail">
                                    <div className="thumbnail-placeholder">
                                        <video src={video.filePath} className="card-thumbnail" muted />
                                    </div>
                                </div>

                                <div className="video-info">
                                    <h3 className="video-title">{video.title}</h3>

                                    {video.description && (
                                        <p className="video-description">
                                            {video.description.length > 100
                                                ? video.description.substring(0, 100) + '...'
                                                : video.description}
                                        </p>
                                    )}

                                    <div className="video-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">👤</span>
                                            <span>{video.userId?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">📅</span>
                                            <span>{formatDate(video.createdAt)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">💾</span>
                                            <span>{formatFileSize(video.fileSize)}</span>
                                        </div>
                                    </div>

                                    {video.tags && video.tags.length > 0 && (
                                        <div className="video-tags">
                                            {video.tags.map((tag, index) => (
                                                <span key={index} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="video-actions">
                                        <button
                                            className="btn-secondary action-btn"
                                            onClick={() => navigate(`/videos/${video._id}`)}
                                        >
                                            View
                                        </button>

                                        {canEditDelete(video) && (
                                            <>
                                                <button
                                                    className="btn-secondary action-btn"
                                                    onClick={() => navigate(`/videos/${video._id}/edit`)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn-secondary action-btn delete-btn"
                                                    onClick={() => handleDelete(video._id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default VideoList;
