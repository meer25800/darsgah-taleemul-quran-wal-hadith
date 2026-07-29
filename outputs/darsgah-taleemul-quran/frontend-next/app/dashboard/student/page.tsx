"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Download, FileText } from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { PerformanceCharts } from "@/components/erp/Charts";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/students/me/dashboard").then((res) => {
      setData(res.data);
      api.get(`/erp/students/${res.data.student._id}/performance`)
        .then((performanceRes) => setPerformance(performanceRes.data))
        .catch(() => setPerformance(null));
    }).catch((err) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("darsgah_token");
        localStorage.removeItem("darsgah_user");
        router.replace("/login/student");
        return;
      }
      setError(err?.response?.data?.message || "Student dashboard API is not reachable. Restart the backend on port 5000 and login again.");
    });
  }, [router]);
  if (error) return <DashboardShell title="Student Dashboard"><Card><p className="text-red-700">{error}</p></Card></DashboardShell>;
  if (!data) return <DashboardShell title="Student Dashboard"><Card>Loading live student data...</Card></DashboardShell>;
  const student = data.student;
  return (
    <DashboardShell title="Student Dashboard">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Percentage" value={`${data.percentage}%`} /><Stat label="Grade" value={data.grade} /><Stat label="Attendance" value={`${data.attendancePercentage}%`} /><Stat label="Status" value={data.status} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <Image src={assetUrl(student.photoUrl, "/default-avatar.svg")} alt={student.name} width={96} height={96} className="h-24 w-24 rounded-2xl border border-gold object-cover" />
            <div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm font-semibold text-palm">{student.className} - {student.section}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-1">
            <Info label="Roll No" value={student.rollNumber} /><Info label="Admission" value={student.admissionNumber} /><Info label="Father" value={student.fatherName} /><Info label="Contact" value={student.contact} />
          </div>
        </Card>
        <Card><h2 className="text-xl font-bold">Marks</h2>{["Term 1", "Term 2"].map((term) => <div key={term} className="mt-3"><strong className="text-palm">{term}</strong>{data.marks.filter((m: any) => m.term === term).map((m: any) => <p key={m._id} className="mt-2">{m.subject?.name}: {m.obtainedMarks}/{m.maxMarks}</p>)}</div>)}</Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => downloadFile("/students/me/grade-card", "grade-card.pdf")}><Download size={18} /> Grade Card</Button><Button variant="dark" onClick={() => downloadFile("/students/me/id-card", "id-card.pdf")}><Download size={18} /> ID Card</Button></div>
      <div className="mt-6">{performance && <PerformanceCharts charts={performance.charts} />}</div>
      <Timetable items={data.timetable} />
      <Fees items={data.fees} />
      <Content title="Assignments" items={data.assignments} />
      <SyllabusContent items={data.syllabus} />
      <Content title="Notices" items={[...data.notices, ...data.announcements]} />
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <Card><p className="text-sm text-palm">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <p className="mt-2 text-sm"><b>{label}:</b> {value || "N/A"}</p>; }
function Content({ title, items }: { title: string; items: any[] }) {
  return <Card className="mt-6"><h2 className="text-xl font-bold">{title}</h2><div className="mt-3 grid gap-2">{items?.length ? items.map((x) => <p key={x._id}>{x.title}: {x.description || x.body}</p>) : <p className="text-sm text-emerald-700">No items available yet.</p>}</div></Card>;
}
function SyllabusContent({ items }: { items: any[] }) {
  return (
    <Card className="mt-6" id="syllabus">
      <h2 className="text-xl font-bold">Class Syllabus</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items?.length ? items.map((item) => (
          <div key={item._id} className="rounded-2xl border bg-emerald-50/50 p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 text-palm" size={20} />
              <div className="min-w-0">
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-emerald-700">{item.className} • {item.category || item.subjectName || "Syllabus"}</p>
                <p className="mt-1 text-sm">{item.description || "Uploaded syllabus file is ready for online reading."}</p>
                <Link href={`/reader/syllabus/${item._id}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-palm px-4 py-2 text-sm font-semibold text-white"><BookOpen size={16} /> Read Online</Link>
              </div>
            </div>
          </div>
        )) : <p className="text-sm text-emerald-700">No syllabus uploaded for your class yet.</p>}
      </div>
    </Card>
  );
}

function Timetable({ items }: { items: any[] }) {
  return (
    <Card className="mt-6">
      <h2 className="text-xl font-bold">Class Timetable</h2>
      <div className="mt-3 overflow-auto">
        {items?.length ? <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Day</th><th>Subject</th><th>Time</th><th>Faculty</th><th>Room</th></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-b"><td className="py-2">{item.day}</td><td>{item.subject?.name || "Subject"}</td><td>{item.startTime} - {item.endTime}</td><td>{item.faculty?.name || "Faculty"}</td><td>{item.room || "-"}</td></tr>)}</tbody></table> : <p className="text-sm text-emerald-700">No timetable has been published yet.</p>}
      </div>
    </Card>
  );
}

function Fees({ items }: { items: any[] }) {
  return (
    <Card className="mt-6">
      <h2 className="text-xl font-bold">Fee History</h2>
      <div className="mt-3 overflow-auto">
        {items?.length ? <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-b"><td className="py-2">{item.month}</td><td>{item.amount}</td><td>{item.paidAmount}</td><td>{item.balance}</td><td className="capitalize">{item.status}</td></tr>)}</tbody></table> : <p className="text-sm text-emerald-700">No fee records available yet.</p>}
      </div>
    </Card>
  );
}
