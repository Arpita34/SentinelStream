import express from 'express';
import SystemSettings from '../models/SystemSettings.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get current system settings (Private)
router.get('/', authenticate, async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

// @route   PUT /api/settings
// @desc    Update system settings (Admin only)
router.put('/', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { maxFileSize, maxVideoLength, supportedFormats } = req.body;

        const settings = await SystemSettings.getSettings();

        if (maxFileSize !== undefined) settings.maxFileSize = maxFileSize;
        if (maxVideoLength !== undefined) settings.maxVideoLength = maxVideoLength;
        if (supportedFormats !== undefined) settings.supportedFormats = supportedFormats;

        settings.updatedBy = req.user._id;
        await settings.save();

        await logActivity(req.user._id, 'UPDATE_SETTINGS', null, null, {
            newSettings: req.body
        }, req);

        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error('[Settings Update Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

export default router;
