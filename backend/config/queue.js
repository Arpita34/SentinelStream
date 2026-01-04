import { Queue } from 'bullmq';
import connection from '../config/redis.js';

// Create a new queue for moderation jobs
const moderationQueue = new Queue('moderation-queue', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export default moderationQueue;
