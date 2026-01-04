import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // CRITICAL: Ensures all returned URLs (filePath) use https://
});

// Verify configuration
const isConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

if (!isConfigured) {
    console.error('❌ Cloudinary credentials missing in .env file!');
} else {
    console.log('✅ Cloudinary configured successfully (Secure: true)');
}

export default cloudinary;