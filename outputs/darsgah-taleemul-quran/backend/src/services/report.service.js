import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mark from "../models/Mark.js";
import Attendance from "../models/Attendance.js";
import Fee from "../models/Fee.js";
import { ClassRoom, Setting } from "../models/ErpModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../assets/institute-logo-badge.png");
const fallbackLogoPath = path.join(__dirname, "../assets/institute-logo.png");
const GREEN = "#0d5c3d";
const PALM = "#16845b";
const GOLD = "#d6aa2f";
const INK = "#10231b";
const PAPER = "#fbfaf4";
const LINE = "#d8e7df";

export async function buildStudentSummary(student) {
  const marks = await Mark.find({ student: student._id }).populate("subject").sort("term createdAt").lean();
  const total = marks.reduce((sum, mark) => sum + Number(mark.obtainedMarks || 0), 0);
  const max = marks.reduce((sum, mark) => sum + Number(mark.maxMarks || 0), 0);
  const percentage = max ? Math.round((total / max) * 100) : 0;
  const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : percentage >= 40 ? "D" : "F";
  const attendance = await Attendance.find({ student: student._id }).lean();
  const counted = attendance.filter((item) => ["present", "absent", "late", "leave"].includes(String(item.status).toLowerCase()));
  const present = counted.filter((item) => ["present", "late"].includes(String(item.status).toLowerCase())).length;
  const attendancePercentage = counted.length ? Math.round((present / counted.length) * 100) : null;
  const fees = await Fee.find({ student: student._id }).lean();
  return {
    marks,
    total,
    max,
    percentage,
    grade,
    status: max ? (percentage >= 40 ? "Pass" : "Fail") : "Not graded",
    attendancePercentage,
    fees
  };
}

async function reportContext(student) {
  const [setting, classRoom] = await Promise.all([
    Setting.findOne({ key: "institute" }).lean(),
    student.classId ? ClassRoom.findById(student.classId).lean() : null
  ]);
  const institute = setting?.value || {};
  const academicSession = classRoom?.academicSession || institute.academicSession || "";
  return {
    name: institute.name || "DARSGAH TALEEMUL QURAN WAL HADITH",
    location: institute.location || "Kongamdara Pattan",
    address: institute.address || "",
    phone: institute.phone || "",
    email: institute.email || "",
    website: institute.website || process.env.PUBLIC_WEB_URL || "",
    academicSession
  };
}

function safeText(value, fallback = "") {
  return value === null || value === undefined ? fallback : String(value);
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function documentCode(prefix, student) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const source = safeText(student.admissionNumber || student.rollNumber || student._id).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `${prefix}-${source}-${date}`;
}

async function qrBuffer(value) {
  return QRCode.toBuffer(value, {
    type: "png",
    width: 320,
    margin: 1,
    color: { dark: GREEN, light: "#FFFFFF" }
  });
}

function drawLogoBadge(doc, x, y, size) {
  const source = fs.existsSync(logoPath) ? logoPath : fallbackLogoPath;
  doc.save();
  doc.circle(x + size / 2, y + size / 2, size / 2).fill("#ffffff");
  doc.circle(x + size / 2, y + size / 2, size / 2).clip();
  if (fs.existsSync(source)) {
    doc.image(source, x, y, {
      fit: [size, size],
      align: "center",
      valign: "center"
    });
  }
  doc.restore();
}

async function loadImageSource(value) {
  if (!value || ["/institute-logo.png", "/institute-logo-official.png"].includes(String(value))) return null;
  try {
    const raw = String(value);
    const pathname = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : raw;
    if (pathname.startsWith("/uploads/")) {
      const localPath = path.join(__dirname, "../..", pathname.replace(/^\/+/, ""));
      return fs.existsSync(localPath) ? localPath : null;
    }
    if (/^https?:\/\//i.test(raw)) {
      const response = await fetch(raw, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }
    return fs.existsSync(raw) ? raw : null;
  } catch {
    return null;
  }
}

async function drawStudentPhoto(doc, student, x, y, width, height = width) {
  const source = await loadImageSource(student.photoUrl);
  const radius = Math.min(width, height) * 0.12;
  doc.save();
  doc.roundedRect(x, y, width, height, radius).fillAndStroke("#f1f8f4", GOLD);
  doc.roundedRect(x + 1.5, y + 1.5, width - 3, height - 3, Math.max(1, radius - 1)).clip();
  if (source) {
    doc.image(source, x + 1.5, y + 1.5, {
      fit: [width - 3, height - 3],
      align: "center",
      valign: "center"
    });
  } else {
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(Math.round(Math.min(width, height) * 0.38))
      .text(safeText(student.name, "S").slice(0, 1).toUpperCase(), x, y + height * 0.31, { width, align: "center" });
  }
  doc.restore();
}

function pageBackground(doc) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PAPER);
}

