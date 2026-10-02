# 🕌 Darsgah Taleemul Quran Wal Hadith Kongamdara Pattan

> A modern full-stack Islamic institute ERP, public website, Android app, and educational portal for students, parents, faculty, administrators, and visitors.

![Institute](outputs/darsgah-taleemul-quran/frontend-next/public/institute-logo.png)

## 🌐 Live Project

| Platform | Link |
| --- | --- |
| Website | [darsgahkongamdara.vercel.app](https://darsgahkongamdara.vercel.app) |
| Backend API Health | [darsgahkongamdara-api.vercel.app/health](https://darsgahkongamdara-api.vercel.app/health) |
| Android APK Download | [Download APK](https://darsgahkongamdara.vercel.app/downloads/DarsgahKongamdara.apk) |
| Privacy Policy | [Privacy Policy](https://darsgahkongamdara.vercel.app/privacy) |

## ✨ Why This Project Stands Out

This is not just a landing page. It is a working institute-management system designed for a small Islamic school with real dashboards, role-based access, academic records, public content, PDF downloads, and a mobile app wrapper.

- Public Islamic institute website with admissions, books, resources, gallery, events, notices, videos, and contact information
- Role-based dashboards for **Admin**, **Faculty**, **Students**, and **Parents**
- MongoDB-backed ERP modules for students, parents, faculty, classes, attendance, results, fees, syllabus, admissions, announcements, gallery, videos, books, and resources
- JWT authentication with secure password hashing
- Grade card and photo ID card PDF generation
- Online PDF/resource reader
- Android APK generated with Capacitor
- Islamic AI assistant powered through secure server-side API integration
- Premium Islamic-themed UI using green, white, sky-blue, and gold styling

## 🎓 What Was Built

This project brings the institute's public information and day-to-day academic workflows into one responsive platform. It includes a public website, four role-based portals, a document library, server APIs, and an Android application wrapper.

### Public website

- Institute profile, admissions information, contact and location links
- Books, learning resources, syllabus documents, notices, events, gallery and institute videos
- Responsive navigation, privacy information, downloadable Android app and Islamic Assistant entry point
- PDF reading and download flows designed for desktop browsers, mobile browsers and the Android app

### Student and family services

- Student profiles, class information, marks, attendance, notices and syllabus access
- Parent portal scoped to linked student records
- Downloadable grade cards and student ID cards
- Faculty tools for assigned classes, attendance and marks

### Administration

- Admin-managed students, parents, faculty, classes, timetable, fees, admissions and academic results
- Content management for books, resources, notices, events, gallery images and institute videos
- File upload validation, document metadata handling and institute configuration
- Email OTP support when Gmail SMTP settings are configured

### Learning and mobile access

- Islamic digital library with searchable resource cards and an in-app PDF reader
- Server-side grade-card and ID-card PDF generation
- Capacitor Android project with native document download and PDF viewing support
- Islamic Assistant integration through a server-side API route, with scope and rate-limit controls

## 🔒 Demo Access and Production Setup

Demo credentials are intentionally not published in this README. Configure account data and secrets in your local or hosting environment, and change any seed passwords before using real student information. Never commit `.env` files, database connection strings, email app passwords, API keys, signing keys or real student records to a public repository.

The live website is a demonstration deployment. Production login and data features require the API, MongoDB connection, email service and any configured file storage to be available and correctly set up.

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| PDFs | PDFKit and dedicated document rendering |
| Mobile | Capacitor Android |
| Hosting | Vercel frontend + Vercel/Node API |
| AI Assistant | Groq SDK through server-side API route |

## 🧩 Main Modules and Workflows

- **Public Website:** Home, institute profile, admissions, books, resources, gallery, notices, events, videos, contact and privacy pages
- **Admin ERP:** Student and family records, faculty, classes, timetable, syllabus, fees, attendance, results, admissions and public content
- **Faculty Portal:** Assigned class access, student lists, attendance entry and marks management
- **Student Portal:** Student profile, marks, attendance, syllabus, learning resources, notices and document downloads
- **Parent Portal:** Linked-child information, academic progress, attendance, fee status, notices and downloads
- **Digital Library:** Categorized Islamic learning content, document availability states, PDF viewing and downloads
- **Android App:** Capacitor-based Android packaging with native support for document downloads and opening PDFs

## 📁 Repository Structure

```text
outputs/darsgah-taleemul-quran/
├── backend/         # Express API, MongoDB models, auth, PDF generation, seed data
├── frontend-next/   # Production Next.js website and ERP frontend
├── mobile/          # Capacitor Android project
├── samples/         # Sample grade card, ID card, student data
├── scripts/         # Local setup helpers
└── render.yaml      # Backend deployment template
```

## 🚀 Run Locally

### Backend

```bash
cd outputs/darsgah-taleemul-quran/backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

### Frontend

```bash
cd outputs/darsgah-taleemul-quran/frontend-next
npm install
cp .env.example .env
npm run dev
```

### Android APK

```bash
cd outputs/darsgah-taleemul-quran/mobile
npm install
npm run sync
cd android
gradlew.bat assembleDebug
```

## 🔐 Environment Variables

Backend:

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
GMAIL_USER=
GMAIL_APP_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ISLAMIC_ASSISTANT_MINUTE_LIMIT=10
ISLAMIC_ASSISTANT_DAILY_LIMIT=50
```

## 📦 Deployment

- **Website:** Vercel
- **Backend API:** Vercel / Render / Railway
- **Database:** MongoDB Atlas free cluster
- **Files:** Cloudinary-ready upload layer
- **APK:** Free direct download through the website

## 🧪 Development and Verification

The repository includes the frontend, backend, Android wrapper, sample library documents and deployment configuration. Build and runtime checks should be run in the environment where the required Node.js version and service credentials are configured. A successful frontend build alone does not verify database connectivity, email delivery, external file storage or Android device behaviour.

## 🤝 For Developers

This project is useful if you are exploring:

- Small-school ERP architecture
- Role-based dashboards with Next.js and Express
- MongoDB schema design for education portals
- Islamic institute digital library systems
- Android packaging for a web portal using Capacitor
- Secure server-side AI assistant integration

If you find this project useful, explore the live demo and star the repository.

---

Built for **Darsgah Taleemul Quran Wal Hadith, Kongamdara Pattan** with a focus on Quranic education, clean administration, and accessible digital learning.
