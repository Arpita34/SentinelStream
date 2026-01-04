# Cloudinary Setup Guide

## 🎯 Overview

Your video platform now uses **Cloudinary** for cloud storage instead of local file storage. Videos are automatically uploaded to Cloudinary with optimization.

---

## 📋 Setup Steps

### Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up Free"**
3. Create your account (free tier includes 25GB storage)
4. Verify your email

### Step 2: Get Your Credentials

1. Log in to [Cloudinary Console](https://cloudinary.com/console)
2. On the dashboard, you'll see:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Copy these values

### Step 3: Configure Backend

1. Open `e:\New folder\backend\.env` (it's gitignored, so you need to edit it manually)
2. Add your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 4: Restart Backend Server

The backend server needs to be restarted to load the new environment variables.

**In your backend terminal:**
1. Press `Ctrl+C` to stop the server
2. Run `npm run dev` to restart

---

## ✅ What Changed

### Backend Changes

#### 1. **Upload Middleware** ([middleware/upload.js](file:///e:/New%20folder/backend/middleware/upload.js))
- Now uses `CloudinaryStorage` instead of `diskStorage`
- Videos upload directly to Cloudinary
- Automatic quality optimization
- Files stored in `video-platform/videos/` folder on Cloudinary

#### 2. **Video Model** ([models/Video.js](file:///e:/New%20folder/backend/models/Video.js))
- Added `cloudinaryPublicId` field
- Stores Cloudinary's public ID for deletion

#### 3. **Upload Route** ([routes/videos.js](file:///e:/New%20folder/backend/routes/videos.js))
- Stores Cloudinary URL in `filePath`
- Stores `public_id` in `cloudinaryPublicId`
- Handles Cloudinary-specific file properties

#### 4. **Delete Route** ([routes/videos.js](file:///e:/New%20folder/backend/routes/videos.js))
- Deletes from Cloudinary using `public_id`
- Uses `cloudinary.uploader.destroy()` API

---

## 🧪 Testing

### Test Upload

1. Make sure you've added Cloudinary credentials to `.env`
2. Restart backend server
3. Login to your app as Editor/Admin
4. Go to Upload page
5. Upload a video
6. **Check Cloudinary Console**:
   - Go to [Media Library](https://cloudinary.com/console/media_library)
   - Navigate to `video-platform/videos/` folder
   - Your video should appear there!

### Test Delete

1. In your app, go to Video List
2. Click Delete on a video
3. **Check Cloudinary Console**:
   - The video should be removed from Media Library

---

## 📊 Cloudinary Features

### What You Get

- ✅ **25GB storage** (free tier)
- ✅ **25GB bandwidth/month** (free tier)
- ✅ **Automatic optimization**
- ✅ **Global CDN delivery**
- ✅ **Video transformations** (resize, crop, etc.)
- ✅ **Automatic format conversion**

### File Structure on Cloudinary

```
video-platform/
  └── videos/
      ├── video1.mp4
      ├── video2.mov
      └── video3.webm
```

---

## 🔧 Configuration Options

### Change Upload Folder

Edit [middleware/upload.js](file:///e:/New%20folder/backend/middleware/upload.js):

```javascript
params: {
  folder: 'your-custom-folder/videos', // Change this
  resource_type: 'video',
  // ...
}
```

### Change File Size Limit

Edit [middleware/upload.js](file:///e:/New%20folder/backend/middleware/upload.js):

```javascript
limits: {
  fileSize: 200 * 1024 * 1024 // Change to 200MB
}
```

### Add Video Transformations

Edit [middleware/upload.js](file:///e:/New%20folder/backend/middleware/upload.js):

```javascript
params: {
  folder: 'video-platform/videos',
  resource_type: 'video',
  transformation: [
    { quality: 'auto' },
    { width: 1920, height: 1080, crop: 'limit' } // Add this
  ]
}
```

---

## 🆚 Local vs Cloudinary Storage

| Feature | Local Storage | Cloudinary |
|---------|--------------|------------|
| Storage Location | Your server disk | Cloud (global CDN) |
| Scalability | Limited by disk | Unlimited |
| Backup | Manual | Automatic |
| CDN | No | Yes |
| Optimization | No | Automatic |
| Cost | Free (uses disk) | Free tier: 25GB |
| Access Speed | Server-dependent | Fast (CDN) |

---

## 🔐 Security

- ✅ API credentials stored in `.env` (gitignored)
- ✅ Never commit `.env` to version control
- ✅ Use different credentials for production
- ✅ Cloudinary provides signed URLs for private content

---

## 📝 Troubleshooting

### Error: "Invalid credentials"

**Solution:** Double-check your Cloudinary credentials in `.env`

### Error: "Upload failed"

**Possible causes:**
1. Cloudinary credentials not set
2. Backend server not restarted after adding credentials
3. File size exceeds limit
4. Network connection issue

**Solution:**
1. Verify credentials in `.env`
2. Restart backend: `Ctrl+C` then `npm run dev`
3. Check file size (must be < 100MB)
4. Check internet connection

### Videos not appearing in Cloudinary Console

**Solution:**
1. Check folder path: `video-platform/videos/`
2. Refresh Media Library page
3. Check upload was successful (no errors in backend logs)

---

## 🎯 Next Steps

Now that Cloudinary is set up, you can:

1. **Upload videos** - They'll automatically go to Cloudinary
2. **View in Cloudinary Console** - See all your uploaded videos
3. **Use transformations** - Resize, crop, optimize videos
4. **Add video player** - Embed Cloudinary's video player
5. **Generate thumbnails** - Automatic thumbnail generation

---

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Video Upload API](https://cloudinary.com/documentation/video_upload_api_reference)
- [Video Transformations](https://cloudinary.com/documentation/video_transformation_reference)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

---

## ✅ Checklist

Before testing:
- [ ] Created Cloudinary account
- [ ] Copied Cloud Name, API Key, API Secret
- [ ] Added credentials to `backend/.env`
- [ ] Restarted backend server
- [ ] Tested upload (video appears in Cloudinary Console)
- [ ] Tested delete (video removed from Cloudinary Console)
