# 🛡️ SentinelStream
### AI-Powered Advanced Video Moderation Platform

SentinelStream is a high-performance, full-stack video management platform featuring real-time AI content moderation. Built with a premium glassmorphic interface, it provides safe, scalable, and professional-grade video hosting for organizations.

---

## ✨ Core Features

### 🤖 AI Moderation Pipeline
- **Visual Intelligence**: Powered by **AWS Rekognition** to detect adult content, violence, and sensitive categories.
- **Fail-Safe Processing**: Hybrid moderation using visual labels and metadata safety checks.
- **Decision Engine**: Automated "Safe" vs "Flagged" categorization with exact detection reasons.

### 🎥 Professional Media Experience
- **Smart Video Library**: Real-time video previews on hover/card display.
- **High-End UI**: Premium dark-mode interface with glassmorphism and custom CSS transitions.
- **Watch Page Dashboard**: Detailed media info box with AI decision summaries and metadata.

### ⚖️ Administrative Control
- **Unified Moderation Hub**: Definitive "Safe" and "Reject" controls for Admins.
- **Granular RBAC**: Strict Role-Based Access Control (Admin, Editor, Viewer).
- **System Settings**: Dynamic control over file sizes, supported formats, and moderation sensitivity.

### ⚡ Real-Time Infrastructure
- **Live Progress Tracking**: See upload and analysis status in real-time via **Socket.io**.
- **Activity Auditing**: Comprehensive logs for all moderation and management actions.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Axios, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Atlas)
- **AI/Cloud**: AWS Rekognition, Cloudinary (Storage)
- **Styling**: Vanilla CSS (Premium Tokens System)

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v16+)
- MongoDB connection string
- AWS Credentials (for Rekognition)
- Cloudinary account

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env based on .env.example
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Default Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔐 Role Permissions

| Feature | Viewer | Editor | Admin |
| :--- | :---: | :---: | :---: |
| Browse Safe Videos | ✅ | ✅ | ✅ |
| Upload Content | ❌ | ✅ | ✅ |
| Edit Video Metadata | ❌ | ✅ | ✅ |
| View Flagged Content | ❌ | ✅ | ✅ |
| Moderate (Approve/Reject) | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |

---

## 📜 Documentation
Comprehensive implementation details can be found in the `walkthrough.md` generated during the development process.
