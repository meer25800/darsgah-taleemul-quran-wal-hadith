"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle, Copy, Edit3, Eye, Printer, Search, Trash2, X } from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/erp/DashboardShell";

const classNames = Array.from({ length: 8 }, (_, index) => `Class ${index + 1}`);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const modules = ["classes", "timetable", "syllabus", "fees", "attendance", "results", "admissions", "announcements", "students", "parents", "faculty", "subjects", "books", "resources", "gallery", "videos", "events", "notices", "islamicAssistant", "loginManagement"];

const emptyForms: Record<string, any> = {
  classes: { name: "Class 1", section: "A", academicSession: "2026-2027", capacity: 30 },
  timetable: { classId: "", subject: "", faculty: "", day: "Monday", startTime: "", endTime: "", room: "" },
  syllabus: { uploadType: "complete-class", classId: "", section: "A", subject: "", title: "", academicYear: "2026-2027", description: "", textContent: "", isPublished: true, isPublic: true },
  fees: { classId: "", student: "", month: "", amount: 0, paidAmount: 0, paymentDate: "", paymentMethod: "Cash", status: "pending", receiptNumber: "", remarks: "" },
  attendance: { classId: "", subject: "", faculty: "", date: "" },
  results: { classId: "", student: "", term: "Term 1", academicYear: "2026-2027", remarks: "", isPublished: true },
  admissions: { studentName: "", fatherName: "", dob: "", gender: "Male", address: "", phone: "", previousClass: "", classApplyingFor: "Class 1", admissionDate: "", academicYear: "2026-2027", status: "pending" },
  announcements: { title: "", message: "", audience: "everyone", classId: "", priority: "normal", publishDate: "", expiryDate: "", isPublished: true },
  students: { rollNumber: "", admissionNumber: "", name: "", fatherName: "", classId: "", className: "Class 1", section: "A", contact: "" },
  parents: { name: "", phone: "", email: "", address: "", occupation: "", status: "active" },
  faculty: { employeeId: "", name: "", phone: "", email: "", designation: "", qualification: "", address: "", biography: "", assignedClasses: "", isPublished: true, status: "active" },
  subjects: { name: "", code: "", classId: "", className: "Class 1", maxMarks: 100 },
  books: { title: "", author: "", category: "Quran", description: "", classId: "", subjectId: "", externalUrl: "", language: "Urdu", isFeatured: false, published: true, isPublic: true, displayOrder: 0 },
  resources: { title: "", category: "Other", description: "", classId: "", subjectId: "", externalUrl: "", fileType: "pdf", isFeatured: false, published: true, isPublic: true, displayOrder: 0 },
  gallery: { title: "", description: "", caption: "", album: "Events", category: "Events", eventDate: "", displayOrder: 0, isFeatured: true, published: true },
  videos: { title: "", description: "", videoType: "YouTube", youtubeUrl: "", category: "Quran", displayOrder: 0, classId: "", subjectId: "", isFeatured: true, published: true, showOnHome: true },
  islamicAssistant: {
    enabled: true,
    publicName: "Darsgah Islamic Assistant",
    greeting: "Assalamu Alaikum! I can help with Islamic teachings, Quranic concepts, Hadith, Seerah, Islamic history, worship and Islamic terminology. How may I help you?",
    suggestedQuestions: "What are the five pillars of Islam?\nWhat does Taqwa mean?\nHow many daily prayers are there?\nExplain the meaning of Zakat.\nWhat is the difference between Fard and Sunnah?\nTell me about the importance of good character in Islam.",
    maxMessageLength: 1000,
    dailyRequestLimit: 50,
    disclaimer: "This assistant provides general Islamic educational information. For personal religious rulings or important matters, please consult a qualified Islamic scholar.",
    homepageVisible: true,
    displayPosition: "bottom-right",
    modelName: "",
    maintenanceMessage: "The Islamic Assistant is currently unavailable."
  },
  loginManagement: { role: "student", ownerId: "", username: "", email: "", name: "", phone: "", permissionGroup: "standard", password: "", confirmPassword: "", isActive: true, mustChangePassword: true }
};

