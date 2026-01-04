import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'REGISTER',
            'UPLOAD_VIDEO',
            'EDIT_VIDEO',
            'DELETE_VIDEO',
            'MODERATE_VIDEO',
            'REPROCESS_VIDEO',
            'UPDATE_ROLE',
            'UPDATE_STATUS',
            'DEACTIVATE_USER',
            'ACTIVATE_USER',
            'UPDATE_SETTINGS'
        ]
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    targetType: {
        type: String,
        required: false,
        enum: ['Video', 'User']
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Index for performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