function gradeHeader(doc, context, title, compact = false) {
  const height = compact ? 64 : 86;
  doc.roundedRect(28, 24, 539, height, 14).fill(GREEN);
  drawLogoBadge(doc, 40, compact ? 31 : 34, compact ? 48 : 66);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(compact ? 13 : 17)
    .text(context.name, compact ? 102 : 120, compact ? 36 : 42, { width: compact ? 438 : 420, align: "center" });
  doc.fillColor(GOLD).fontSize(compact ? 9 : 11)
    .text(context.location.toUpperCase(), compact ? 102 : 120, compact ? 56 : 68, { width: compact ? 438 : 420, align: "center" });
  if (!compact) {
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(15).text(title, 36, 122, { width: 523, align: "center" });
  }
  return compact ? 102 : 152;
}

function drawGradeTableHeader(doc, y) {
  const columns = [
    ["Subject", 42, 171],
    ["Term", 213, 65],
    ["Maximum", 278, 68],
    ["Obtained", 346, 70],
    ["Grade", 416, 52],
    ["Remarks", 468, 85]
  ];
  doc.roundedRect(40, y, 515, 26, 7).fill(GREEN);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);
  columns.forEach(([label, x, width]) => doc.text(label, x + 4, y + 9, { width: width - 8, align: label === "Subject" || label === "Remarks" ? "left" : "center" }));
  return y + 30;
}

function markGrade(mark) {
  const max = Number(mark.maxMarks || 0);
  const obtained = Number(mark.obtainedMarks || 0);
  if (!max) return "-";
  const value = (obtained / max) * 100;
  return value >= 90 ? "A+" : value >= 80 ? "A" : value >= 70 ? "B" : value >= 60 ? "C" : value >= 40 ? "D" : "F";
}

function gradeRowHeight(mark) {
  return safeText(mark.remarks).length > 20 ? 30 : 22;
}

function drawGradeRow(doc, mark, y, index) {
  const rowHeight = gradeRowHeight(mark);
  doc.roundedRect(40, y, 515, rowHeight, 4).fill(index % 2 ? "#f0f8f4" : "#ffffff");
  doc.fillColor(INK).font("Helvetica").fontSize(8.2);
  const textY = y + Math.max(6, (rowHeight - 9) / 2);
  doc.text(mark.subject?.name || "Subject", 46, textY, { width: 161, height: rowHeight - 8, ellipsis: true });
  doc.text(safeText(mark.term, "-"), 217, textY, { width: 57, align: "center" });
  doc.text(safeText(mark.maxMarks, "-"), 282, textY, { width: 60, align: "center" });
  doc.text(safeText(mark.obtainedMarks, "-"), 350, textY, { width: 62, align: "center" });
  doc.text(markGrade(mark), 420, textY, { width: 44, align: "center" });
  doc.text(safeText(mark.remarks, ""), 472, y + 5, { width: 77, height: rowHeight - 8, ellipsis: true, lineGap: 1 });
  return rowHeight;
}

function drawSummary(doc, summary, y) {
  const boxY = y;
  doc.roundedRect(40, boxY, 515, 122, 12).fillAndStroke("#ffffff", GOLD);
  const stats = [
    ["Total", summary.max ? `${summary.total} / ${summary.max}` : "Not available"],
    ["Percentage", summary.max ? `${summary.percentage}%` : "Not available"],
    ["Grade", summary.max ? summary.grade : "Not available"],
    ["Attendance", summary.attendancePercentage === null ? "Not available" : `${summary.attendancePercentage}%`],
    ["Status", summary.status]
  ];
  const statW = 94;
  stats.forEach(([label, value], index) => {
    const x = 50 + index * 101;
    doc.roundedRect(x, boxY + 10, statW, 42, 6).fill("#f0f8f4");
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(7.5).text(label, x + 5, boxY + 18, { width: statW - 10, align: "center" });
    doc.fillColor(INK).fontSize(10).text(value, x + 5, boxY + 33, { width: statW - 10, align: "center" });
  });
  const remarks = summary.marks.find((mark) => safeText(mark.remarks).trim())?.remarks || "";
  doc.fillColor(PALM).font("Helvetica-Bold").fontSize(8).text("Teacher remarks", 52, boxY + 64);
  doc.fillColor(INK).font("Helvetica").fontSize(8).text(remarks || "No remarks recorded.", 52, boxY + 77, {
    width: 430,
    height: 31,
    lineGap: 1,
    ellipsis: true
  });
  return boxY + 130;
}

