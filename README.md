# AI Photo Event Platform

A complete full-stack AI-powered photo sharing platform inspired by Kwikpic. The platform features an enhanced premium SaaS glassmorphic UI, allowing users to create events, upload photo galleries, and instantly find themselves in massive galleries using AI facial recognition.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0 + ShadCN UI + Glassmorphism Aesthetics
- **Mobile Support**: Capacitor (Android/iOS Hybrid Support)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL (via Prisma ORM)
- **AI Face Tech**: DeepFace (Facenet Model) & OpenCV
- **Storage**: Cloudinary & Google Drive API
- **Payments**: Razorpay Integration
- **Notifications**: WhatsApp (Twilio / CallMeBot API)
- **Auth**: JWT (PyJWT + Passlib Bcrypt)

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (via Neon.tech or local instance)
- Cloudinary Account (API Keys)
- Google Cloud Console (Drive API Credentials)

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` in the root and fill in your details:
```env
# backend/.env
DATABASE_URL="postgresql://username:password@host:port/database"

JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_APPLICATION_CREDENTIALS=backend/credentials.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Backend (FastAPI + DeepFace)
Navigate to `backend/` folder:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # (Windows)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Note: The first time you upload a photo or selfie, DeepFace will download the Facenet weights (around 90MB) automatically in the background.*

### 4. Start Frontend (Next.js)
Navigate to `frontend/` folder:
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Platform
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ✨ Features Implemented
* **Smart Face Search**: Upload a selfie to locate all matching photos in an event using DeepFace cosine similarity.
* **Event Galleries**: Masonry grid layouts with Pinterest-style hover effects.
* **JWT Auth**: Full access-controlled dashboard and features.
* **Premium Design**: Dark mode compatibility, framer-motion transitions, and Tailwind glassmorphism.
* **Cloud Storage**: Automatic Cloudinary media uploading.
