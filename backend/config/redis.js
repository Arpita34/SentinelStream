import { Redis } from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null, // Required for BullMQ
};

// Create a Redis connection instance
const connection = new Redis(redisConfig);

connection.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

connection.on('connect', () => {
    console.log('✅ Redis Connected');
});

export default connection;
