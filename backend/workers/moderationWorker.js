import Video from '../models/Video.js';
import SystemSettings from '../models/SystemSettings.js';
import { v2 as cloudinary } from 'cloudinary';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { getIO } from '../socket.js';
import { detectUnsafeContent } from '../utils/rekognition.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.resolve(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Emit socket event helper with safety
 */
const emitProgress = (videoId, status, details = {}) => {
    try {
        const io = getIO();
        if (io) {
            io.emit('video_update', { videoId, status, details });
        }
    } catch (e) {
        // Log sparingly to avoid console noise
    }
};

/**
 * Clean up local files for a specific video
 */
const cleanupTempFiles = (videoId, framesDir, localVideoPath, audioPath) => {
    try {
        if (localVideoPath && fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath);
        if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        if (framesDir && fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
        console.log(`[Moderation] Cleanup completed for ${videoId}`);
    } catch (err) {
        console.error(`[Moderation] Cleanup error for ${videoId}:`, err.message);
    }
};

/**
 * Process video for content moderation
 */
export const processVideo = async (videoId, cloudinaryPublicId, videoUrl) => {
    console.log(`[Moderation] Starting process for video ${videoId}...`);

    // Track paths for cleanup
    const localVideoPath = path.join(tempDir, `${videoId}.mp4`);
    const audioPath = path.join(tempDir, `${videoId}.mp3`);
    const framesDir = path.join(tempDir, `${videoId}_frames`);

    try {
        const video = await Video.findById(videoId);
        if (!video) throw new Error('Video record not found in database');

        video.status = 'processing';
        await video.save();
        emitProgress(videoId, 'processing', { stage: 'downloading', progress: 10 });

        // 1. Download video
        const writer = fs.createWriteStream(localVideoPath);
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 1.5. Check Duration (Dynamic)
        const metadata = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(localVideoPath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const duration = metadata.format.duration;
        const settings = await SystemSettings.getSettings();

        console.log(`[Moderation] Video: ${videoId}, Duration: ${duration}s, Limit: ${settings.maxVideoLength}s`);

        if (duration > settings.maxVideoLength) {
            throw new Error(`Video too long (${Math.round(duration)}s). Limit is ${settings.maxVideoLength}s.`);
        }

        // 2. Extract Audio
        emitProgress(videoId, 'processing', { stage: 'extracting_audio', progress: 30 });
        await new Promise((resolve, reject) => {
            ffmpeg(localVideoPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .on('end', resolve)
                .on('error', (err) => {
                    console.warn('[Moderation] Audio extraction failed (might be a silent video):', err.message);
                    resolve(); // Continue even if audio fails
                })
                .save(audioPath);
        });

        // 3. Extract Frames (Scene Detection)
        emitProgress(videoId, 'processing', { stage: 'extracting_frames', progress: 50 });
        if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

        await new Promise((resolve, reject) => {
            ffmpeg(localVideoPath)
                .outputOptions([
                    '-vf', "select='gt(scene,0.15)',scale=320:-1",
                    '-vsync', 'vfr'
                ])
                .output(path.join(framesDir, 'frame-%d.png'))
                .on('end', async () => {
                    const files = fs.readdirSync(framesDir);
                    if (files.length === 0) {
                        // Fallback if no scene changes detected
                        ffmpeg(localVideoPath)
                            .screenshots({ count: 1, folder: framesDir, filename: 'fallback.png' })
                            .on('end', resolve)
                            .on('error', reject);
                    } else {
                        // Limit to 15 key frames to save processing time
                        if (files.length > 15) {
                            files.slice(15).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
                        }
                        resolve();
                    }
                })
                .on('error', reject)
                .run();
        });

        // 4. Visual Analysis with AWS Rekognition
        emitProgress(videoId, 'processing', { stage: 'analyzing_visuals', progress: 70 });

        const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
        let allDetectedLabels = [];
        let hasFlaggedContent = false;

        // Process up to 5 key frames for cost/speed efficiency
        const framesToAnalyze = frameFiles.slice(0, 5);
        for (const frame of framesToAnalyze) {
            const framePath = path.join(framesDir, frame);
            const labels = await detectUnsafeContent(framePath);
            if (labels.length > 0) {
                allDetectedLabels.push(...labels);
                // Flag if high confidence (75%+) items are found
                if (labels.some(l => l.Confidence > 75)) {
                    hasFlaggedContent = true;
                }
            }
        }

        // 4.5. Metadata Fallback (Simulated)
        const unsafeKeywords = ['unsafe', 'violence', 'explicit', 'drugs', 'nude'];
        const metadataText = `${video.title} ${video.description}`.toLowerCase();
        const foundUnsafeMetadata = unsafeKeywords.some(kw => metadataText.includes(kw));

        const foundUnsafe = hasFlaggedContent || foundUnsafeMetadata;

        // 5. Update Database
        const topLabels = [...new Set(allDetectedLabels.map(l => l.Name))];
        const visualScore = hasFlaggedContent ? 0.98 : 0.05;

        video.moderation = {
            checkedAt: new Date(),
            visualScore: visualScore,
            status: foundUnsafe ? 'pending' : 'approved',
            details: {
                framesAnalyzed: frameFiles.length,
                rekognitionLabels: topLabels,
                flags: hasFlaggedContent ? topLabels : (foundUnsafeMetadata ? ['inappropriate_metadata'] : []),
                decisionReason: hasFlaggedContent
                    ? `AI detected sensitive content: ${topLabels.join(', ')}`
                    : (foundUnsafeMetadata ? 'Metadata contains blacklisted terms' : 'Automated checks passed')
            }
        };

        video.status = foundUnsafe ? 'flagged' : 'safe';
        video.markModified('moderation');
        await video.save();

        console.log(`[Moderation] Video ${videoId} marked as ${video.status.toUpperCase()}`);
        emitProgress(videoId, video.status, {
            moderationStatus: video.moderation.status,
            progress: 100
        });

    } catch (error) {
        console.error(`\n[!] AI MODERATION FAILED for video ${videoId}:`);
        console.error(`[!] Reason: ${error.message}`);
        console.error(`[!] Action: Moving video to FLAGGED status for manual review.\n`);

        // Determine if it was a voluntary limit rejection or a system error
        const isLimitError = error.message.includes('Video too long') || error.message.includes('Limit is');
        const targetStatus = isLimitError ? 'failed' : 'flagged';
        const reason = error.message || 'Processing error';

        emitProgress(videoId, targetStatus, { error: reason });

        try {
            await Video.findByIdAndUpdate(videoId, {
                status: targetStatus,
                'moderation.status': targetStatus,
                'moderation.details.decisionReason': reason,
                'moderation.checkedAt': new Date()
            });
        } catch (dbErr) {
            console.error('[Moderation] Could not update failure status in DB:', dbErr.message);
        }
    } finally {
        // ALWAYS cleanup temp files
        cleanupTempFiles(videoId, framesDir, localVideoPath, audioPath);
    }
};