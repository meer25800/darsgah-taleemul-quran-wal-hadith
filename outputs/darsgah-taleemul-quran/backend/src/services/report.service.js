import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mark from "../models/Mark.js";
import Attendance from "../models/Attendance.js";
import Fee from "../models/Fee.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../assets/institute-logo.png");

export async function buildStudentSummary(student) {
  const marks = await Mark.find({ student: student._id }).populate("subject").lean();
  const total = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
  const max = marks.reduce((sum, mark) => sum + mark.maxMarks, 0) || 1;
  const percentage = Math.round((total / max) * 100);
  const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "D";
  const attendance = await Attendance.find({ student: student._id }).lean();
  const present = attendance.filter((item) => item.status === "present").length;
  const attendancePercentage = attendance.length ? Math.round((present / attendance.length) * 100) : 100;
  const fees = await Fee.find({ student: student._id }).lean();
  return { marks, total, max, percentage, grade, status: percentage >= 40 ? "Pass" : "Fail", attendancePercentage, fees };
}

function drawLogo(doc, x, y, size) {
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, x, y, { width: size, height: size });
  } else {
    doc.circle(x + size / 2, y + size / 2, size / 2).stroke("#0f5132");
  }
}

async function loadImageSource(value) {
  if (!value || value === "/institute-logo.png") return null;
  try {
    const raw = String(value);
    const pathname = raw.startsWith("http") ? new URL(raw).pathname : raw;
    if (pathname.startsWith("/uploads/")) {
      const localPath = path.join(__dirname, "../..", pathname.replace(/^\/+/, ""));
      return fs.existsSync(localPath) ? localPath : null;
    }
    if (/^https?:\/\//i.test(raw)) {
      const response = await fetch(raw);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }
    return fs.existsSync(raw) ? raw : null;
  } catch {
    return null;
  }
}

async function drawStudentPhoto(doc, student, x, y, size) {
  const source = await loadImageSource(student.photoUrl);
  if (source) {
    doc.save();
    doc.circle(x + size / 2, y + size / 2, size / 2).clip();
    doc.image(source, x, y, { width: size, height: size });
    doc.restore();
    doc.circle(x + size / 2, y + size / 2, size / 2).stroke("#d4af37");
    return;
  }
  doc.circle(x + size / 2, y + size / 2, size / 2).fillAndStroke("#effaf5", "#d4af37");
  doc.fillColor("#147a52").font("Helvetica-Bold").fontSize(Math.round(size * 0.42)).text(student.name?.[0] || "S", x, y + size * 0.31, { width: size, align: "center" });
}

function instituteHeader(doc, title) {
  doc.roundedRect(28, 28, 556, 104, 18).fill("#0f5132");
  drawLogo(doc, 48, 42, 76);
  doc.fillColor("#ffffff").fontSize(18).text("DARSGAH TALEEMUL QURAN WAL HADITH", 138, 48, { width: 410, align: "center" });
  doc.fillColor("#d4af37").fontSize(13).text("KONGAMDARA PATTAN", 138, 75, { width: 410, align: "center" });
  doc.fillColor("#0f5132").fontSize(16).text(title, 40, 150, { align: "center" });
}

