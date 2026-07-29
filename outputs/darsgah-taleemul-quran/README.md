# DARSGAH TALEEMUL QURAN WAL HADITH KONGAMDARA PATTAN

Complete modern institute platform with:

- Next.js App Router + TypeScript ERP frontend
- Node.js / Express backend API
- MongoDB database models
- JWT role-based authentication
- Student, parent, faculty, and admin dashboards
- Cloudinary-ready uploads for images/PDFs
- Grade card and photo ID PDF generation
- CSV export/import-ready backend structure
- React Native / Expo mobile app

## Demo Logins

Admin:
- Email: `aamirmir08@gmail.com`
- Password: `admin123`

Student:
- Student ID: `DTQ-2026-001`
- Password: `student123`

Parent:
- Username: `parent`
- Password: `parent123`

Faculty:
- Username: `faculty`
- Password: `faculty123`

## Project Structure

```text
backend/       Express API, MongoDB models, auth, ERP CRUD, PDF generation, seed data
frontend-next/ Next.js App Router + TypeScript + Tailwind ERP frontend
frontend/      Legacy Vite React preview
mobile/        Expo React Native mobile app
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Backend runs on `http://localhost:5000`.

If the MongoDB Windows service does not start, use the helper script from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local-mongodb.ps1
```

Keep that MongoDB window open, then use a second terminal for `npm run seed` and `npm run dev`.

## Main Frontend Setup

```bash
cd frontend-next
cp .env.example .env
npm install
npm run dev
```

Website runs on `http://localhost:3000`.

The older `frontend/` folder is kept only as a lightweight Vite preview. Use `frontend-next/` for production/Vercel.

If your notes say `cd server`, use `cd backend` in this project. If your notes say `cd client`, use `cd frontend-next`.

## Mobile App Setup

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

For Android APK:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

## Environment Variables

Backend:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/darsgah_taleemul_quran
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
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

The Groq key is server-only. Never prefix it with `NEXT_PUBLIC_`, never place it in browser code, and set it only in `frontend-next/.env` locally or Vercel project environment variables during deployment. The public browser calls only `/api/islamic-chat`.

Mobile:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

## Deployment

Website:
- Deploy `frontend-next` to Vercel.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend API URL.
- Set `GROQ_API_KEY`, `GROQ_MODEL`, `ISLAMIC_ASSISTANT_MINUTE_LIMIT`, and `ISLAMIC_ASSISTANT_DAILY_LIMIT` in Vercel environment variables for the Islamic AI Assistant.

Backend:
- Deploy `backend` to Render or Railway.
- Set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL`.

Database:
- Use MongoDB Atlas.
- Whitelist backend host IPs or allow secure cloud access.

Mobile:
- Configure `EXPO_PUBLIC_API_URL` to production backend.
- Build APK with EAS.

## Notes

The seed script creates the required logins plus Class 1 to Class 8, 10 students, 5 faculty members, parents, Islamic subjects, marks, attendance, fees, 10 books, resources, gallery, timetable, syllabus, assignments, events, notices, admissions, and announcements so all dashboards work immediately after setup.