export default function AdminDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const routeModule = moduleFromPath(pathname);
  const [resource, setResource] = useState(routeModule);
  const [items, setItems] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [lookup, setLookup] = useState<any>({ classes: [], students: [], faculty: [], subjects: [], parents: [] });
  const [form, setForm] = useState<any>(emptyForms.classes);
  const [filters, setFilters] = useState<any>({});
  const [editId, setEditId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [resultMarks, setResultMarks] = useState<Record<string, { obtainedMarks: string; maxMarks: string; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [credentialSlip, setCredentialSlip] = useState<any>(null);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const next = moduleFromPath(pathname);
    if (next !== resource) {
      setResource(next);
      setForm(cloneDefault(next));
      setEditId("");
      setFiles([]);
      setCredentialSlip(null);
      setMessage("");
      setError("");
      setFilters({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  useEffect(() => { loadModule(resource); }, [resource]);

  const classStudents = useMemo(() => {
    const selectedClass = lookup.classes.find((item: any) => item._id === form.classId);
    return (lookup.students || []).filter((student: any) => (form.classId && student.classId === form.classId) || (selectedClass && student.className === selectedClass.name && student.section === selectedClass.section));
  }, [lookup, form.classId]);

  const classSubjects = useMemo(() => {
    const selectedClass = lookup.classes.find((item: any) => item._id === form.classId);
    return (lookup.subjects || []).filter((subject: any) => !form.classId || subject.classId === form.classId || (selectedClass && subject.className === selectedClass.name));
  }, [lookup, form.classId]);

  useEffect(() => {
    const next: Record<string, string> = {};
    classStudents.forEach((student: any) => { next[student._id] = attendance[student._id] || "present"; });
    setAttendance(next);
    setForm((current: any) => ({ ...current, student: classStudents[0]?._id || current.student || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.classId, lookup.students]);

  useEffect(() => {
    const next: Record<string, { obtainedMarks: string; maxMarks: string; remarks: string }> = {};
    classSubjects.forEach((subject: any) => { next[subject._id] = resultMarks[subject._id] || { obtainedMarks: "", maxMarks: String(subject.maxMarks || 100), remarks: "" }; });
    setResultMarks(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.classId, lookup.subjects]);

  async function refreshAll() {
    try {
      const [a, classes, students, faculty, subjects, parents] = await Promise.all([
        api.get("/erp/analytics"),
        api.get("/erp/classes?limit=100"),
        api.get("/erp/students?limit=100"),
        api.get("/erp/faculty?limit=100"),
        api.get("/erp/subjects?limit=100"),
        api.get("/erp/parents?limit=100")
      ]);
      setAnalytics(a.data);
      setLookup({ classes: classes.data.items || [], students: students.data.items || [], faculty: faculty.data.items || [], subjects: subjects.data.items || [], parents: parents.data.items || [] });
    } catch (err: any) {
      if (isUnauthorized(err)) {
        clearAdminSession();
        setError("Your admin login session expired. Please login again.");
        router.replace("/login/admin");
        return;
      }
      setError("Server is not responding. Please start backend server.");
    }
  }

  async function loadModule(next = resource) {
    setLoading(true);
    setError("");
    try {
      if (next === "loginManagement") {
        const params = new URLSearchParams();
        if (filters.role) params.set("role", filters.role);
        if (filters.q) params.set("q", filters.q);
        const res = await api.get(`/erp/accounts?${params.toString()}`);
        setItems(res.data.items || []);
        return;
      }
      if (next === "islamicAssistant") {
        const res = await api.get("/erp/settings?limit=100");
        const setting = (res.data.items || []).find((item: any) => item.key === "islamicAssistant");
        if (setting?.value) setForm(normalizeForm("islamicAssistant", setting.value));
        setItems(setting ? [setting] : []);
        return;
      }
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => value && params.set(key, String(value)));
      const res = await api.get(`/erp/${next}?${params.toString()}`);
      setItems(res.data.items || []);
    } catch (err: any) {
      setItems([]);
      if (isUnauthorized(err)) {
        clearAdminSession();
        setError("Your admin login session expired. Please login again.");
        router.replace("/login/admin");
        return;
      }
      setError(err?.response?.data?.message || `Could not load ${next}.`);
    } finally {
      setLoading(false);
    }
  }

  function switchModule(next: string) {
    setResource(next);
    router.push(next === "classes" ? "/dashboard/admin" : `/dashboard/admin/${slugForModule(next)}`);
    setForm(cloneDefault(next));
    setEditId("");
    setFiles([]);
    setCredentialSlip(null);
    setMessage("");
    setError("");
    setFilters({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (resource === "syllabus") await saveSyllabus();
      else if (resource === "attendance") await saveAttendance();
      else if (resource === "results") await saveResults();
      else if (resource === "loginManagement") {
        const res = await api.post("/erp/credentials", form);
        setCredentialSlip({ ...res.data.user, name: ownerLabel(form.role, form.ownerId, lookup), temporaryPassword: res.data.temporaryPassword });
      }
      else if (resource === "books") await saveBook();
      else if (resource === "resources") await saveResource();
      else if (resource === "gallery") await saveGallery();
      else if (resource === "videos") {
        if (!String(form.title || "").trim()) throw new Error("Video title is required.");
        if (!extractYouTubeVideoId(form.youtubeUrl)) throw new Error("Enter a valid YouTube URL.");
        if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 0) throw new Error("Display order must be a non-negative whole number.");
        const body = { ...form, displayOrder: Number(form.displayOrder) };
        if (editId) await api.put(`/videos/${editId}`, body);
        else await api.post("/videos", body);
      }
      else if (resource === "islamicAssistant") {
        const payload = {
          key: "islamicAssistant",
          value: {
            ...normalizeBody(form),
            suggestedQuestions: String(form.suggestedQuestions || "").split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 8),
            maxMessageLength: Math.min(Number(form.maxMessageLength) || 1000, 1000),
            dailyRequestLimit: Number(form.dailyRequestLimit) || 50
          }
        };
        const existing = items.find((item: any) => item.key === "islamicAssistant");
        if (existing?._id) await api.put(`/erp/settings/${existing._id}`, payload);
        else await api.post("/erp/settings", payload);
      }
      else if (resource === "students" || resource === "faculty") {
        const body = await withUploadedPhoto(normalizeBody(form), resource === "students" ? "darsgah/student-photos" : "darsgah/faculty-photos");
        if (editId) await api.put(`/erp/${resource}/${editId}`, body);
        else await api.post(`/erp/${resource}`, body);
      }
      else {
        const body = normalizeBody(form);
        if (editId) await api.put(`/erp/${resource}/${editId}`, body);
        else await api.post(`/erp/${resource}`, body);
      }
      setMessage(`${label(resource)} saved successfully.`);
      setEditId("");
      setFiles([]);
      setUploadProgress(0);
      setForm(cloneDefault(resource));
      await refreshAll();
      await loadModule(resource);
    } catch (err: any) {
      setUploadProgress(0);
      setError(err?.response?.data?.message || err?.message || `Could not save ${label(resource)}.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveSyllabus() {
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value ?? "")));
    files.forEach((file) => body.append("files", file));
    await api.post("/erp/syllabus/upload", body, {
      onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0)
    });
  }

  async function saveAttendance() {
    await api.post("/erp/faculty/attendance", {
      classId: form.classId,
      subject: form.subject,
      faculty: form.faculty,
      date: form.date,
      records: classStudents.map((student: any) => ({ student: student._id, status: attendance[student._id] || "present" }))
    });
  }

  async function saveResults() {
    const subjects = Object.entries(resultMarks).map(([subject, mark]: any) => ({ subject, obtainedMarks: Number(mark.obtainedMarks || 0), maxMarks: Number(mark.maxMarks || 100), remarks: mark.remarks }));
    await api.post("/erp/results", { ...form, subjects });
  }

  async function remove(id: string) {
    if (!confirm("Delete this record permanently?")) return;
    const endpoint = resource === "gallery" ? `/gallery/${id}` : resource === "videos" ? `/videos/${id}` : `/erp/${resource}/${id}`;
    await api.delete(endpoint);
    setMessage("Record deleted.");
    await loadModule(resource);
    await refreshAll();
  }

  function edit(item: any) {
    setEditId(item._id);
    if (resource === "classes") setForm(normalizeForm(resource, { name: item.name, section: item.section, academicSession: item.academicSession, capacity: item.capacity || 30 }));
    else if (resource === "timetable") setForm(normalizeForm(resource, { classId: item.classId?._id || item.classId, subject: item.subject?._id || item.subject, faculty: item.faculty?._id || item.faculty, day: item.day, startTime: item.startTime, endTime: item.endTime, room: item.room || "" }));
    else if (resource === "fees") setForm(normalizeForm(resource, { classId: item.classId?._id || item.classId || "", student: item.student?._id || item.student, month: item.month, amount: item.amount, paidAmount: item.paidAmount, paymentDate: toDateInputValue(item.paymentDate), paymentMethod: item.paymentMethod || "Cash", status: item.status, receiptNumber: item.receiptNumber || "", remarks: item.remarks || "" }));
    else if (resource === "loginManagement") setForm(normalizeForm(resource, { role: item.role === "super_admin" ? "admin" : item.role, ownerId: item.student?._id || item.parent?._id || item.faculty?._id || "", username: item.username, email: item.email || item.username, name: item.name, isActive: item.isActive, mustChangePassword: item.mustChangePassword }));
    else setForm(normalizeForm(resource, { ...item, classId: item.classId?._id || item.classId, subject: item.subject?._id || item.subject, subjectId: item.subjectId?._id || item.subjectId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function withUploadedPhoto(body: any, folder: string) {
    if (!files[0]) return body;
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("folder", folder);
    const res = await api.post("/erp/upload", fd, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0) });
    return { ...body, photoUrl: res.data.file.url, profilePhotoUrl: res.data.file.url };
  }

  async function saveBook() {
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value ?? "")));
    if (files[0]) body.append("pdf", files[0]);
    if (files[1]) body.append("cover", files[1]);
    await api.post("/books/upload", body, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0) });
  }

  async function saveResource() {
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value ?? "")));
    if (files[0]) body.append("file", files[0]);
    await api.post("/resources/upload", body, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0) });
  }

  async function saveGallery() {
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value ?? "")));
    if (files[0]) body.append("file", files[0]);
    const path = editId ? `/gallery/${editId}` : "/gallery";
    if (editId) await api.put(path, body, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0) });
    else await api.post(path, body, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0) });
  }

  async function openPreview(item: any) {
    setPreviewLoading(true);
    setPreview({ resource, item: null, error: "" });
    try {
      if (resource === "loginManagement") {
        setPreview({ resource, item, error: "" });
        return;
      }
      const endpoint = resource === "gallery" ? `/gallery?limit=100` : resource === "videos" ? `/videos?limit=100` : `/erp/${resource}/${item._id}`;
      const res = await api.get(endpoint);
      const found = res.data.item || res.data.items?.find((x: any) => x._id === item._id) || item;
      setPreview({ resource, item: found, error: "" });
    } catch (err: any) {
      setPreview({ resource, item, error: err?.response?.data?.message || "Could not load preview." });
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <DashboardShell title="Admin ERP Dashboard">
      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Students" value={analytics?.students ?? "-"} /><Stat label="Faculty" value={analytics?.faculty ?? "-"} /><Stat label="Parents" value={analytics?.parents ?? "-"} /><Stat label="Classes" value={analytics?.classes ?? "-"} /><Stat label="Books" value={analytics?.books ?? "-"} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card><h2 className="font-bold">ERP Modules</h2><div className="mt-4 grid gap-2">{modules.map((item) => <button key={item} onClick={() => switchModule(item)} className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ${resource === item ? "bg-palm text-white" : "bg-emerald-50 text-emeraldInk"}`}>{label(item)}</button>)}</div></Card>
        <div className="grid gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black text-emeraldInk">Manage {label(resource)}</h2><FilterBar resource={resource} filters={filters} setFilters={setFilters} classes={lookup.classes} onSearch={() => loadModule(resource)} /></div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
            {uploadProgress > 0 && <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-50"><div className="h-full bg-palm" style={{ width: `${uploadProgress}%` }} /></div>}
            <form onSubmit={save} className="mt-5 grid gap-3">
              <ModuleForm resource={resource} form={form} setForm={setForm} lookup={lookup} classStudents={classStudents} classSubjects={classSubjects} files={files} setFiles={setFiles} attendance={attendance} setAttendance={setAttendance} resultMarks={resultMarks} setResultMarks={setResultMarks} />
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving}>{editId ? <Edit3 size={16} /> : <CheckCircle size={16} />} {saving ? "Saving..." : submitLabel(resource, Boolean(editId))}</Button>
                {editId && <Button type="button" variant="outline" onClick={() => { setEditId(""); setForm(cloneDefault(resource)); }}>Cancel Edit</Button>}
              </div>
            </form>
          </Card>
          {resource === "loginManagement" && credentialSlip && <CredentialSlip data={credentialSlip} onClose={() => setCredentialSlip(null)} />}
          <RecordsTable resource={resource} items={items} loading={loading} onPreview={openPreview} onEdit={edit} onDelete={remove} />
        </div>
      </div>
      {preview && <PreviewModal preview={preview} loading={previewLoading} onClose={() => setPreview(null)} />}
    </DashboardShell>
  );
}

function ModuleForm(props: any) {
  const { resource, form, setForm, lookup, classStudents, classSubjects, files, setFiles, attendance, setAttendance, resultMarks, setResultMarks } = props;
  if (resource === "classes") return <div className="grid gap-3 md:grid-cols-4"><Select value={form.name} onChange={(name) => setForm({ ...form, name })} options={classNames} /><Input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /><Input placeholder="Academic Year" value={form.academicSession} onChange={(e) => setForm({ ...form, academicSession: e.target.value })} /><Input placeholder="Maximum Students" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>;
  if (resource === "timetable") return <div className="grid gap-3 md:grid-cols-4"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.subject} onChange={(subject) => setForm({ ...form, subject })} options={lookup.subjects.map((s: any) => [s._id, s.name])} placeholder="Subject" /><Select value={form.faculty} onChange={(faculty) => setForm({ ...form, faculty })} options={lookup.faculty.map((f: any) => [f._id, f.name])} placeholder="Faculty" /><Select value={form.day} onChange={(day) => setForm({ ...form, day })} options={days} /><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /><Input placeholder="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>;
  if (resource === "syllabus") return <div className="grid gap-3"><div className="grid gap-3 md:grid-cols-4"><Select value={form.uploadType} onChange={(uploadType) => setForm({ ...form, uploadType })} options={[["complete-class", "Complete Class Syllabus"], ["subject-wise", "Subject-wise Syllabus"]]} /><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.subject} onChange={(subject) => setForm({ ...form, subject })} options={lookup.subjects.map((s: any) => [s._id, s.name])} placeholder="Subject Optional" /><Input placeholder="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div><Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea className="rounded-xl border px-4 py-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />{form.uploadType === "complete-class" ? <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} /> : <textarea className="min-h-48 rounded-xl border px-4 py-3" placeholder="Rich syllabus content: headings, units, topics, lists, tables..." value={form.textContent} onChange={(e) => setForm({ ...form, textContent: e.target.value })} />}<label className="flex gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>{files.length > 0 && <p className="text-sm text-palm">{files.length} file(s) selected.</p>}</div>;
  if (resource === "fees") return <div className="grid gap-3 md:grid-cols-4"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.student} onChange={(student) => setForm({ ...form, student })} options={classStudents.map((s: any) => [s._id, `${s.name} - ${s.admissionNumber}`])} placeholder="Student" /><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /><Input type="number" placeholder="Fee Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /><Input type="number" placeholder="Amount Paid" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} /><Input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} /><Select value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} options={["Cash", "UPI", "Bank", "Cheque"]} /><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={["paid", "partial", "pending", "waived"]} /><Input placeholder="Receipt Number" value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} /><Input placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /><div className="rounded-xl bg-emerald-50 p-3 text-sm font-bold">Balance: {Math.max(0, Number(form.amount || 0) - Number(form.paidAmount || 0))}</div></div>;
  if (resource === "attendance") return <div className="grid gap-3"><div className="grid gap-3 md:grid-cols-4"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.subject} onChange={(subject) => setForm({ ...form, subject })} options={classSubjects.map((s: any) => [s._id, s.name])} placeholder="Subject" /><Select value={form.faculty} onChange={(faculty) => setForm({ ...form, faculty })} options={lookup.faculty.map((f: any) => [f._id, f.name])} placeholder="Faculty" /><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div><Button type="button" variant="outline" onClick={() => setAttendance(Object.fromEntries(classStudents.map((s: any) => [s._id, "present"])))}>Mark All Present</Button><div className="grid gap-2 md:grid-cols-2">{classStudents.map((student: any) => <div key={student._id} className="flex items-center justify-between rounded-xl border p-3"><span>{student.name} - {student.admissionNumber}</span><Select value={attendance[student._id] || "present"} onChange={(status) => setAttendance({ ...attendance, [student._id]: status })} options={["present", "absent", "late", "leave"]} /></div>)}</div></div>;
  if (resource === "results") return <div className="grid gap-3"><div className="grid gap-3 md:grid-cols-4"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.student} onChange={(student) => setForm({ ...form, student })} options={classStudents.map((s: any) => [s._id, `${s.name} - ${s.admissionNumber}`])} placeholder="Student" /><Select value={form.term} onChange={(term) => setForm({ ...form, term })} options={["Term 1", "Term 2"]} /><Input placeholder="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div><div className="grid gap-2">{classSubjects.map((subject: any) => <div key={subject._id} className="grid gap-2 rounded-xl border p-3 md:grid-cols-4"><strong>{subject.name}</strong><Input type="number" placeholder="Obtained" value={resultMarks[subject._id]?.obtainedMarks || ""} onChange={(e) => setResultMarks({ ...resultMarks, [subject._id]: { ...resultMarks[subject._id], obtainedMarks: e.target.value } })} /><Input type="number" placeholder="Max" value={resultMarks[subject._id]?.maxMarks || "100"} onChange={(e) => setResultMarks({ ...resultMarks, [subject._id]: { ...resultMarks[subject._id], maxMarks: e.target.value } })} /><Input placeholder="Remarks" value={resultMarks[subject._id]?.remarks || ""} onChange={(e) => setResultMarks({ ...resultMarks, [subject._id]: { ...resultMarks[subject._id], remarks: e.target.value } })} /></div>)}</div><textarea className="rounded-xl border px-4 py-3" placeholder="Teacher remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>;
  if (resource === "announcements") return <div className="grid gap-3 md:grid-cols-2"><Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field><Field label="Audience"><Select value={form.audience} onChange={(audience) => setForm({ ...form, audience })} options={[["everyone", "Everyone"], ["student", "Students"], ["parent", "Parents"], ["faculty", "Faculty"], ["selected-class", "Selected Class"]]} /></Field>{form.audience === "selected-class" && <Field label="Class"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /></Field>}<Field label="Priority"><Select value={form.priority} onChange={(priority) => setForm({ ...form, priority })} options={[["normal", "Normal"], ["important", "Important"], ["urgent", "Urgent"]]} /></Field><Field label="Publish Date"><Input type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field><label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label><Field label="Message"><textarea className="min-h-28 rounded-xl border px-4 py-3 md:col-span-2" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field></div>;
  if (resource === "admissions") return <div className="grid gap-3 md:grid-cols-3"><Field label="Student Name"><Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></Field><Field label="Father / Guardian Name"><Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></Field><Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field><Field label="Gender"><Select value={form.gender} onChange={(gender) => setForm({ ...form, gender })} options={["Male", "Female", "Other"]} /></Field><Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Previous Class"><Input value={form.previousClass} onChange={(e) => setForm({ ...form, previousClass: e.target.value })} /></Field><Field label="Requested Class"><Select value={form.classApplyingFor} onChange={(classApplyingFor) => setForm({ ...form, classApplyingFor })} options={classNames} /></Field><Field label="Admission Date"><Input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} /></Field><Field label="Academic Session"><Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></Field><Field label="Status"><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={["pending", "approved", "rejected", "waitlisted"]} /></Field><Field label="Address"><textarea className="min-h-24 rounded-xl border px-4 py-3 md:col-span-3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>;
  if (resource === "students") return <div className="grid gap-3 md:grid-cols-3"><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFiles(Array.from(e.target.files || []))} /><Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="Registration / Roll Number *" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} /><Input placeholder="Admission Number *" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} /><Input placeholder="Father / Guardian Name *" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /><Input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={["active", "inactive", "passed_out"]} placeholder="Status" /></div>;
  if (resource === "faculty") return <div className="grid gap-3 md:grid-cols-3"><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFiles(Array.from(e.target.files || []))} /><Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /><Input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /><Input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /><Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input placeholder="Assigned Classes, comma separated" value={form.assignedClasses} onChange={(e) => setForm({ ...form, assignedClasses: e.target.value })} /><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={["active", "inactive"]} /><textarea className="rounded-xl border px-4 py-3 md:col-span-3" placeholder="Short biography" value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} /><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Display on homepage</label></div>;
  if (resource === "parents") return <div className="grid gap-3 md:grid-cols-3"><Input placeholder="Parent Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /><Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={["active", "inactive"]} /></div>;
  if (resource === "books") return <div className="grid gap-3 md:grid-cols-3"><Input placeholder="Book Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /><Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.subjectId} onChange={(subjectId) => setForm({ ...form, subjectId })} options={lookup.subjects.map((s: any) => [s._id, s.name])} placeholder="Subject" /><Input placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /><Input placeholder="External Website Link" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} /><Input type="file" accept=".pdf" onChange={(e) => setFiles([...(e.target.files ? Array.from(e.target.files) : []), files[1]].filter(Boolean) as File[])} /><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFiles([files[0], ...(e.target.files ? Array.from(e.target.files) : [])].filter(Boolean) as File[])} /><textarea className="rounded-xl border px-4 py-3 md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><Flags form={form} setForm={setForm} /></div>;
  if (resource === "resources") return <div className="grid gap-3 md:grid-cols-3"><Input placeholder="Resource Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Select value={form.category} onChange={(category) => setForm({ ...form, category })} options={["Subject Note", "Worksheet", "Dua", "Hadees", "Circular", "Admission Resource", "General Resource", "Other"]} /><Input placeholder="File Type" value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })} /><ClassSelect form={form} setForm={setForm} classes={lookup.classes} /><Select value={form.subjectId} onChange={(subjectId) => setForm({ ...form, subjectId })} options={lookup.subjects.map((s: any) => [s._id, s.name])} placeholder="Subject" /><Input placeholder="External Website Link" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} /><Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} /><textarea className="rounded-xl border px-4 py-3 md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><Flags form={form} setForm={setForm} /></div>;
  if (resource === "gallery") return <div className="grid gap-3 md:grid-cols-3"><Input placeholder="Gallery Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Input placeholder="Album / Category" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value, category: e.target.value })} /><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /><Input type="number" placeholder="Display Order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFiles(Array.from(e.target.files || []))} /><Input placeholder="Image Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /><textarea className="rounded-xl border px-4 py-3 md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><Flags form={form} setForm={setForm} /></div>;
  if (resource === "videos") return <div className="grid gap-3 md:grid-cols-3"><Field label="Video Title *"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field><Field label="YouTube URL *"><Input required inputMode="url" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} /></Field><Field label="Category *"><Select value={form.category} onChange={(category) => setForm({ ...form, category })} options={["Quran", "Tajweed", "Hadees", "Seerah", "Duas", "Institute Events", "Student Activities"]} /></Field><Field label="Display Order"><Input type="number" min="0" step="1" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></Field><Field label="Target Class"><ClassSelect form={form} setForm={setForm} classes={lookup.classes} placeholder="All Classes" /></Field><Field label="Target Subject"><Select disabled={!form.classId} value={form.subjectId} onChange={(subjectId) => setForm({ ...form, subjectId })} options={lookup.subjects.filter((s: any) => !form.classId || String(s.classId || "") === String(form.classId)).map((s: any) => [s._id, s.name])} placeholder={form.classId ? "All Subjects" : "Select a class first"} /></Field><Field label="Description"><textarea className="min-h-28 rounded-xl border px-4 py-3 md:col-span-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Flags form={form} setForm={setForm} /><VideoPreview url={form.youtubeUrl} title={form.title} description={form.description} /></div>;
  if (resource === "islamicAssistant") return <div className="grid gap-3 md:grid-cols-2"><label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Assistant enabled</label><label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(form.homepageVisible)} onChange={(e) => setForm({ ...form, homepageVisible: e.target.checked })} /> Show on homepage</label><Field label="Assistant Public Name"><Input value={form.publicName} onChange={(e) => setForm({ ...form, publicName: e.target.value })} /></Field><Field label="Display Position"><Select value={form.displayPosition} onChange={(displayPosition) => setForm({ ...form, displayPosition })} options={[["bottom-right", "Bottom Right"], ["bottom-left", "Bottom Left"]]} /></Field><Field label="Maximum Message Length"><Input type="number" value={form.maxMessageLength} onChange={(e) => setForm({ ...form, maxMessageLength: e.target.value })} /></Field><Field label="Daily Request Limit"><Input type="number" value={form.dailyRequestLimit} onChange={(e) => setForm({ ...form, dailyRequestLimit: e.target.value })} /></Field><Field label="Optional Model Name"><Input value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} placeholder="Server GROQ_MODEL still controls the active model" /></Field><Field label="Greeting Message"><textarea className="min-h-28 rounded-xl border px-4 py-3" value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} /></Field><Field label="Suggested Questions, one per line"><textarea className="min-h-40 rounded-xl border px-4 py-3" value={form.suggestedQuestions} onChange={(e) => setForm({ ...form, suggestedQuestions: e.target.value })} /></Field><Field label="Disclaimer"><textarea className="min-h-28 rounded-xl border px-4 py-3" value={form.disclaimer} onChange={(e) => setForm({ ...form, disclaimer: e.target.value })} /></Field><Field label="Maintenance Message"><textarea className="min-h-24 rounded-xl border px-4 py-3 md:col-span-2" value={form.maintenanceMessage} onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })} /></Field><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 md:col-span-2">Security note: the Groq API key, Islamic-only system prompt, refusal rule, and prompt-protection rules are server-only and cannot be edited from this page.</p></div>;
  if (resource === "loginManagement") return <div className="grid gap-3 md:grid-cols-3"><Field label="Account Type"><Select value={form.role} onChange={(role) => setForm({ ...cloneDefault("loginManagement"), role, username: nextUsername(role, lookup) })} options={[["student", "Student"], ["parent", "Parent"], ["faculty", "Faculty/Teacher"], ["admin", "Administrator"]]} /></Field>{form.role !== "admin" ? <><Field label="Select User"><Select value={form.ownerId} onChange={(ownerId) => setForm({ ...form, ownerId, username: ownerUsername(form.role, ownerId, lookup) || form.username })} options={ownersFor(form.role, lookup).map((o: any) => [o._id, o.label])} placeholder="Select existing person" /></Field><Field label="Username / ID"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field></> : <><Field label="Full Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Email Address"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Permission Group"><Input value={form.permissionGroup} onChange={(e) => setForm({ ...form, permissionGroup: e.target.value })} /></Field></>}<Field label="Temporary Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field><Field label="Confirm Password"><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field><label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label><label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(form.mustChangePassword)} onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })} /> Force password change</label></div>;
  return <GenericForm form={form} setForm={setForm} lookup={lookup} />;
}

