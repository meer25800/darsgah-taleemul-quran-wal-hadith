"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, FileText, Save } from "lucide-react";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/erp/DashboardShell";

const classOptions = Array.from({ length: 8 }, (_, index) => `Class ${index + 1}`);
const today = new Date().toISOString().slice(0, 10);

export default function FacultyDashboard() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [marksForm, setMarksForm] = useState({ student: "", term: "Term 1", obtainedMarks: "", maxMarks: "100", remarks: "" });
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get("/erp/faculty/dashboard");
      setData(res.data);
      if (res.data.classes?.[0]?._id) setSelectedClassId(res.data.classes[0]._id);
      const firstSubject = (res.data.faculty?.assignedSubjects?.[0] || res.data.subjects?.[0])?._id || "";
      setSelectedSubject(firstSubject);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Faculty dashboard API is not reachable. Restart the backend on port 5000 and login again.");
    }
  }

  const subjectOptions = useMemo(() => {
    const assigned = data?.faculty?.assignedSubjects || [];
    return assigned.length ? assigned : (data?.subjects || []);
  }, [data]);
  const visibleClasses = useMemo(() => data?.classes?.length ? data.classes : [], [data]);
  const selectedClassDoc = useMemo(() => visibleClasses.find((item: any) => item._id === selectedClassId) || visibleClasses[0] || null, [visibleClasses, selectedClassId]);
  const selectedClass = selectedClassDoc?.name || "";

  const classStudents = useMemo(() => (data?.students || []).filter((student: any) => {
    if (!selectedClassDoc) return false;
    const studentClassId = typeof student.classId === "object" ? student.classId?._id : student.classId;
    return String(studentClassId || "") === String(selectedClassDoc._id) || (student.className === selectedClassDoc.name && student.section === selectedClassDoc.section);
  }), [data, selectedClassDoc]);
  const classSyllabus = useMemo(() => (data?.syllabus || []).filter((item: any) => {
    if (!selectedClassDoc) return false;
    const syllabusClassId = typeof item.classId === "object" ? item.classId?._id : item.classId;
    return String(syllabusClassId || "") === String(selectedClassDoc._id) || item.className === selectedClassDoc.name;
  }), [data, selectedClassDoc]);

  useEffect(() => {
    const next: Record<string, string> = {};
    classStudents.forEach((student: any) => { next[student._id] = attendance[student._id] || "present"; });
    setAttendance(next);
    setMarksForm((current) => ({ ...current, student: classStudents[0]?._id || "" }));
    setAttendanceSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, data]);

  async function saveAttendance() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.post("/erp/faculty/attendance", {
        classId: selectedClassDoc?._id,
        className: selectedClass,
        section: selectedClassDoc?.section || "A",
        subject: selectedSubject,
        date: attendanceDate,
        records: classStudents.map((student: any) => ({ student: student._id, status: attendance[student._id] || "present" }))
      });
      setAttendanceSaved(true);
      setMessage(`Attendance saved for ${selectedClass}${selectedClassDoc?.section ? ` - ${selectedClassDoc.section}` : ""}. Student and parent portals now use this updated attendance.`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMarks(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.post("/erp/faculty/results", {
        student: marksForm.student,
        subject: selectedSubject,
        term: marksForm.term,
        exam: marksForm.term,
        obtainedMarks: Number(marksForm.obtainedMarks),
        maxMarks: Number(marksForm.maxMarks || 100),
        remarks: marksForm.remarks
      });
      setMessage("Marks saved. Student, parent, admin, and grade card data will use the latest marks.");
      setMarksForm((current) => ({ ...current, obtainedMarks: "", remarks: "" }));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save marks.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) return <DashboardShell title="Faculty Dashboard"><Card><p className="text-red-700">{error}</p></Card></DashboardShell>;
  if (!data) return <DashboardShell title="Faculty Dashboard"><Card>Loading faculty data...</Card></DashboardShell>;

  return (
    <DashboardShell title="Faculty Dashboard">
      {error && <Card className="mb-6"><p className="text-red-700">{error}</p></Card>}
      {message && <Card className="mb-6"><p className="text-emerald-700">{message}</p></Card>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><h2 className="text-xl font-bold">{data.faculty?.name}</h2><p>{data.faculty?.designation}</p><p>{data.faculty?.qualification}</p></Card>
        <Card><h2 className="text-xl font-bold">Assigned Classes</h2><p className="mt-2 text-sm text-emerald-700">{(data.faculty?.assignedClasses || []).join(", ") || "All classes available"}</p></Card>
        <Card><h2 className="text-xl font-bold">Today&apos;s Register</h2><p>{classStudents.length} students loaded for {selectedClass}.</p></Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Assigned Classes</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleClasses.length ? visibleClasses.map((classDoc: any) => (
            <button key={classDoc._id} onClick={() => setSelectedClassId(classDoc._id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedClassDoc?._id === classDoc._id ? "bg-palm text-white" : "bg-emerald-50 text-emeraldInk"}`}>
              {classDoc.name} - {classDoc.section}
            </button>
          )) : <p className="text-sm text-emerald-700">No classes assigned to this faculty account.</p>}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><CalendarCheck className="text-palm" /><h2 className="text-xl font-bold">Attendance Register</h2></div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!classStudents.length} onClick={() => setAttendance(Object.fromEntries(classStudents.map((student: any) => [student._id, "present"])))}>Mark All Present</Button>
            <Button disabled={saving || !selectedSubject || !classStudents.length} onClick={saveAttendance}><Save size={16} /> Save Attendance</Button>
          </div>
        </div>
        {attendanceSaved && <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800"><span className="font-semibold">Attendance updated in portals.</span><Link className="font-bold underline" href="/dashboard/student">Open Student Portal</Link><Link className="font-bold underline" href="/dashboard/parent">Open Parent Portal</Link></div>}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select className="rounded-xl border px-3 py-3" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {subjectOptions.map((subject: any) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
          </select>
          <input className="rounded-xl border px-3 py-3" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          <div className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emeraldInk">{selectedClass}</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {classStudents.length ? classStudents.map((student: any) => (
            <div key={student._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3">
              <button onClick={() => setMarksForm((current) => ({ ...current, student: student._id }))} className="flex items-center gap-3 text-left">
                <Image src={assetUrl(student.photoUrl, "/default-avatar.svg")} alt={student.name} width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
                <span><strong>{student.name}</strong><p className="text-sm text-emerald-700">{student.admissionNumber} • {student.rollNumber}</p></span>
              </button>
              <select className="rounded-xl border px-3 py-2" value={attendance[student._id] || "present"} onChange={(e) => setAttendance({ ...attendance, [student._id]: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </div>
          )) : <p className="text-sm text-emerald-700">No students found for {selectedClass}.</p>}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Add Marks</h2>
        <form onSubmit={saveMarks} className="mt-4 grid gap-3 md:grid-cols-3">
          <select className="rounded-xl border px-3 py-3" value={marksForm.student} onChange={(e) => setMarksForm({ ...marksForm, student: e.target.value })}>
            <option value="">Select Student</option>
            {classStudents.map((student: any) => <option key={student._id} value={student._id}>{student.name} ({student.rollNumber})</option>)}
          </select>
          <select className="rounded-xl border px-3 py-3" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {subjectOptions.map((subject: any) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
          </select>
          <select className="rounded-xl border px-3 py-3" value={marksForm.term} onChange={(e) => setMarksForm({ ...marksForm, term: e.target.value })}>
            <option>Term 1</option>
            <option>Term 2</option>
          </select>
          <input className="rounded-xl border px-3 py-3" placeholder="Obtained Marks" type="number" value={marksForm.obtainedMarks} onChange={(e) => setMarksForm({ ...marksForm, obtainedMarks: e.target.value })} />
          <input className="rounded-xl border px-3 py-3" placeholder="Max Marks" type="number" value={marksForm.maxMarks} onChange={(e) => setMarksForm({ ...marksForm, maxMarks: e.target.value })} />
          <input className="rounded-xl border px-3 py-3" placeholder="Remarks" value={marksForm.remarks} onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })} />
          <Button className="md:w-max" disabled={saving || !marksForm.student || !selectedSubject || !marksForm.obtainedMarks}><Save size={16} /> Save Marks</Button>
        </form>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center gap-2"><FileText className="text-palm" /><h2 className="text-xl font-bold">{selectedClass} Syllabus</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {classSyllabus.length ? classSyllabus.map((item: any) => (
            <Link key={item._id} href={`/reader/syllabus/${item._id}`} className="rounded-2xl border p-4 hover:bg-emerald-50">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-emerald-700">{item.category || item.subjectName || "Syllabus"} • Read Online</p>
            </Link>
          )) : <p className="text-sm text-emerald-700">No syllabus uploaded for {selectedClass} yet.</p>}
        </div>
      </Card>
    </DashboardShell>
  );
}