export async function gradeCardPdf(student, res) {
  const summary = await buildStudentSummary(student);
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${student.rollNumber}-grade-card.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fbfaf3");
  instituteHeader(doc, "Official Grade Card");

  doc.roundedRect(40, 188, 515, 112, 14).fillAndStroke("#ffffff", "#d4af37");
  await drawStudentPhoto(doc, student, 462, 206, 72);
  doc.fillColor("#10231b").fontSize(10);
  const details = [
    ["Name", student.name],
    ["Student ID", student.rollNumber],
    ["Father Name", student.fatherName],
    ["Class / Section", `${student.className} - ${student.section}`],
    ["Admission No", student.admissionNumber],
    ["Contact", student.contact || "N/A"]
  ];
  details.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 60 : 255;
    const y = 208 + Math.floor(index / 2) * 28;
    doc.fillColor("#147a52").font("Helvetica-Bold").text(`${label}:`, x, y);
    doc.fillColor("#10231b").font("Helvetica").text(value || "N/A", x + 82, y);
  });

  const tableTop = 334;
  doc.roundedRect(40, tableTop, 515, 34, 10).fill("#0f5132");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
  doc.text("Subject", 58, tableTop + 11);
  doc.text("Term", 245, tableTop + 11);
  doc.text("Marks", 350, tableTop + 11);
  doc.text("Remarks", 430, tableTop + 11);

  let y = tableTop + 44;
  summary.marks.forEach((mark, index) => {
    doc.roundedRect(40, y - 6, 515, 20, 5).fill(index % 2 === 0 ? "#ffffff" : "#effaf5");
    doc.fillColor("#10231b").font("Helvetica").fontSize(8);
    doc.text(mark.subject?.name || "Subject", 58, y, { width: 150, height: 10, ellipsis: true });
    doc.text(mark.term, 245, y, { width: 70 });
    doc.text(`${mark.obtainedMarks}/${mark.maxMarks}`, 350, y, { width: 60 });
    doc.text(mark.remarks || "Good", 430, y, { width: 105, height: 10, ellipsis: true });
    y += 22;
  });

  y += 14;
  const summaryHeight = 214;
  if (y + summaryHeight > doc.page.height - 36) {
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fbfaf3");
    instituteHeader(doc, "Grade Card Summary");
    y = 190;
  }
  const footerY = y;
  const footerX = 40;
  const footerW = 515;
  const gap = 10;
  const statW = 158;
  const boxH = 54;
  doc.roundedRect(footerX, footerY, footerW, summaryHeight, 14).fillAndStroke("#ffffff", "#0ea5e9");
  doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(11);
  [
    [`Total: ${summary.total}/${summary.max}`, footerX + 18],
    [`Percentage: ${summary.percentage}%`, footerX + 18 + statW + gap],
    [`Grade: ${summary.grade}`, footerX + 18 + (statW + gap) * 2]
  ].forEach(([text, x]) => {
    doc.roundedRect(x, footerY + 16, statW, boxH, 8).fillAndStroke("#effaf5", "#d7efe4");
    doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(11).text(text, x + 10, footerY + 36, { width: statW - 20, align: "center" });
  });

  const remarks = summary.marks.find((mark) => mark.remarks)?.remarks || "Keep regular revision and attendance.";
  const rowY = footerY + 84;
  doc.roundedRect(footerX + 18, rowY, 274, 76, 8).fillAndStroke("#ffffff", "#d7efe4");
  doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(10).text("Remarks", footerX + 30, rowY + 12, { width: 250 });
  doc.fillColor("#10231b").font("Helvetica").fontSize(9).text(remarks, footerX + 30, rowY + 28, {
    width: 250,
    height: 38,
    ellipsis: true,
    lineGap: 1
  });

  doc.roundedRect(footerX + 306, rowY, 92, 76, 8).fillAndStroke("#ffffff", "#d7efe4");
  doc.roundedRect(footerX + 412, rowY, 84, 76, 8).fillAndStroke("#ffffff", "#d7efe4");
  doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(10).text("Status", footerX + 318, rowY + 14, { width: 68, align: "center" });
  doc.fillColor(summary.status === "Pass" ? "#147a52" : "#b42318").font("Helvetica-Bold").fontSize(13).text(summary.status, footerX + 318, rowY + 38, { width: 68, align: "center" });
  doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(10).text("Attendance", footerX + 420, rowY + 14, { width: 68, align: "center" });
  doc.fillColor("#10231b").font("Helvetica-Bold").fontSize(13).text(`${summary.attendancePercentage}%`, footerX + 420, rowY + 38, { width: 68, align: "center" });

  const sigY = footerY + 178;
  doc.roundedRect(footerX + 18, sigY - 8, 230, 28, 8).fillAndStroke("#ffffff", "#d7efe4");
  doc.roundedRect(footerX + 267, sigY - 8, 230, 28, 8).fillAndStroke("#ffffff", "#d7efe4");
  doc.moveTo(footerX + 42, sigY + 1).lineTo(footerX + 224, sigY + 1).stroke("#0f5132");
  doc.moveTo(footerX + 291, sigY + 1).lineTo(footerX + 473, sigY + 1).stroke("#0f5132");
  doc.fillColor("#10231b").font("Helvetica-Bold").fontSize(9).text("Class Teacher", footerX + 58, sigY + 7, { width: 150, align: "center" });
  doc.text("Principal / Head", footerX + 307, sigY + 7, { width: 150, align: "center" });
  doc.end();
}

export async function idCardPdf(student, res) {
  const doc = new PDFDocument({ size: [330, 510], margin: 20 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${student.rollNumber}-id-card.pdf"`);
  doc.pipe(res);

  doc.roundedRect(14, 14, 302, 482, 20).fillAndStroke("#ffffff", "#0ea5e9");
  doc.roundedRect(14, 14, 302, 138, 20).fill("#0f5132");
  drawLogo(doc, 133, 26, 64);
  doc.fillColor("#d4af37").font("Helvetica-Bold").fontSize(9).text("DARSGAH TALEEMUL QURAN WAL HADITH", 32, 98, { width: 266, align: "center" });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text("KONGAMDARA PATTAN", 32, 116, { width: 266, align: "center" });

  await drawStudentPhoto(doc, student, 117, 168, 96);

  doc.fillColor("#0f5132").font("Helvetica-Bold").fontSize(16).text(student.name, 28, 278, { width: 274, align: "center" });
  doc.fillColor("#10231b").font("Helvetica").fontSize(10);
  const rows = [
    ["Student ID", student.rollNumber],
    ["Admission No", student.admissionNumber],
    ["Class", `${student.className} - ${student.section}`],
    ["Father", student.fatherName],
    ["Contact", student.contact || "N/A"],
    ["Session", "2026-2027"]
  ];
  rows.forEach(([label, value], index) => {
    const yy = 318 + index * 22;
    doc.fillColor("#147a52").font("Helvetica-Bold").text(label, 46, yy);
    doc.fillColor("#10231b").font("Helvetica").text(value, 132, yy);
  });
  doc.roundedRect(60, 458, 210, 24, 12).fill("#0f5132");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text("Valid for current academic session", 72, 466);
  doc.end();
}
