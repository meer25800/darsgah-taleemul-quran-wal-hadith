"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarCheck, Download, FileText, IdCard, Megaphone } from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/erp/DashboardShell";

export default function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/parents/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Parent dashboard API is not reachable. Restart the backend on port 5000 and login again."));
  }, []);

  const notices = useMemo(() => data ? [...(data.notices || []), ...(data.announcements || [])] : [], [data]);

  if (error) return <DashboardShell title="Parent Dashboard"><Card><p className="text-red-700">{error}</p></Card></DashboardShell>;
  if (!data) return <DashboardShell title="Parent Dashboard"><Card>Loading child data...</Card></DashboardShell>;

  return (
    <DashboardShell title="Parent Dashboard">
      <div className="grid gap-5">
        {data.children.map((child: any) => <ChildPanel key={child.student._id} child={child} />)}
      </div>

      <Card className="mt-6" id="notices">
        <div className="flex items-center gap-2"><Megaphone className="text-palm" size={22} /><h2 className="text-xl font-bold">Notices</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {notices.length ? notices.map((n: any) => (
            <div key={n._id} className="rounded-2xl bg-emerald-50 p-4">
              <h3 className="font-bold">{n.title}</h3>
              <p className="mt-1 text-sm text-emerald-800">{n.body || n.description}</p>
            </div>
          )) : <p className="text-sm text-emerald-700">No notices available yet.</p>}
        </div>
      </Card>
    </DashboardShell>
  );
}

function ChildPanel({ child }: { child: any }) {
  const student = child.student;
  const term1 = child.summary.marks.filter((m: any) => m.term === "Term 1");
  const term2 = child.summary.marks.filter((m: any) => m.term === "Term 2");
  return (
    <Card>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Image src={assetUrl(student.photoUrl, "/default-avatar.svg")} alt={student.name} width={112} height={112} className="h-28 w-28 rounded-3xl border border-gold object-cover" />
            <div>
              <h2 className="text-2xl font-black text-emeraldInk">{student.name}</h2>
              <p className="font-semibold text-palm">{student.className} - {student.section}</p>
              <p className="text-sm text-emerald-700">Admission No: {student.admissionNumber}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniStat label="Attendance" value={`${child.summary.attendancePercentage}%`} />
            <MiniStat label="Grade" value={child.summary.grade} />
            <MiniStat label="Result" value={child.summary.status} />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => document.getElementById(`attendance-${student._id}`)?.scrollIntoView({ behavior: "smooth" })}><CalendarCheck size={16} /> View Attendance</Button>
            <Button onClick={() => downloadFile(`/parents/children/${student._id}/grade-card`, `${student.rollNumber}-grade-card.pdf`)}><Download size={16} /> View Grade Card</Button>
            <Button variant="dark" onClick={() => downloadFile(`/parents/children/${student._id}/id-card`, `${student.rollNumber}-id-card.pdf`)}><IdCard size={16} /> View ID Card</Button>
            <Button variant="outline" onClick={() => document.getElementById(`syllabus-${student._id}`)?.scrollIntoView({ behavior: "smooth" })}><BookOpen size={16} /> View Syllabus</Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div id={`attendance-${student._id}`} className="grid gap-3 md:grid-cols-3">
            <Info label="Father" value={student.fatherName} />
            <Info label="Contact" value={student.contact} />
            <Info label="Roll No" value={student.rollNumber} />
          </div>
          <div className="rounded-2xl border p-4">
            <h3 className="font-bold text-emeraldInk">Latest Marks</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <TermBox title="Term 1" marks={term1} />
              <TermBox title="Term 2" marks={term2} />
            </div>
          </div>
          <div id={`syllabus-${student._id}`} className="rounded-2xl border p-4">
            <h3 className="font-bold text-emeraldInk">Syllabus and Resources</h3>
            <div className="mt-3 grid gap-2">
              {child.syllabus?.length ? child.syllabus.map((item: any) => (
                <Link key={item._id} href={`/reader/syllabus/${item._id}`} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emeraldInk hover:bg-emerald-100">
                  <span className="flex items-center gap-2"><FileText size={16} /> {item.title}</span>
                  <span className="text-palm">Read Online</span>
                </Link>
              )) : <p className="text-sm text-emerald-700">No syllabus uploaded for this class yet.</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PortalList title="Fee History" items={child.fees} render={(item: any) => `${item.month}: ${item.status} | Paid ${item.paidAmount || 0} | Balance ${item.balance || 0}`} />
            <PortalList title="Timetable" items={child.timetable} render={(item: any) => `${item.day}: ${item.subject?.name || "Subject"} (${item.startTime}-${item.endTime})`} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-xs text-palm">{label}</p><strong className="text-xl text-emeraldInk">{value}</strong></div>;
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-palm">{label}</p><p className="mt-1 font-bold">{value || "N/A"}</p></div>;
}

function TermBox({ title, marks }: { title: string; marks: any[] }) {
  return (
    <div className="rounded-2xl bg-emerald-50 p-4">
      <h4 className="font-bold text-palm">{title}</h4>
      {marks.length ? marks.slice(0, 5).map((m) => <p key={m._id} className="mt-1 text-sm">{m.subject?.name || "Subject"}: {m.obtainedMarks}/{m.maxMarks}</p>) : <p className="mt-1 text-sm">No marks recorded.</p>}
    </div>
  );
}

function PortalList({ title, items, render }: { title: string; items: any[]; render: (item: any) => string }) {
  return (
    <div className="rounded-2xl border p-4">
      <h3 className="font-bold text-emeraldInk">{title}</h3>
      <div className="mt-2 grid gap-2 text-sm">
        {items?.length ? items.slice(0, 6).map((item) => <p key={item._id}>{render(item)}</p>) : <p className="text-emerald-700">No records available.</p>}
      </div>
    </div>
  );
}
