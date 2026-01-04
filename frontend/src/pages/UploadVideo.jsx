import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadVideo } from '../services/videoService';
import api from '../services/api';
import './UploadVideo.css';

const UploadVideo = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: ''
    });
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [settings, setSettings] = useState({
        maxFileSize: 100,
        maxVideoLength: 600,
        supportedFormats: ['video/mp4', 'video/mpeg', 'video/quicktime']
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data.settings) {
                    setSettings(response.data.settings);
                }
            } catch (err) {
                console.warn('Failed to fetch upload settings, using defaults');
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        // Check file type (Dynamic)
        if (!settings.supportedFormats.includes(selectedFile.type)) {
            setError(`Format ${selectedFile.type} is not supported. Supported: ${settings.supportedFormats.join(', ')}`);
            return;
        }

        // Check file size (Dynamic)
        const maxSizeInBytes = settings.maxFileSize * 1024 * 1024;
        if (selectedFile.size > maxSizeInBytes) {
            setError(`File size exceeds limit (${settings.maxFileSize}MB)`);
            return;
        }

        // Check duration (Dynamic) - using a temporary video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function () {
            window.URL.revokeObjectURL(video.src);
            const duration = Math.round(video.duration);
            if (duration > settings.maxVideoLength) {
                setError(`Video too long (${duration}s). Maximum allowed is ${settings.maxVideoLength}s.`);
                setFile(null);
            } else {
                setFile(selectedFile);
                setError('');
            }
        };
        video.onerror = function () {
            setError('Could not read video metadata.');
        };
        video.src = URL.createObjectURL(selectedFile);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!file) {
            setError('Please select a video file');
            return;
        }

        if (!formData.title.trim()) {
            setError('Please provide a video title');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const metadata = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            const response = await uploadVideo(file, metadata, (progress) => {
                setUploadProgress(progress);
            });

            setSuccess('Video uploaded! Redirecting to status page...');

            // Redirect to the specific video page to watch processing
            const newVideoId = response.video?._id || response._id;
            setTimeout(() => {
                navigate(`/videos/${newVideoId}`);
            }, 1000);

            // Reset form
            setFile(null);
            setUploadProgress(0);

            // Store the ID of the new video (assuming backend returns it in `video._id`)
            // The uploadVideo service returns response.data
            // Backend returns: { success: true, message: ..., video: { _id: ... } }
            // Let's store the video to show buttons
            setUploadedVideo(response.video);

            // Remove auto-redirect
            // setTimeout(() => { navigate('/videos'); }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to upload video');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // New state for the success options
    const [uploadedVideo, setUploadedVideo] = useState(null);

    // If successful upload, show options instead of form
    if (success && uploadedVideo) {
        return (
            <div className="upload-container">
                <div className="upload-header">
                    <h1 className="upload-title">Upload Complete! 🎉</h1>
                    <p className="upload-subtitle">Your video is being processed.</p>
                </div>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '1rem' }}>{uploadedVideo.title}</h2>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button
                            className="btn-primary"
                            onClick={() => navigate(`/videos/${uploadedVideo._id}`)}
                        >
                            ▶ Watch Video
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/videos')}
                        >
                            Go to Library
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setSuccess('');
                                setUploadedVideo(null);
                            }}
                        >
                            Upload Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <button onClick={() => navigate('/videos')} className="back-btn">
                    ← Back to Videos
                </button>
                <h1 className="upload-title">Upload Video</h1>
                <p className="upload-subtitle">Share your content with the platform</p>
            </div>

            <div className="upload-content">
                <form onSubmit={handleSubmit} className="upload-form glass-card">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {/* File Upload Area */}
                    <div className="form-section">
                        <label className="form-label">Video File *</label>
                        <div
                            className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                type="file"
                                id="file-input"
                                accept="video/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />

                            {!file ? (
                                <>
                                    <div className="upload-icon">📹</div>
                                    <p className="drop-text">Drag & drop your video here</p>
                                    <p className="drop-subtext">or click to browse</p>
                                    <p className="file-requirements">
                                        {(settings?.supportedFormats || []).map(f => f && f.includes('/') ? f.split('/')[1].toUpperCase() : f).join(', ')}
                                        (Max {settings?.maxFileSize || 100}MB, {settings?.maxVideoLength || 600}s)
                                    </p>
                                </>
                            ) : (
                                <div className="file-preview">
                                    <div className="file-icon">🎬</div>
                                    <div className="file-info">
                                        <p className="file-name">{file.name}</p>
                                        <p className="file-size">{formatFileSize(file.size)}</p>
                                    </div>
                                    {!uploading && (
                                        <button
                                            type="button"
                                            className="remove-file-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="progress-section">
                            <div className="progress-header">
                                <span>Uploading...</span>
                                <span className="progress-percentage">{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="form-section">
                        <label htmlFor="title" className="form-label">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter video title"
                            required
                            disabled={uploading}
                            maxLength="200"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-section">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your video..."
                            rows="4"
                            disabled={uploading}
                            maxLength="2000"
                        ></textarea>
                    </div>

                    {/* Tags */}
                    <div className="form-section">
                        <label htmlFor="tags" className="form-label">Tags</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="tutorial, education, entertainment (comma-separated)"
                            disabled={uploading}
                        />
                        <p className="field-hint">Separate tags with commas</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn-primary upload-submit"
                        disabled={uploading || !file}
                    >
                        {uploading ? (
                            <>
                                <span className="spinner"></span>
                                <span style={{ marginLeft: '8px' }}>Uploading {uploadProgress}%</span>
                            </>
                        ) : (
                            'Upload Video'
                        )}
                    </button>
                </form>

                {/* Info Sidebar */}
                <div className="upload-info-sidebar">
                    <div className="info-card glass-card">
                        <h3>📋 Upload Guidelines</h3>
                        <ul className="info-list">
                            <li>Maximum file size: {settings?.maxFileSize || 100}MB</li>
                            <li>Maximum duration: {settings?.maxVideoLength || 600} seconds</li>
                            <li>Supported formats: {(settings?.supportedFormats || []).map(f => f && f.includes('/') ? f.split('/')[1].toUpperCase() : f).join(', ')}</li>
                            <li>Add descriptive titles and tags</li>
                            <li>Provide detailed descriptions</li>
                        </ul>
                    </div>

                    <div className="info-card glass-card">
                        <h3>✨ Tips</h3>
                        <ul className="info-list">
                            <li>Use clear, descriptive titles</li>
                            <li>Add relevant tags for discoverability</li>
                            <li>Write detailed descriptions</li>
                            <li>Ensure good video quality</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadVideo;
