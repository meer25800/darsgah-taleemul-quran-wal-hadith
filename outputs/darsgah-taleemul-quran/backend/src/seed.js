import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import PDFDocument from "pdfkit";
import { PDFDocument as PDFLibDocument } from "pdf-lib";
import User from "./models/User.js";
import Student from "./models/Student.js";
import Parent from "./models/Parent.js";
import Subject from "./models/Subject.js";
import Mark from "./models/Mark.js";
import Attendance from "./models/Attendance.js";
import Fee from "./models/Fee.js";
import { Admission, Book, ContactMessage, Gallery, Notice, Resource, Video } from "./models/Content.js";
import { Announcement, Assignment, ClassRoom, Event, Faculty, Result, Setting, Syllabus, Timetable } from "./models/ErpModels.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is required in backend/.env");
}

await mongoose.connect(process.env.MONGO_URI);

const libraryDir = path.resolve("uploads/library");
fs.mkdirSync(libraryDir, { recursive: true });

function slugFile(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function createPdf(filename, title, description, lines = []) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(libraryDir, filename);
    const doc = new PDFDocument({ margin: 54 });
    const stream = fs.createWriteStream(filePath);
    stream.on("finish", async () => {
      try {
        const bytes = await fs.promises.readFile(filePath);
        const parsed = await PDFLibDocument.load(bytes);
        resolve({
          fileUrl: `/uploads/library/${filename}`,
          pageCount: parsed.getPageCount(),
          fileSizeBytes: bytes.length,
          mimeType: "application/pdf",
          originalFilename: filename,
          fileAvailable: true
        });
      } catch (error) {
        reject(error);
      }
    });
    stream.on("error", reject);
    doc.pipe(stream);
    doc.fillColor("#075e45").fontSize(18).text("DARSGAH TALEEMUL QURAN WAL HADITH", { align: "center" });
    doc.moveDown(0.5).fillColor("#0b88b6").fontSize(12).text("Kongamdara Pattan", { align: "center" });
    doc.moveDown(1).fillColor("#0b2f29").fontSize(22).text(title);
    doc.moveDown(0.7).fontSize(12).fillColor("#263f3a").text(description, { lineGap: 4 });
    doc.moveDown(1).fillColor("#075e45").fontSize(14).text("Contents");
    lines.forEach((line, index) => doc.fillColor("#263f3a").fontSize(11).text(`${index + 1}. ${line}`, { lineGap: 3 }));
    doc.end();
  });
}

await Promise.all([
  User.deleteMany({}), Student.deleteMany({}), Parent.deleteMany({}), Subject.deleteMany({}), Mark.deleteMany({}), Attendance.deleteMany({}), Fee.deleteMany({}),
  Admission.deleteMany({}), Book.deleteMany({}), Gallery.deleteMany({}), Video.deleteMany({}), Notice.deleteMany({}), Resource.deleteMany({}), ContactMessage.deleteMany({}),
  Faculty.deleteMany({}), ClassRoom.deleteMany({}), Timetable.deleteMany({}), Assignment.deleteMany({}), Syllabus.deleteMany({}), Event.deleteMany({}), Announcement.deleteMany({}), Result.deleteMany({}), Setting.deleteMany({})
]);

await Promise.all([
  Book.collection.dropIndexes().catch(() => {}),
  Resource.collection.dropIndexes().catch(() => {})
]);
await Promise.all([Book.syncIndexes(), Resource.syncIndexes()]);

const classNames = Array.from({ length: 8 }, (_, i) => `Class ${i + 1}`);
const subjectNames = ["Quran Nazra", "Hifz-ul-Quran", "Hadees", "Fiqh", "Seerat", "Duas", "Tajweed", "Islamic Etiquette", "Arabic Basics"];

const subjects = await Subject.insertMany(subjectNames.map((name, index) => ({
  name,
  code: name.toUpperCase().replace(/[^A-Z]/g, "-").replace(/-+/g, "-").slice(0, 12) + `-${index + 1}`,
  className: classNames[index % classNames.length],
  teacher: ["Qari Abdul Rashid", "Moulana Irfan", "Mufti Sameer", "Qaria Saba", "Ustad Suhail"][index % 5],
  maxMarks: 100
})));

