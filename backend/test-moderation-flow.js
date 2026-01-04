import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processVideo } from './workers/moderationWorker.js';
import Video from './models/Video.js';

dotenv.config();

const testModeration = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Create a dummy video
        const video = await Video.create({
            title: 'Test Safe Video',
            description: 'This is a safe video description',
            userId: new mongoose.Types.ObjectId(), // Fake user ID
            filePath: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Public sample video
            fileName: 'ForBiggerBlazes.mp4',
            fileSize: 1000,
            mimeType: 'video/mp4',
            status: 'pending'
        });

        console.log('Created test video:', video._id);

        // Run moderation (simulating worker call)
        await processVideo(video._id, 'none', video.filePath);

        // Check result
        const updatedVideo = await Video.findById(video._id);
        console.log('Final Status:', updatedVideo.status);
        console.log('Moderation Status:', updatedVideo.moderation.status);

        if (updatedVideo.moderation.status === 'approved' && updatedVideo.status === 'ready') {
            console.log('✅ SAFE video test PASSED');
        } else {
            console.error('❌ SAFE video test FAILED');
        }

        // Create a dummy UNSAFE video
        const unsafeVideo = await Video.create({
            title: 'Test unsafe Video', // "unsafe" keyword triggers flag
            description: 'Contains violence',
            userId: new mongoose.Types.ObjectId(),
            filePath: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            fileName: 'ForBiggerBlazes.mp4',
            fileSize: 1000,
            mimeType: 'video/mp4',
            status: 'pending'
        });

        console.log('Created test UNSAFE video:', unsafeVideo._id);

        await processVideo(unsafeVideo._id, 'none', unsafeVideo.filePath);

        const updatedUnsafeVideo = await Video.findById(unsafeVideo._id);
        console.log('Final Unsafe Status:', updatedUnsafeVideo.status);
        console.log('Moderation Unsafe Status:', updatedUnsafeVideo.moderation.status);

        if (updatedUnsafeVideo.moderation.status === 'rejected' && updatedUnsafeVideo.status === 'failed') {
            console.log('✅ UNSAFE video test PASSED');
        } else {
            console.error('❌ UNSAFE video test FAILED');
        }

        // Cleanup
        await Video.findByIdAndDelete(video._id);
        await Video.findByIdAndDelete(unsafeVideo._id);

        process.exit(0);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

testModeration();
