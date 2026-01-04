import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/**
 * Storage configuration for Cloudinary
 * We use an async function for params to ensure the 'video' resource type 
 * is correctly applied and the full URL is returned.
 */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Extract file extension or use a default
        const fileExtension = file.originalname.split('.').pop();

        return {
            folder: 'video-platform/videos',
            resource_type: 'video', // Forces Cloudinary to treat this as a video
            format: fileExtension,
            public_id: `vid_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
            // Transformations are better applied on delivery, but keeping auto quality
            transformation: [{ quality: 'auto' }]
        };
    }
});

/**
 * Filter to ensure only video mimetypes are accepted
 */
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/webm'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

export default upload;