const faculty = await Faculty.insertMany([
  { employeeId: "FAC-001", name: "Qari Abdul Rashid", phone: "+91 70000 01001", email: "faculty@darsgah.local", qualification: "Qari, Aalim", designation: "Quran Teacher", assignedClasses: ["Class 1", "Class 2"], assignedSubjects: [subjects[0]._id, subjects[6]._id], status: "active" },
  { employeeId: "FAC-002", name: "Moulana Irfan Ahmad", phone: "+91 70000 01002", email: "irfan@darsgah.local", qualification: "Aalim", designation: "Hadees Teacher", assignedClasses: ["Class 3", "Class 4"], assignedSubjects: [subjects[2]._id, subjects[4]._id], status: "active" },
  { employeeId: "FAC-003", name: "Mufti Sameer", phone: "+91 70000 01003", email: "sameer@darsgah.local", qualification: "Mufti", designation: "Fiqh Teacher", assignedClasses: ["Class 5", "Class 6"], assignedSubjects: [subjects[3]._id, subjects[7]._id], status: "active" },
  { employeeId: "FAC-004", name: "Qaria Saba", phone: "+91 70000 01004", email: "saba@darsgah.local", qualification: "Qaria", designation: "Tajweed Teacher", assignedClasses: ["Class 7"], assignedSubjects: [subjects[1]._id, subjects[6]._id], status: "active" },
  { employeeId: "FAC-005", name: "Ustad Suhail", phone: "+91 70000 01005", email: "suhail@darsgah.local", qualification: "Arabic Diploma", designation: "Arabic Teacher", assignedClasses: ["Class 8"], assignedSubjects: [subjects[8]._id, subjects[5]._id], status: "active" }
]);

await ClassRoom.insertMany(classNames.map((name, index) => ({
  name,
  section: "A",
  classTeacher: faculty[index % faculty.length]._id,
  subjects: subjects.map((s) => s._id),
  academicSession: "2026-2027",
  capacity: 25
})));

const studentInput = [
  ["Ayaan Ahmad", "Bilal Ahmad", "Shaista", "Class 1"],
  ["Maryam Bashir", "Bashir Ahmad", "Ruqaya", "Class 1"],
  ["Umar Farooq", "Farooq Ahmad", "Nusrat", "Class 2"],
  ["Zaid Hussain", "Hussain Mir", "Afroza", "Class 3"],
  ["Aisha Yousuf", "Mohd Yousuf", "Nighat", "Class 4"],
  ["Hamza Latief", "Abdul Latief", "Sakeena", "Class 5"],
  ["Safiya Jan", "Ghulam Nabi", "Mehbooba", "Class 6"],
  ["Ibrahim Khan", "Rashid Khan", "Asiya", "Class 7"],
  ["Hafsa Akhtar", "Akhtar Hussain", "Rafiqa", "Class 8"],
  ["Rayyan Nazir", "Nazir Ahmad", "Haleema", "Class 8"]
];

const students = await Student.insertMany(studentInput.map(([name, fatherName, motherName, className], index) => ({
  rollNumber: `DTQ-2026-${String(index + 1).padStart(3, "0")}`,
  admissionNumber: `ADM-2026-${String(index + 1).padStart(3, "0")}`,
  name,
  fatherName,
  motherName,
  className,
  section: "A",
  dob: new Date(2013 + (index % 5), index % 12, index + 1),
  contact: `+91 70000 02${String(index).padStart(3, "0")}`,
  address: "Kongamdara Pattan",
  photoUrl: "/institute-logo.png",
  subjects: subjects.map((s) => s._id),
  status: "active"
})));

const parents = await Parent.insertMany(students.map((student, index) => ({
  name: student.fatherName,
  phone: student.contact,
  email: index === 0 ? "parent" : `parent${index + 1}@darsgah.local`,
  address: student.address,
  students: [student._id]
})));

await User.create({ name: "Institute Super Admin", username: "aamirmir08@gmail.com", email: "aamirmir08@gmail.com", password: "admin123", role: "super_admin" });
await User.create({ name: faculty[0].name, username: "faculty", password: "faculty123", role: "faculty", facultyId: faculty[0]._id });
for (let i = 1; i < faculty.length; i++) {
  await User.create({ name: faculty[i].name, username: faculty[i].employeeId.toLowerCase(), password: "faculty123", role: "faculty", facultyId: faculty[i]._id });
}
for (let i = 0; i < students.length; i++) {
  await User.create({ name: students[i].name, username: students[i].rollNumber.toLowerCase(), password: i === 0 ? "student123" : "student123", role: "student", studentId: students[i]._id });
  await User.create({ name: parents[i].name, username: parents[i].email.toLowerCase(), password: "parent123", role: "parent", parentId: parents[i]._id });
}

