import dotenv from 'dotenv';

// Load .env file
dotenv.config();

console.log('\n=== Environment Variables Test ===\n');

// Test all variables
const vars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Show first 10 chars only for security
        const preview = value.length > 10 ? value.substring(0, 10) + '...' : value;
        console.log(`✅ ${varName}: ${preview}`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log('\n=== Raw Check ===');
console.log('CLOUDINARY_CLOUD_NAME length:', process.env.CLOUDINARY_CLOUD_NAME?.length || 0);
console.log('CLOUDINARY_API_KEY length:', process.env.CLOUDINARY_API_KEY?.length || 0);
console.log('CLOUDINARY_API_SECRET length:', process.env.CLOUDINARY_API_SECRET?.length || 0);

console.log('\n=== Done ===\n');