function drawSignatures(doc, y) {
  const width = 154;
  const entries = [
    ["Class Teacher", 40],
    ["Official Stamp", 221],
    ["Principal / Head", 401]
  ];
  entries.forEach(([label, x]) => {
    doc.roundedRect(x, y, width, 50, 8).stroke(LINE);
    if (label !== "Official Stamp") doc.moveTo(x + 18, y + 27).lineTo(x + width - 18, y + 27).stroke(GREEN);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8).text(label, x + 8, y + 35, { width: width - 16, align: "center" });
  });
}

function addPageNumbers(doc, code, generatedOn) {
  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor("#4c675b").font("Helvetica").fontSize(7);
    doc.text(`Document ${code}  |  Generated ${generatedOn}`, 40, doc.page.height - 23, { width: 390, height: 10, lineBreak: false });
    doc.text(`Page ${index + 1} of ${pages.count}`, 450, doc.page.height - 23, { width: 105, height: 10, align: "right", lineBreak: false });
  }
}

export async function gradeCardPdf(student, res) {
  const [summary, context] = await Promise.all([buildStudentSummary(student), reportContext(student)]);
  const issueDate = new Date();
  const code = documentCode("GC", student);
  const qr = await qrBuffer(JSON.stringify({ type: "grade-card", code, student: String(student._id), rollNumber: student.rollNumber }));
  const doc = new PDFDocument({ margin: 36, size: "A4", bufferPages: true, info: { Title: `${student.name} - Official Grade Card`, Author: context.name } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${student.rollNumber}-grade-card.pdf"`);
  doc.pipe(res);

  pageBackground(doc);
  gradeHeader(doc, context, "Official Grade Card");
  doc.roundedRect(40, 158, 515, 98, 12).fillAndStroke("#ffffff", LINE);
  await drawStudentPhoto(doc, student, 468, 171, 68, 70);
  const detailRows = [
    ["Student", student.name, "Student ID", student.rollNumber],
    ["Guardian", student.fatherName, "Admission No.", student.admissionNumber],
    ["Class / Section", [student.className, student.section].filter(Boolean).join(" - "), "Academic Session", context.academicSession],
    ["Issue Date", formatDate(issueDate), "Document No.", code]
  ];
  detailRows.forEach((row, index) => {
    const yy = 173 + index * 19;
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(7.5).text(`${row[0]}:`, 54, yy, { width: 67 });
    doc.fillColor(INK).font("Helvetica").fontSize(8.5).text(safeText(row[1], "Not available"), 120, yy, { width: 122, ellipsis: true });
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(7.5).text(`${row[2]}:`, 249, yy, { width: 74 });
    doc.fillColor(INK).font("Helvetica").fontSize(8.5).text(safeText(row[3], "Not available"), 323, yy, { width: 133, ellipsis: true });
  });

  let y = drawGradeTableHeader(doc, 272);
  let rowIndex = 0;
  for (const mark of summary.marks) {
    const rowHeight = gradeRowHeight(mark);
    if (y + rowHeight > 650) {
      doc.addPage();
      pageBackground(doc);
      y = gradeHeader(doc, context, "Official Grade Card", true);
      doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(10).text(`${student.name} - ${student.rollNumber}`, 40, y + 3, { width: 515 });
      y = drawGradeTableHeader(doc, y + 22);
    }
    drawGradeRow(doc, mark, y, rowIndex);
    y += rowHeight + 2;
    rowIndex += 1;
  }
  if (y + 230 > doc.page.height - 28) {
    doc.addPage();
    pageBackground(doc);
    y = gradeHeader(doc, context, "Official Grade Card", true) + 18;
  } else {
    y += 10;
  }
  const summaryY = y;
  y = drawSummary(doc, summary, y);
  doc.image(qr, 500, summaryY + 69, { width: 40, height: 40 });
  drawSignatures(doc, y);
  addPageNumbers(doc, code, formatDate(issueDate));
  doc.end();
}

const CR80 = [85.6 * 72 / 25.4, 53.98 * 72 / 25.4];

function cardFrame(doc, x, y) {
  doc.roundedRect(x, y, CR80[0], CR80[1], 8).fillAndStroke("#ffffff", GREEN);
}

async function drawIdFront(doc, student, context, x, y, qr, issueDate, expiryDate) {
  cardFrame(doc, x, y);
  doc.save();
  doc.roundedRect(x, y, CR80[0], 45, 8).fill(GREEN);
  drawLogoBadge(doc, x + 9, y + 7, 31);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8)
    .text(context.name, x + 44, y + 10, { width: CR80[0] - 50, align: "center" });
  doc.fillColor(GOLD).fontSize(6.5).text(context.location.toUpperCase(), x + 44, y + 30, { width: CR80[0] - 50, align: "center" });
  doc.restore();
  await drawStudentPhoto(doc, student, x + 12, y + 52, 48, 60);
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(9.5).text(student.name, x + 67, y + 52, { width: 118, ellipsis: true });
  const details = [
    ["Student ID", student.rollNumber],
    ["Admission", student.admissionNumber],
    ["Class", [student.className, student.section].filter(Boolean).join(" - ")],
    ["Guardian", student.fatherName],
    ["Session", context.academicSession],
    ["Valid until", formatDate(expiryDate)]
  ];
  details.forEach(([label, value], index) => {
    const yy = y + 67 + index * 10;
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(5.5).text(label, x + 67, yy, { width: 40 });
    doc.fillColor(INK).font("Helvetica").fontSize(6).text(safeText(value, "-"), x + 107, yy, { width: 78, ellipsis: true });
  });
  doc.image(qr, x + 196, y + 57, { width: 34, height: 34 });
  doc.moveTo(x + 187, y + 126).lineTo(x + 231, y + 126).stroke(GREEN);
  doc.fillColor(INK).font("Helvetica").fontSize(5.2).text("Authorized signature", x + 181, y + 130, { width: 56, align: "center" });
  doc.fillColor("#547064").fontSize(5).text(`Issued ${formatDate(issueDate)}`, x + 67, y + 137, { width: 112 });
}

function drawIdBack(doc, student, context, x, y, qr, code) {
  cardFrame(doc, x, y);
  doc.roundedRect(x, y, CR80[0], 31, 8).fill(GREEN);
  drawLogoBadge(doc, x + 9, y + 5, 22);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text("INSTITUTE INFORMATION", x + 38, y + 12, { width: 190, align: "center" });
  let yy = y + 42;
  const instituteRows = [
    ["Address", context.address || context.location],
    ["Phone", context.phone],
    ["Email", context.email],
    ["Website", context.website],
    ["Emergency", student.contact]
  ].filter(([, value]) => safeText(value).trim());
  instituteRows.forEach(([label, value]) => {
    doc.fillColor(PALM).font("Helvetica-Bold").fontSize(6).text(`${label}:`, x + 12, yy, { width: 42 });
    doc.fillColor(INK).font("Helvetica").fontSize(6).text(value, x + 54, yy, { width: 128, ellipsis: true });
    yy += 12;
  });
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(6.5).text("If found, please return this card to the institute.", x + 12, y + 108, { width: 167 });
  doc.fillColor(INK).font("Helvetica").fontSize(5.5)
    .text("This card is non-transferable. Report loss promptly. The holder must follow institute rules.", x + 12, y + 120, { width: 167, height: 25 });
  doc.image(qr, x + 191, y + 48, { width: 38, height: 38 });
  doc.fillColor("#547064").font("Helvetica").fontSize(4.8).text(code, x + 181, y + 91, { width: 58, align: "center" });
}

function expiryForSession(session) {
  const match = safeText(session).match(/(\d{4})\D+(\d{4})/);
  return match ? new Date(`${match[2]}-06-30T00:00:00Z`) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));
}