const markDocs = [];
students.forEach((student, sIndex) => {
  subjects.forEach((subject, subIndex) => {
    ["Term 1", "Term 2"].forEach((term, termIndex) => {
      markDocs.push({
        student: student._id,
        subject: subject._id,
        term,
        obtainedMarks: Math.min(98, 62 + termIndex * 5 + ((sIndex * 7 + subIndex * 3) % 30)),
        maxMarks: 100,
        remarks: termIndex === 0 ? "Good progress" : "Improved recitation and written work"
      });
    });
  });
});
await Mark.insertMany(markDocs);

const attendanceDocs = [];
students.forEach((student, sIndex) => {
  for (let day = 1; day <= 24; day++) {
    attendanceDocs.push({
      student: student._id,
      date: new Date(2026, 6, day),
      status: (day + sIndex) % 11 === 0 ? "absent" : (day + sIndex) % 17 === 0 ? "leave" : "present",
      note: "Seed attendance"
    });
  }
});
await Attendance.insertMany(attendanceDocs);

await Fee.insertMany(students.map((student, index) => ({
  student: student._id,
  month: "July 2026",
  amount: 1000,
  paidAmount: index % 4 === 0 ? 500 : 1000,
  status: index % 4 === 0 ? "partial" : "paid",
  dueDate: new Date("2026-07-15")
})));

await Notice.insertMany([
  { title: "Admission Open", body: "Admissions are open for Class 1 to Class 8.", audience: "public", isImportant: true },
  { title: "Monthly Test", body: "Monthly Test starts from 15 August.", audience: "student", isImportant: true },
  { title: "Result Announcement", body: "Term 1 Result will be published next Friday.", audience: "all", isImportant: true },
  { title: "Holiday Notice", body: "Institute will remain closed on Friday.", audience: "all" },
  { title: "Parent Meeting", body: "Parents Meeting will be held on Sunday at 11 AM.", audience: "parent" },
  { title: "Quran Competition", body: "Nazra and Hifz Competition registrations are open.", audience: "all" },
  { title: "Annual Day", body: "Annual Function preparations have started.", audience: "public" }
]);

