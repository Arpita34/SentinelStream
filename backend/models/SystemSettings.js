import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    maxFileSize: {
        type: Number,
        default: 100, // in MB
        required: true
    },
    maxVideoLength: {
        type: Number,
        default: 600, // in seconds (10 mins)
        required: true
    },
    supportedFormats: {
        type: [String],
        default: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Singleton pattern helper to get or create settings
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
