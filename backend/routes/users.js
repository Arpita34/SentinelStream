import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// @route   PATCH /api/users/:id/role
// @desc    Update user role (Admin only)
router.patch('/:id/role', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['Viewer', 'Editor', 'Admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await logActivity(req.user._id, 'UPDATE_ROLE', user._id, 'User', { newRole: role }, req);

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

// @route   PATCH /api/users/:id/status
// @desc    Toggle user active status (Admin only)
router.patch('/:id/status', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
        await logActivity(req.user._id, action, user._id, 'User', {}, req);

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

// @route   GET /api/users/logs
// @desc    Get activity logs (Admin only)
router.get('/logs', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const logs = await ActivityLog.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
});

export default router;