const bookSeed = [
  { title: "Prayer Guide", category: "Salah", author: "Institute Faculty", publisher: "Darsgah Taleemul Quran Wal Hadith", language: "English + Urdu", pages: 55, edition: "2026", description: "A complete beginner guide explaining Wudu, Tayammum, five daily prayers, Sunnah prayers, Friday prayer, Eid prayer, Janazah prayer, common mistakes in Salah, conditions of Salah, and prayer times.", contents: ["Wudu", "Tayammum", "Five Daily Prayers", "Sunnah Prayers", "Friday Prayer", "Eid Prayer", "Janazah Prayer", "Common mistakes in Salah"] },
  { title: "Selected Duas", category: "Duas", author: "Classical Scholars", publisher: "Darsgah Library", language: "Arabic, Urdu, English", pages: 80, edition: "2026", description: "Collection of authentic daily duas for morning, evening, entering home, leaving home, sleeping, waking up, eating, travelling, exams, knowledge, rain, masjid, and Istikhara.", contents: ["Morning Dua", "Evening Dua", "Entering Home", "Leaving Home", "Sleeping", "Waking Up", "Eating", "Travelling", "Exam Dua", "Knowledge Dua"] },
  { title: "Forty Hadees", category: "Hadees", author: "Imam An-Nawawi", publisher: "Classical Scholars", language: "Arabic + Urdu + English", pages: 120, edition: "2026", description: "Forty authentic Ahadith with translation and simple explanation covering faith, prayer, good character, patience, honesty, parents, knowledge, and brotherhood.", contents: ["Faith", "Prayer", "Good Character", "Patience", "Honesty", "Parents", "Knowledge", "Brotherhood"] },
  { title: "Stories of Prophets", category: "Seerah", author: "Institute Faculty", publisher: "Darsgah Library", language: "English + Urdu", pages: 180, edition: "2026", description: "Beautiful stories of Adam AS, Nuh AS, Ibrahim AS, Musa AS, Isa AS, and Muhammad peace be upon him, suitable for children.", contents: ["Adam AS", "Nuh AS", "Ibrahim AS", "Musa AS", "Isa AS", "Muhammad peace be upon him"] },
  { title: "Seerat-un-Nabi", category: "Seerah", author: "Classical Scholars", publisher: "Darsgah Library", language: "Urdu + English", pages: 300, edition: "2026", description: "Complete biography of Prophet Muhammad peace be upon him including birth, childhood, prophethood, Hijrah, Madinah, battles, treaties, farewell sermon, and passing away.", contents: ["Birth", "Childhood", "Prophethood", "Hijrah", "Madinah", "Battles", "Treaties", "Farewell Sermon"] },
  { title: "Basic Tajweed", category: "Tajweed", author: "Institute Faculty", publisher: "Darsgah Library", language: "English + Urdu", pages: 90, edition: "2026", description: "Makharij, Qalqalah, Ghunnah, Madd, rules of Noon Saakin, rules of Meem Saakin, stopping rules, and practical recitation guidance.", contents: ["Makharij", "Qalqalah", "Ghunnah", "Madd", "Noon Saakin", "Meem Saakin", "Stopping Rules"] },
  { title: "Arabic Qaida", category: "Arabic", author: "Institute Faculty", publisher: "Darsgah Library", language: "Arabic + Urdu", pages: 65, edition: "2026", description: "Arabic alphabet, joining letters, Harakaat, Tanween, practice exercises, reading practice, and writing practice for early Quran reading.", contents: ["Arabic Alphabet", "Joining Letters", "Harakaat", "Tanween", "Practice Exercises", "Reading Practice", "Writing Practice"] },
  { title: "Islamic Manners", category: "Akhlaq", author: "Classical Scholars", publisher: "Darsgah Library", language: "English + Urdu", pages: 70, edition: "2026", description: "Lessons on respect for parents and teachers, helping others, truthfulness, honesty, cleanliness, patience, forgiveness, kindness, and good behaviour.", contents: ["Respect Parents", "Respect Teachers", "Helping Others", "Truthfulness", "Honesty", "Cleanliness", "Patience", "Forgiveness"] },
  { title: "Fiqh Basics", category: "Fiqh", author: "Institute Faculty", publisher: "Darsgah Library", language: "Urdu + English", pages: 110, edition: "2026", description: "Basic daily masail covering Taharah, prayer, fasting, Zakat, Hajj, and common daily Islamic rulings.", contents: ["Taharah", "Prayer", "Fasting", "Zakat", "Hajj", "Daily Masail"] },
  { title: "Quran Reading Plan", category: "Quran", author: "Classical Scholars", publisher: "Darsgah Library", language: "English + Urdu", pages: 45, edition: "2026", description: "Daily Quran reading schedule, 30 Juz plan, memorization tracker, revision planner, weekly schedule, and monthly goals.", contents: ["Daily Reading Schedule", "30 Juz Plan", "Memorization Tracker", "Revision Planner", "Weekly Schedule", "Monthly Goals"] }
];

const booksWithFiles = await Promise.all(bookSeed.map(async (book) => {
  const document = await createPdf(`${slugFile(book.title)}.pdf`, book.title, book.description, book.contents);
  const { pages: _unsupportedPageClaim, ...verifiedBook } = book;
  return { ...verifiedBook, ...document, previewUrl: document.fileUrl, views: 0, downloads: 0, isPublic: true };
}));
await Book.insertMany(booksWithFiles);

const resourceTitles = {
  Tajweed: ["Makharij Chart", "Noon Saakin Chart", "Meem Rules", "Qalqalah Chart", "Madd Chart", "Pronunciation Guide", "Practice Worksheet", "Revision Notes"],
  Quran: ["Quran Notes", "Daily Reading Planner", "Revision Sheet", "Memorization Planner", "Basic Tajweed Notes", "Translation Notes"],
  Duas: ["Morning Duas", "Evening Duas", "Exam Duas", "Travel Duas", "Masjid Duas", "Food Duas", "Sleeping Duas", "Waking Up Duas"],
  Hadees: ["40 Hadees Worksheet", "Weekly Hadith", "Memorization Worksheet", "Character Building Notes"],
  Fiqh: ["Taharah Notes", "Prayer Notes", "Fasting Notes", "Zakat Notes", "Daily Masail"],
  Seerat: ["Timeline", "Battle Maps", "Family Tree", "Important Events", "Quiz Notes"]
};

const resourceDocs = [];
for (const [category, titles] of Object.entries(resourceTitles)) {
  for (const title of titles) {
    const fullTitle = category === "Tajweed" && title === "Makharij Chart" ? "Tajweed Makharij Chart" : title;
    const description = `${fullTitle} for ${category} revision and guided classroom practice.`;
    const document = await createPdf(`${slugFile(category)}_${slugFile(title)}.pdf`, fullTitle, description, ["Read with your teacher", "Revise the lesson", "Complete the practice work"]);
    resourceDocs.push({
      title: fullTitle,
      category,
      description,
      ...document,
      previewUrl: document.fileUrl,
      fileType: "pdf",
      uploadedBy: "Institute Admin",
      uploadDate: new Date(),
      views: 0,
      downloads: 0,
      isPublic: true
    });
  }
}
await Resource.insertMany(resourceDocs);

