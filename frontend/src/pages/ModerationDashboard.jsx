import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ModerationDashboard.css';
import { io } from 'socket.io-client';

const ModerationDashboard = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [stats, setStats] = useState({ pending: 0, flagged: 0, approved: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Socket.io connection
    useEffect(() => {
        const socket = io('http://localhost:5001');

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('video_update', (data) => {
            console.log('Video Update:', data);

            // Update the specific video in the list
            setVideos(prevVideos => prevVideos.map(video => {
                if (video._id === data.videoId) {
                    return {
                        ...video,
                        status: data.status,
                        progress: data.details.progress, // Store progress
                        moderation: {
                            ...video.moderation,
                            status: data.details.moderationStatus || video.moderation?.status || 'pending',
                            visualScore: data.details.visualScore || video.moderation?.visualScore || 0
                        }
                    };
                }
                return video;
            }));

            // Optionally refresh stats if status changes to safe/flagged
            if (data.status === 'safe' || data.status === 'flagged') {
                // fetchModerationData(); // Uncomment if you want full refresh, but might be jarring
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        fetchModerationData();
    }, []);

    const fetchModerationData = async () => {
        try {
            setLoading(true);
            // Fetch all pending/flagged videos
            // Mock enhancement: In a real app, we'd have a specific /moderation endpoint
            // For now, let's filter the general video list or assume the API returns pending for admins

            // Actually, let's create a dedicated fetch since the general list might hide pending
            // But since we are admin, the general list DOES show pending/flagged based on our previous logic modification?
            // Wait, we modified GET /api/videos to show 'status' filter. 
            // Let's fetch pending and flagged.

            const [pendingRes] = await Promise.all([
                api.get('/videos?moderationStatus=pending')
            ]);

            // Allow processing videos to show up too (if they were pending but now processing)
            // In a real app we'd fetch 'processing' status too.
            // Let's assume the API returns them in the pending list or we fetch them explicitly
            const processingRes = await api.get('/videos?status=processing').catch(() => ({ data: { videos: [] } }));

            const all = [
                ...(pendingRes.data.videos || [])
            ];

            // Dedup just in case
            const unique = Array.from(new Map(all.map(item => [item._id, item])).values());

            setVideos(unique);

            // Calculate stats
            setStats({
                pending: pendingRes.data.videos?.length || 0,
                flagged: 0,
                approved: 0
            });

        } catch (error) {
            console.error('Failed to fetch moderation data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (videoId, status) => {
        try {
            if (status === 'rejected') {
                if (!window.confirm('Rejecting this video will permanently delete it from the system. Are you sure?')) {
                    return;
                }
                await api.post(`/videos/${videoId}/moderate`, { action: 'reject' });
            } else {
                await api.post(`/videos/${videoId}/moderate`, { action: 'approve' });
            }
            // Update UI
            setVideos(prev => prev.filter(v => v._id !== videoId));
            setSelectedVideo(null);
            fetchModerationData(); // Refresh stats
        } catch (error) {
            alert('Moderation failed');
        }
    };

    const handleReprocess = async (videoId) => {
        try {
            await api.post(`/videos/${videoId}/reprocess`);
            alert('Processing triggered! The video status will update live.');
            fetchModerationData();
        } catch (error) {
            alert('Failed to trigger reprocessing');
        }
    };

    if (user.role !== 'Admin' && user.role !== 'Editor') { // Assuming Editors can moderate too? Or just Admin. User said 'admin review interface'
        return <div className="p-8">Access Denied. Admins only.</div>;
    }

    return (
        <div className="moderation-container">
            <h1 className="page-title">🛡️ Content Moderation</h1>

            <div className="stats-grid">
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <div className="count">{stats.pending}</div>
                </div>
                <div className="stat-card flagged">
                    <h3>Flagged</h3>
                    <div className="count">{stats.flagged}</div>
                </div>
            </div>

            <div className="moderation-content">
                <div className="video-list-sidebar">
                    <h3>Queue ({videos.length})</h3>
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : (
                        <div className="queue-list">
                            {videos.map(video => (
                                <div
                                    key={video._id}
                                    className={`queue-item ${selectedVideo?._id === video._id ? 'active' : ''}`}
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    <div className="queue-item-info">
                                        <div className="queue-title">{video.title}</div>
                                        <div className="queue-meta">
                                            <span className={`status-badge ${video.moderation?.status || video.status}`}>
                                                {video.status === 'processing' ? 'Processing...' : (video.moderation?.status || video.status)}
                                            </span>
                                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {video.status === 'processing' && (
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${video.progress || 0}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                    {video.moderation?.visualScore > 0.5 && video.status !== 'processing' && (
                                        <div className="risk-indicator high">⚠️ High Risk</div>
                                    )}
                                </div>
                            ))}
                            {videos.length === 0 && <div className="empty-queue">All caught up! 🎉</div>}
                        </div>
                    )}
                </div>

                <div className="preview-panel glass-card">
                    {selectedVideo ? (
                        <>
                            <div className="video-player-wrapper">
                                <video
                                    src={selectedVideo.filePath}
                                    controls
                                    className="moderation-player"
                                />
                            </div>

                            <div className="moderation-controls">
                                <div className="video-details">
                                    <h2>{selectedVideo.title}</h2>
                                    <p>{selectedVideo.description}</p>

                                    <div className="ai-insight">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4>🤖 AI Analysis</h4>
                                            <button
                                                className="btn-text"
                                                onClick={() => handleReprocess(selectedVideo._id)}
                                                style={{ fontSize: '0.8rem', opacity: 0.8 }}
                                                title="Trigger AI analysis again"
                                            >
                                                🔄 Reprocess
                                            </button>
                                        </div>
                                        <div className="insight-grid">
                                            <div className="insight-item">
                                                <label>Confidence</label>
                                                <div className="score">
                                                    {(selectedVideo.moderation?.details?.moderation_confidence * 100)?.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="insight-item">
                                                <label>Auto-Status</label>
                                                <div className="value">{selectedVideo.moderation?.details?.status || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="action-buttons">
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleDecision(selectedVideo._id, 'rejected')}
                                        title="Rejected videos will be permanently deleted"
                                    >
                                        🗑️ Reject & Delete
                                    </button>
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleDecision(selectedVideo._id, 'approved')}
                                    >
                                        ✅ Approve
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <span className="icon">👈</span>
                            <p>Select a video from the queue to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModerationDashboard;
