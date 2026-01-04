## 🛡️ Overview

The system now includes automated content moderation using:
- **Cloudinary AI**: For visual moderation (using AWS Rekognition add-on).
- **FFmpeg**: For extracting frames and audio signals in the background.
- **In-Memory Processing**: Lightweight background jobs (No Redis required).

## 🚀 Prerequisites

### 1. Install FFmpeg (Optional - system uses static binaries)
The system uses `ffmpeg-static`, so you don't strictly need to install it manually.

### 2. Configure Cloudinary Moderation
1. Go to **Cloudinary Console** > **Add-ons**.
2. Enable **AWS Rekognition Video Moderation** (or similar).
3. If using a different add-on, update `middleware/upload.js`.

---

## 🏗️ Architecture

1. **Upload**: Video goes to Cloudinary.
2. **Analysis**: Cloudinary AI starts analyzing immediately.
3. **Status**: Video status set to `pending` (hidden from viewers).
4. **Worker (In-Memory)**:
   - Polls Cloudinary for analysis results.
   - Updates DB (`approved` | `rejected` | `flagged`).
5. **Admin**:
   - Reviews videos in `/moderation` dashboard.
   - Can manually approve/reject.

---

## 🖥️ Usage

### Uploading (User)
- Upload as normal.
- Video will NOT appear in the public list immediately.
- Only Admins see it in the Moderation Dashboard.

### Moderating (Admin)
1. Go to **Dashboard**.
2. Click **"Moderate Content"** card (Shield icon).
3. Select a video from the queue.
4. Review AI confidence score and visual content.
5. Click **Approve** (Goes live) or **Reject** (Stays hidden/failed).

---

## 🔧 Troubleshooting

### Job not running?
- Check if Redis is running (`redis-cli ping`).
- Check backend console logs for `Connection Refused` errors.

### Moderation stuck on "pending"?
- Cloudinary AI takes time (minutes) for long videos.
- The worker runs immediately but might need to wait/poll.
- Check `status` in MongoDB.

### FFmpeg errors?
- The system uses `ffmpeg-static`, so no installation needed.
- Check write permissions for `backend/temp` folder.
