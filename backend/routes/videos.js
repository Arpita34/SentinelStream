import express from 'express';
import Video from '../models/Video.js';
import SystemSettings from '../models/SystemSettings.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// @route   POST /api/videos/upload
router.post('/upload', authenticate, authorize('Editor', 'Admin'), upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a video file' });
        }

        // 1. Fetch dynamic settings
        const settings = await SystemSettings.getSettings();

        // 2. Validate File Size
        const sizeInMB = req.file.size / (1024 * 1024);
        if (sizeInMB > settings.maxFileSize) {
            if (req.file.filename) {
                await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
            }
            return res.status(400).json({
                success: false,
                message: `File too large (${sizeInMB.toFixed(1)}MB). Limit is ${settings.maxFileSize}MB.`
            });
        }

        // 3. Validate Format
        if (!settings.supportedFormats.includes(req.file.mimetype)) {
            if (req.file.filename) {
                await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
            }
            return res.status(400).json({
                success: false,
                message: `Format ${req.file.mimetype} not supported.`
            });
        }

        const { title, description, tags } = req.body;

        // CRITICAL: Match the field name 'filePath' used in WatchVideo.jsx
        // Using req.file.path which is provided by multer-storage-cloudinary
        const videoUrl = req.file.path || req.file.secure_url;

        const newVideo = await Video.create({
            title,
            description: description || '',
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            userId: req.user._id,
            filePath: videoUrl,
            fileName: req.file.originalname,
            cloudinaryPublicId: req.file.filename,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            // Start as 'uploaded' and trigger moderation
            status: 'uploaded',
            moderation: { status: 'pending' }
        });

        await newVideo.populate('userId', 'name email');

        await logActivity(req.user._id, 'UPLOAD_VIDEO', newVideo._id, 'Video', { title: newVideo.title }, req);

        // Trigger background processing
        try {
            const { processVideo } = await import('../workers/moderationWorker.js');
            processVideo(newVideo._id, newVideo.cloudinaryPublicId, newVideo.filePath);
        } catch (workerErr) {
            console.error('Failed to trigger worker:', workerErr);
        }

        res.status(201).json({
            success: true,
            video: newVideo
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/videos/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id).populate('userId', 'name email');

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // We return { success: true, video } because videoService returns response.data
        // and WatchVideo.jsx is now updated to unwrap result.video
        res.status(200).json({
            success: true,
            video: video
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/videos
router.get('/', authenticate, async (req, res) => {
    try {
        // This picks up the { status: 'ready' } sent by videoService.js
        const { status, search, moderationStatus, tags } = req.query;
        let query = {};

        if (status) query.status = status;
        if (moderationStatus) query['moderation.status'] = moderationStatus;
        if (search) query.title = { $regex: search, $options: 'i' };
        if (tags) query.tags = { $in: [tags] }; // Matches if the tag is in the tags array

        // Strictly limit Viewers to safe videos
        if (req.user.role === 'Viewer') {
            query.status = 'safe';
        }

        const videos = await Video.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            videos: videos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching videos' });
    }
});

// @route   PUT /api/videos/:id
// @desc    Update video metadata
router.put('/:id', authenticate, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Check permission (Owner, Editor, or Admin)
        const isOwner = video.userId.toString() === req.user._id.toString();
        const hasPermission = req.user.role === 'Editor' || req.user.role === 'Admin';
        if (!isOwner && !hasPermission) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { title, description, tags, status } = req.body;
        console.log(`[Update] Video ${req.params.id}:`, { title, status });

        if (title) video.title = title;
        if (description !== undefined) video.description = description;
        if (tags) {
            video.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : video.tags;
        }

        if (status && hasPermission) {
            video.status = status;
            // Sync moderation status based on main status
            if (status === 'safe') {
                video.moderation.status = 'approved';
            } else if (status === 'flagged' || status === 'pending') {
                video.moderation.status = 'pending';
            } else if (status === 'failed') {
                video.moderation.status = 'rejected';
            }
            // Mark moderation as modified since it's a nested object
            video.markModified('moderation');
        }

        await video.save();
        console.log(`[Update] Success: ${video.title} (Status: ${video.status})`);

        await logActivity(req.user._id, 'EDIT_VIDEO', video._id, 'Video', {
            title: video.title,
            status: video.status,
            changedFields: Object.keys(req.body)
        }, req);

        await video.populate('userId', 'name email');

        // Return normalized object
        res.status(200).json({ success: true, video });
    } catch (error) {
        console.error('[Update] Error details:', error);
        res.status(500).json({ success: false, message: 'Update failed', error: error.message });
    }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        const isOwner = video.userId.toString() === req.user._id.toString();
        const hasPermission = req.user.role === 'Editor' || req.user.role === 'Admin';

        if (!isOwner && !hasPermission) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete' });
        }

        // Remove from Cloudinary (if exists)
        if (video.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' });
            } catch (err) {
                console.warn('[Delete] Cloudinary delete failed (ignoring):', err.message);
            }
        }

        // Delete from DB
        const videoId = video._id;
        const videoTitle = video.title;
        await video.deleteOne();

        await logActivity(req.user._id, 'DELETE_VIDEO', videoId, 'Video', { title: videoTitle }, req);

        res.status(200).json({ success: true, message: 'Video deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/videos/:id/reprocess
// @desc    Manually trigger video processing (Admin/Editor only)
router.post('/:id/reprocess', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        // Dynamic import to avoid top-level issues during partial edit
        const { processVideo } = await import('../workers/moderationWorker.js');

        processVideo(video._id, video.cloudinaryPublicId, video.filePath);

        res.status(200).json({ success: true, message: 'Processing started in background' });
    } catch (error) {
        console.error('Reprocess error:', error);
        res.status(500).json({ success: false, message: 'Failed to start processing' });
    }
});

router.post('/:id/moderate', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const video = await Video.findById(req.params.id);

        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        if (action === 'approve') {
            video.status = 'safe';
            video.moderation.status = 'approved';
            await video.save();
            await logActivity(req.user._id, 'MODERATE_VIDEO', video._id, 'Video', { action: 'approve' }, req);
            return res.status(200).json({ success: true, video });
        } else if (action === 'reject') {
            // Rejection = Deletion from Cloudinary and DB
            const videoId = video._id;
            const videoTitle = video.title;
            if (video.cloudinaryPublicId) {
                try {
                    await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' });
                } catch (err) {
                    console.warn('[Moderate-Delete] Cloudinary delete failed:', err.message);
                }
            }
            await video.deleteOne();
            await logActivity(req.user._id, 'MODERATE_VIDEO', videoId, 'Video', { action: 'reject', title: videoTitle }, req);
            return res.status(200).json({ success: true, message: 'Video rejected and deleted' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Moderation action error:', error);
        res.status(500).json({ success: false, message: 'Moderation failed' });
    }
});

export default router;