await Gallery.insertMany([
  { title: "Quran Class", description: "Students practising Quran recitation with tajweed.", imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=900&q=80", category: "Quran Class", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: true },
  { title: "Morning Assembly", description: "Morning assembly with daily duas and reminders.", imageUrl: "https://images.unsplash.com/photo-1587617425953-9075d28b8c46?auto=format&fit=crop&w=900&q=80", category: "Morning Assembly", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: true },
  { title: "Institute Building", description: "Institute campus at Kongamdara Pattan.", imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=900&q=80", category: "Institute Building", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: true },
  { title: "Annual Result Day", description: "Students receiving grade cards and encouragement.", imageUrl: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80", category: "Annual Result Day", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: true },
  { title: "Library", description: "Digital library resources for Islamic learning.", imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80", category: "Library", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: false },
  { title: "Parent Meeting", description: "Parent orientation and student progress discussion.", imageUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80", category: "Parent Meeting", uploadedBy: "Institute Admin", uploadDate: new Date(), views: 0, isFeatured: false }
]);

await Video.insertMany([
  { title: "Quran Recitation Competition Highlights", youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U", youtubeVideoId: "ysz5S6PUM-U", embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U", thumbnailUrl: "https://img.youtube.com/vi/ysz5S6PUM-U/hqdefault.jpg", description: "Featured Quran recitation competition video for homepage display.", category: "Quran Competition", duration: "03:30", views: 0, isFeatured: true, published: false, showOnHome: false },
  { title: "Seerat Program Message", youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk", youtubeVideoId: "jfKfPfyJRdk", embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk", thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg", description: "Seerat program message and student reminder.", category: "Seerat Program", duration: "04:10", views: 0, isFeatured: false, published: false, showOnHome: false }
]);

await Event.insertMany([
  { title: "Annual Day", description: "Annual function and student presentations.", date: new Date("2026-08-01"), venue: "Institute Hall", audience: "public" },
  { title: "Seerat Conference", description: "Student speeches and Seerah quiz.", date: new Date("2026-08-12"), venue: "Institute Hall", audience: "public" },
  { title: "Ramadan Program", description: "Special Quran and duas program.", date: new Date("2026-08-18"), venue: "Main Hall", audience: "all" },
  { title: "Islamic Quiz", description: "Quiz on Quran, Hadees, Fiqh, and Seerah.", date: new Date("2026-08-25"), venue: "Classroom Block", audience: "student" },
  { title: "Prize Distribution", description: "Awards for competition and academic excellence.", date: new Date("2026-09-01"), venue: "Main Hall", audience: "all" },
  { title: "Teacher Workshop", description: "Faculty training workshop.", date: new Date("2026-09-07"), venue: "Office", audience: "faculty" },
  { title: "Parent Orientation", description: "Parent guidance and portal orientation.", date: new Date("2026-09-14"), venue: "Institute Hall", audience: "parent" },
  { title: "Quran Competition", description: "Nazra and Hifz recitation competition.", date: new Date("2026-09-20"), venue: "Main Hall", audience: "all" },
  { title: "Hifz Competition", description: "Hifz revision and memorisation competition.", date: new Date("2026-10-01"), venue: "Institute Hall", audience: "all" },
  { title: "Sports Day", description: "Healthy outdoor activities for students.", date: new Date("2026-10-10"), venue: "Playground", audience: "student" }
]);

const syllabusDocs = [];
for (let index = 0; index < classNames.length; index++) {
  const className = classNames[index];
  const topics = [
    "Subjects: Quran, Tajweed, Arabic, Fiqh, Hadees, Duas, Seerah, Islamic Manners",
    "Term 1: basic recitation, daily duas, manners, and class-level written work",
    "Term 2: revision, oral tests, worksheets, assignments, and practice questions",
    "Includes worksheets, assignments, videos, practice questions, and revision notes"
  ];
  const document = await createPdf(`${slugFile(className)}_Syllabus.pdf`, `${className} Syllabus`, `Complete syllabus for ${className}.`, topics);
  syllabusDocs.push({
    title: `${className} Islamic Studies Syllabus`,
    className,
    section: "A",
    subject: subjects[index % subjects.length]._id,
    subjectName: "Quran, Tajweed, Arabic, Fiqh, Hadees, Duas, Seerah, Islamic Manners",
    category: "Quran",
    description: `Complete syllabus for ${className}: Quran, Tajweed, Arabic, Fiqh, Hadees, Duas, Seerah, Islamic Manners, worksheets, assignments, videos, practice questions, revision notes, Term 1 topics and Term 2 topics.`,
    type: "pdf",
    file: { url: document.fileUrl, originalName: `${className}-syllabus.pdf`, mimeType: "application/pdf", size: document.fileSizeBytes },
    isPublic: true
  });
}
await Syllabus.insertMany(syllabusDocs);

await Assignment.insertMany(classNames.map((className, index) => ({
  title: `${className} Weekly Quran Revision`,
  className,
  section: "A",
  subject: subjects[index % subjects.length]._id,
  faculty: faculty[index % faculty.length]._id,
  dueDate: new Date("2026-07-20"),
  description: "Revise assigned lesson and prepare oral submission.",
  status: "published"
})));

await Timetable.insertMany(classNames.map((className, index) => ({
  className,
  section: "A",
  day: "Monday",
  periods: [
    { startTime: "09:00", endTime: "09:45", subject: subjects[0]._id, faculty: faculty[index % faculty.length]._id, room: `Room ${index + 1}` },
    { startTime: "09:50", endTime: "10:35", subject: subjects[6]._id, faculty: faculty[index % faculty.length]._id, room: `Room ${index + 1}` }
  ]
})));

await Announcement.create({ title: "ERP Portal Ready", body: "Live dashboards are available for admin, faculty, students and parents.", audience: "all", priority: "high" });
await Setting.create([
  {
    key: "institute",
    value: {
      name: "DARSGAH TALEEMUL QURAN WAL HADITH",
      location: "Kongamdara Pattan, Jammu & Kashmir",
      phone: "+919906237556",
      mapUrl: "https://www.google.com/maps/place/34%C2%B007'04.8%22N+74%C2%B035'12.4%22E/@34.1182154,74.5868014,19z/data=!4m4!3m3!8m2!3d34.1179956!4d74.5867706?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D",
      mapEmbedUrl: "https://www.google.com/maps?q=34.1179956,74.5867706&z=18&output=embed",
      classes: classNames
    }
  },
  {
    key: "islamicAssistant",
    value: {
      enabled: true,
      publicName: "Darsgah Islamic Assistant",
      greeting: "Assalamu Alaikum! I can help with Islamic teachings, Quranic concepts, Hadith, Seerah, Islamic history, worship and Islamic terminology. How may I help you?",
      suggestedQuestions: [
        "What are the five pillars of Islam?",
        "What does Taqwa mean?",
        "How many daily prayers are there?",
        "Explain the meaning of Zakat.",
        "What is the difference between Fard and Sunnah?",
        "Tell me about the importance of good character in Islam."
      ],
      maxMessageLength: 1000,
      dailyRequestLimit: 50,
      disclaimer: "This assistant provides general Islamic educational information. For personal religious rulings or important matters, please consult a qualified Islamic scholar.",
      homepageVisible: true,
      displayPosition: "bottom-right",
      maintenanceMessage: "The Islamic Assistant is currently unavailable."
    }
  }
]);
await Admission.create({ studentName: "Sample Applicant", fatherName: "Applicant Father", phone: "+91 70000 03000", className: "Class 1", message: "Interested in admission." });
await ContactMessage.create({ name: "Sample Visitor", phone: "+91 70000 04000", email: "visitor@example.com", message: "Please share admission details." });

for (const student of students) {
  const marks = await Mark.find({ student: student._id }).lean();
  const total = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
  const maxMarks = marks.reduce((sum, mark) => sum + mark.maxMarks, 0);
  const percentage = Math.round((total / maxMarks) * 100);
  await Result.create({ student: student._id, exam: "Monthly Test", term: "Term 1", total, maxMarks, percentage, grade: percentage >= 80 ? "A" : percentage >= 60 ? "B" : "C", remarks: "Keep improving with regular revision." });
}

console.log("Complete ERP seed data created");
console.log("Admin: aamirmir08@gmail.com / admin123");
console.log("Faculty: faculty / faculty123");
console.log("Student: dtq-2026-001 / student123");
console.log("Parent: parent / parent123");
await mongoose.disconnect();