export async function idCardPdf(student, res, options = {}) {
  const context = await reportContext(student);
  const issueDate = new Date();
  const expiryDate = expiryForSession(context.academicSession);
  const code = documentCode("ID", student);
  const qr = await qrBuffer(JSON.stringify({ type: "student-id", code, student: String(student._id), rollNumber: student.rollNumber }));
  const a4 = options.layout === "a4";
  const doc = new PDFDocument({
    size: a4 ? "A4" : CR80,
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
    info: { Title: `${student.name} - Student ID Card`, Author: context.name }
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${student.rollNumber}-id-card${a4 ? "-a4" : ""}.pdf"`);
  doc.pipe(res);
  if (a4) {
    doc.addPage({ size: "A4", margin: 0 });
    pageBackground(doc);
    const x = (doc.page.width - CR80[0]) / 2;
    await drawIdFront(doc, student, context, x, 180, qr, issueDate, expiryDate);
    drawIdBack(doc, student, context, x, 180 + CR80[1] + 28, qr, code);
    doc.fillColor("#547064").font("Helvetica").fontSize(7).text("Print at 100% scale. Cut along the card border.", 0, 158, { width: doc.page.width, align: "center" });
  } else {
    doc.addPage({ size: CR80, margin: 0 });
    await drawIdFront(doc, student, context, 0, 0, qr, issueDate, expiryDate);
    doc.addPage({ size: CR80, margin: 0 });
    drawIdBack(doc, student, context, 0, 0, qr, code);
  }
  doc.end();
}
