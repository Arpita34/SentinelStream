import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a video title'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    tags: {
        type: [String],
        default: []
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        required: false // Optional for backward compatibility with local storage
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'safe', 'flagged', 'pending', 'failed'],
        default: 'pending' // Hidden until approved
    },
    moderation: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        visualScore: { type: Number, default: 0 },
        adultConfidence: { type: Number, default: 0 },
        details: { type: Object }, // Store full Cloudinary/AI response
        checkedAt: { type: Date }
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ status: 1 });

// Virtual for formatted file size
videoSchema.virtual('formattedSize').get(function () {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
