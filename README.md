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

## 🧭 Demo Accounts

> Demo credentials are for testing the deployed sample portal only. Change them before real production use.

| Role | Login | Password |
| --- | --- | --- |
| Admin | `aamirmir08@gmail.com` | `admin123` |
| Student | `dtq-2026-001` | `student123` |
| Faculty | `faculty` | `faculty123` |
| Parent | `parent` | `parent123` |

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| PDFs | PDFKit / React PDF patterns |
| Mobile | Capacitor Android |
| Hosting | Vercel frontend + Vercel/Node API |
| AI Assistant | Groq SDK through server-side API route |

## 🧩 Main Modules

- **Public Website:** Home, About, Admissions, Books, Resources, Gallery, Notices, Events, Videos, Contact, Donate, FAQ-ready sections
- **Admin ERP:** Students, parents, faculty, classes, timetable, syllabus, fees, attendance, results, admissions, announcements, gallery, videos, login management
- **Faculty Portal:** Assigned classes, student lists, attendance workflow, marks entry, class-wise views
- **Student Portal:** Profile, marks, attendance, syllabus, resources, notices, grade card, ID card
- **Parent Portal:** Linked child dashboard, marks, attendance, fee status, syllabus, notices, quick downloads
- **Android App:** Lightweight app wrapper connected to the deployed website

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

## 🧪 Quality Checks

The deployed build has been checked for:

- Production Next.js build
- API health
- Admin/student/faculty/parent login flow
- Gmail OTP delivery
- APK generation
- Public APK download route
- Privacy policy route

## 🤝 For Developers

This project is useful if you are exploring:

- Small-school ERP architecture
- Role-based dashboards with Next.js and Express
- MongoDB schema design for education portals
- Islamic institute digital library systems
- Android packaging for a web portal using Capacitor
- Secure server-side AI assistant integration

If you find this project useful, ⭐ star the repo and explore the live demo.

---

Built for **Darsgah Taleemul Quran Wal Hadith, Kongamdara Pattan** with a focus on Quranic education, clean administration, and accessible digital learning.
