import ActivityLog from '../models/ActivityLog.js';

/**
 * Log a system activity
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action type (from enum)
 * @param {string} targetId - ID of affected object (video/user)
 * @param {string} targetType - Type of affected object
 * @param {Object} details - Additional metadata
 * @param {Object} req - Express request object for IP and User-Agent
 */
export const logActivity = async (userId, action, targetId = null, targetType = null, details = {}, req = null) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            targetId,
            targetType,
            details,
            ipAddress: req?.ip,
            userAgent: req?.headers['user-agent']
        });
    } catch (error) {
        console.error('[Logging Error]:', error.message);
    }
};