function Flags({ form, setForm }: any) {
  return <div className="flex flex-wrap gap-4 md:col-span-3"><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.published)} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.showOnHome)} onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })} /> Show on homepage</label>{"isPublic" in form && <label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.isPublic)} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} /> Public</label>}</div>;
}

function Field({ label: title, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-semibold text-emeraldInk"><span>{title}</span>{children}</label>;
}

function VideoPreview({ url, title, description }: any) {
  if (!String(url || "").trim()) return null;
  const id = extractYouTubeVideoId(url);
  if (!id) return <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700 md:col-span-3">This is not a supported YouTube URL.</p>;
  return <div className="md:col-span-3"><p className="mb-2 text-sm font-semibold text-palm">Video preview</p><div className="aspect-video max-w-2xl overflow-hidden rounded-2xl border bg-emerald-950"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${id}`} title={title || "Video preview"} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><strong className="mt-2 block">{title || "Untitled video"}</strong>{description && <p className="text-sm text-emerald-700">{description}</p>}</div>;
}

function GenericForm({ form, setForm, lookup }: any) {
  return <div className="grid gap-3 md:grid-cols-3">{Object.keys(form).map((key) => key === "classId" ? <ClassSelect key={key} form={form} setForm={setForm} classes={lookup.classes} /> : typeof form[key] === "boolean" ? <label key={key} className="flex items-center gap-2 rounded-xl border px-3 py-3 text-sm"><input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} /> {label(key)}</label> : <Input key={key} placeholder={label(key)} value={String(form[key] ?? "")} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}</div>;
}

function RecordsTable({ resource, items, loading, onPreview, onEdit, onDelete }: any) {
  return <Card><h2 className="mb-3 text-xl font-bold">Database Records</h2>{loading && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-palm">Loading records...</p>}{!loading && !items.length && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">No records found.</p>}<div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Record</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item: any) => <tr key={item._id} className="border-b align-top"><td className="py-2 font-semibold">{recordTitle(resource, item)}</td><td>{recordDetail(resource, item)}</td><td>{recordStatus(item)}</td><td><div className="flex gap-1"><button title="Preview" onClick={() => onPreview(item)} className="rounded-full p-2 hover:bg-emerald-50"><Eye size={15} /></button><button title="Edit" onClick={() => onEdit(item)} className="rounded-full p-2 text-palm hover:bg-emerald-50"><Edit3 size={15} /></button><button title="Print" onClick={() => window.print()} className="rounded-full p-2 hover:bg-emerald-50"><Printer size={15} /></button><button title="Delete" onClick={() => onDelete(item._id)} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></Card>;
}

function FilterBar({ resource, filters, setFilters, classes, onSearch }: any) {
  if (!["classes", "timetable", "syllabus", "fees", "attendance", "results", "admissions", "announcements"].includes(resource)) return <Button type="button" onClick={onSearch}><Search size={16} /> Refresh</Button>;
  return <div className="flex flex-wrap gap-2"><select className="rounded-full border px-3 py-2 text-sm" value={filters.className || ""} onChange={(e) => setFilters({ ...filters, className: e.target.value })}><option value="">All Classes</option>{classes.map((c: any) => <option key={c._id} value={c.name}>{c.name} - {c.section}</option>)}</select>{resource === "timetable" && <Select value={filters.day || ""} onChange={(day) => setFilters({ ...filters, day })} options={days} placeholder="All Days" />}{resource === "fees" && <Select value={filters.status || ""} onChange={(status) => setFilters({ ...filters, status })} options={["paid", "partial", "pending", "waived"]} placeholder="All Status" />}{resource === "syllabus" && <Select value={filters.uploadType || ""} onChange={(uploadType) => setFilters({ ...filters, uploadType })} options={[["complete-class", "Complete Class"], ["subject-wise", "Subject-wise"]]} placeholder="All Types" />}<Button type="button" onClick={onSearch}><Search size={16} /> Filter</Button></div>;
}

function ClassSelect({ form, setForm, classes, placeholder = "Select Class" }: any) {
  return <select className="rounded-xl border px-3 py-3" value={form.classId || ""} onChange={(e) => {
    const classDoc = classes.find((item: any) => item._id === e.target.value);
    setForm({ ...form, classId: e.target.value, subjectId: "", className: classDoc?.name || "", section: classDoc?.section || "" });
  }}><option value="">{placeholder}</option>{classes.map((c: any) => <option key={c._id} value={c._id}>{c.name} - {c.section}</option>)}</select>;
}

function Select({ value, onChange, options, placeholder, disabled = false }: any) {
  return <select disabled={disabled} className="rounded-xl border px-3 py-3 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" value={value || ""} onChange={(e) => onChange(e.target.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map((option: any) => Array.isArray(option) ? <option key={option[0]} value={option[0]}>{option[1]}</option> : <option key={option} value={option}>{option}</option>)}</select>;
}

function Stat({ label, value }: { label: string; value: any }) { return <Card><p className="text-sm text-palm">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></Card>; }
function isUnauthorized(err: any) { return err?.response?.status === 401; }
function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("darsgah_token");
  localStorage.removeItem("darsgah_user");
}
function label(value: string) {
  const labels: Record<string, string> = { videos: "Institute Videos", loginManagement: "Login Management", islamicAssistant: "Islamic AI Assistant", super_admin: "Super Admin" };
  return labels[value] || value.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
}
function submitLabel(resource: string, editing: boolean) {
  const singular: Record<string, string> = {
    videos: "Video",
    announcements: "Announcement",
    admissions: "Admission",
    classes: "Class",
    books: "Book",
    resources: "Resource",
    gallery: "Gallery Photo",
    syllabus: "Syllabus"
  };
  return `${editing ? "Update" : "Save"} ${singular[resource] || label(resource)}`;
}
function recordStatus(item: any) {
  if (typeof item.isActive === "boolean") return item.isActive ? "Active" : "Inactive";
  if (typeof item.published === "boolean") return item.published ? "Published" : "Hidden";
  if (typeof item.isPublished === "boolean") return item.isPublished ? "Published" : "Unpublished";
  return item.status || item.priority || "";
}
function normalizeBody(form: any) {
  const body = { ...form };
  if (body.assignedClasses && typeof body.assignedClasses === "string") body.assignedClasses = body.assignedClasses.split(",").map((x: string) => x.trim()).filter(Boolean);
  return body;
}
function cloneDefault(resource: string) {
  return { ...(emptyForms[resource] || { title: "", description: "" }) };
}
function normalizeForm(resource: string, record: any = {}) {
  const base = cloneDefault(resource);
  const merged: any = { ...base, ...record };
  if (resource === "islamicAssistant" && Array.isArray(merged.suggestedQuestions)) {
    merged.suggestedQuestions = merged.suggestedQuestions.join("\n");
  }
  Object.keys(base).forEach((key) => {
    if (merged[key] === null || merged[key] === undefined) merged[key] = base[key];
    if (typeof base[key] === "boolean") merged[key] = Boolean(merged[key]);
  });
  ["dob", "admissionDate", "publishDate", "expiryDate", "paymentDate", "eventDate"].forEach((key) => {
    if (key in merged) merged[key] = toDateInputValue(merged[key]);
  });
  return merged;
}
function toDateInputValue(value: any) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function moduleFromPath(pathname = "") {
  const slug = pathname.split("/").filter(Boolean).at(-1);
  const map: Record<string, string> = { "login-management": "loginManagement", "islamic-assistant": "islamicAssistant", videos: "videos" };
  const next = map[slug || ""] || slug || "classes";
  return modules.includes(next) ? next : "classes";
}
function slugForModule(resource: string) {
  if (resource === "islamicAssistant") return "islamic-assistant";
  return resource === "loginManagement" ? "login-management" : resource;
}
function extractYouTubeVideoId(value = "") {
  try {
    const url = new URL(String(value).trim());
    const host = url.hostname.toLowerCase();
    const allowed = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"];
    if (!allowed.includes(host)) return "";
    const id = host.includes("youtu.be") ? url.pathname.split("/").filter(Boolean)[0] : url.pathname.startsWith("/watch") ? url.searchParams.get("v") : url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") ? url.pathname.split("/").filter(Boolean)[1] : "";
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? String(id) : "";
  } catch {
    return "";
  }
}
function recordTitle(resource: string, item: any) {
  if (resource === "classes") return `${item.name} - ${item.section}`;
  if (resource === "fees") return item.student?.name || item.student || "Fee record";
  if (resource === "timetable") return `${item.className || item.classId?.name} ${item.day || ""}`;
  if (resource === "admissions") return item.studentName || item.applicationId;
  return item.name || item.title || item.rollNumber || item.key || item._id;
}
function recordDetail(resource: string, item: any) {
  if (resource === "classes") return `${item.academicSession || ""} | Capacity ${item.capacity || 0} | Students ${item.currentStudentCount || 0}`;
  if (resource === "fees") return `${item.student?.admissionNumber || ""} | ${item.month} | Total ${item.amount || 0} | Paid ${item.paidAmount || 0} | Balance ${item.balance || 0}`;
  if (resource === "timetable") return `${item.subject?.name || "Subject"} | ${item.faculty?.name || "Faculty"} | ${item.startTime}-${item.endTime} | ${item.room || ""}`;
  if (resource === "syllabus") return `${item.className} ${item.section || ""} | ${item.uploadType || ""} | ${item.academicYear || ""}`;
  if (resource === "announcements") return `${item.audience || ""} | ${item.priority || ""}`;
  return item.category || item.className || item.description || item.body || "";
}

function ownersFor(role: string, lookup: any) {
  if (role === "student") return (lookup.students || []).map((item: any) => ({ ...item, label: `${item.name} - ${item.admissionNumber || item.rollNumber || "student"}` }));
  if (role === "parent") return (lookup.parents || []).map((item: any) => ({ ...item, label: `${item.name} - ${item.phone || item.email || "parent"}` }));
  if (role === "faculty") return (lookup.faculty || []).map((item: any) => ({ ...item, label: `${item.name} - ${item.employeeId || item.designation || "faculty"}` }));
  return [];
}

function ownerUsername(role: string, ownerId: string, lookup: any) {
  const owner = ownersFor(role, lookup).find((item: any) => item._id === ownerId);
  if (!owner) return "";
  if (role === "student") return owner.username || owner.rollNumber || owner.admissionNumber || "";
  if (role === "parent") return owner.username || owner.phone || "";
  if (role === "faculty") return owner.username || owner.employeeId || "";
  return "";
}

function ownerLabel(role: string, ownerId: string, lookup: any) {
  return ownersFor(role, lookup).find((item: any) => item._id === ownerId)?.label || label(role);
}

function nextUsername(role: string, lookup: any) {
  const prefix = role === "faculty" ? "FAC" : role === "parent" ? "PAR" : "DTQ-2026";
  const count = role === "faculty" ? (lookup.faculty || []).length + 1 : role === "parent" ? (lookup.parents || []).length + 1 : (lookup.students || []).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

function CredentialSlip({ data, onClose }: any) {
  const text = `Role: ${data.role}\nName: ${data.name || ""}\nUsername: ${data.username}\nTemporary password: ${data.temporaryPassword || "Not changed"}`;
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-emeraldInk">Login Credentials Saved</h2><p className="mt-1 text-sm text-palm">Password is shown only now when it was reset. It is stored hashed in the database.</p></div><button onClick={onClose} className="rounded-full p-2 hover:bg-emerald-50"><X size={18} /></button></div><div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm"><p><strong>Role:</strong> {data.role}</p><p><strong>Name:</strong> {data.name}</p><p><strong>Username:</strong> {data.username}</p><p><strong>Temporary Password:</strong> {data.temporaryPassword || "Password not changed"}</p></div><div className="mt-4 flex gap-2"><Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(text)}><Copy size={16} /> Copy</Button><Button type="button" variant="outline" onClick={() => window.print()}><Printer size={16} /> Print</Button></div></Card>;
}

function PreviewModal({ preview, loading, onClose }: any) {
  const item = preview.item || {};
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"><div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-palm">{label(preview.resource)} Preview</p><h2 className="text-2xl font-black text-emeraldInk">{recordTitle(preview.resource, item) || "Record preview"}</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-emerald-50"><X size={20} /></button></div>{loading && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-palm">Loading preview...</p>}{preview.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{preview.error}</p>}{!loading && !preview.error && <PreviewBody resource={preview.resource} item={item} />}</div></div>;
}

function PreviewBody({ resource, item }: any) {
  if (resource === "students") return <div className="grid gap-5 md:grid-cols-[160px_1fr]"><AvatarImage src={item.profilePhotoUrl || item.photoUrl} alt={item.name} /><Details item={item} fields={["name", "admissionNumber", "rollNumber", "fatherName", "className", "section", "contact", "status"]} /><div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={() => downloadFile(`/admin/students/${item._id}/id-card`, "id-card.pdf")}>Download ID Card</Button><Button type="button" variant="outline" onClick={() => downloadFile(`/admin/students/${item._id}/grade-card`, "grade-card.pdf")}>Download Grade Card</Button></div></div>;
  if (resource === "faculty") return <div className="grid gap-5 md:grid-cols-[160px_1fr]"><AvatarImage src={item.photoUrl || item.profilePhotoUrl} alt={item.name} /><Details item={item} fields={["name", "employeeId", "designation", "qualification", "phone", "email", "status"]} /></div>;
  if (resource === "parents") return <Details item={item} fields={["name", "phone", "email", "occupation", "address", "status"]} />;
  if (resource === "gallery") return <div className="grid gap-4"><MediaImage src={item.imageUrl || item.thumbnailUrl} alt={item.title} /><Details item={item} fields={["title", "album", "category", "caption", "description", "eventDate", "uploadedBy", "published"]} /></div>;
  if (resource === "videos") return <div className="grid gap-4">{item.embedUrl && <iframe className="aspect-video w-full rounded-2xl border" src={item.embedUrl} title={item.title} allowFullScreen />}<Details item={item} fields={["title", "category", "description", "youtubeUrl", "published", "showOnHome"]} /></div>;
  if (resource === "books" || resource === "resources" || resource === "syllabus") return <div className="grid gap-4"><Details item={item} fields={["title", "author", "category", "className", "subject", "description", "academicYear", "fileType", "published", "isPublished"]} />{(item.coverUrl || item.thumbnailUrl) && <MediaImage src={item.coverUrl || item.thumbnailUrl} alt={item.title} />}{(item.fileUrl || item.pdfUrl) && <iframe className="h-[520px] w-full rounded-2xl border" src={assetUrl(item.fileUrl || item.pdfUrl)} title={item.title} />}<div className="flex flex-wrap gap-2">{(item.fileUrl || item.pdfUrl) && <a className="rounded-full bg-palm px-4 py-2 text-sm font-bold text-white" href={assetUrl(item.fileUrl || item.pdfUrl)} target="_blank">Open File</a>}{item.externalUrl && <a className="rounded-full border border-palm px-4 py-2 text-sm font-bold text-palm" href={item.externalUrl} target="_blank">Open External Link</a>}</div></div>;
  if (resource === "loginManagement") return <Details item={item} fields={["role", "username", "isActive", "mustChangePassword", "lastLoginAt"]} />;
  return <Details item={item} fields={Object.keys(item).filter((key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)).slice(0, 14)} />;
}

function Details({ item, fields }: any) {
  return <div className="grid gap-2 md:grid-cols-2">{fields.map((field: string) => <div key={field} className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-palm">{label(field)}</p><p className="mt-1 break-words text-sm">{formatValue(item[field])}</p></div>)}</div>;
}

function formatValue(value: any) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return value.name || value.title || value.email || value._id || JSON.stringify(value);
  return String(value);
}

function AvatarImage({ src, alt }: any) {
  const finalSrc = src ? assetUrl(src) : "/default-avatar.svg";
  return <div className="relative h-40 w-40 overflow-hidden rounded-2xl border bg-emerald-50"><Image src={finalSrc} alt={alt || "Profile"} fill className="object-cover" /></div>;
}

function MediaImage({ src, alt }: any) {
  if (!src) return null;
  return <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-emerald-50"><Image src={assetUrl(src)} alt={alt || "Preview"} fill className="object-cover" /></div>;
}
