import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, Download, GraduationCap, HeartHandshake, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { VideoEmbedCard } from "@/components/VideoEmbedCard";
import { IslamicAssistantChat } from "@/components/IslamicAssistantChat";
import { assetUrl } from "@/lib/assets";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getHome() {
  try {
    const res = await fetch(`${API_URL}/public/home`, { cache: "no-store" });
    return await res.json();
  } catch {
    return { notices: [], books: [], resources: [], gallery: [], videos: [], events: [], faculty: [], syllabus: [] };
  }
}

export default async function HomePage() {
  const home = await getHome();
  return (
    <main>
      <section className="islamic-pattern bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="mx-auto max-w-sm text-center">
            <Image src="/institute-logo.png" alt="Institute logo" width={250} height={250} priority className="mx-auto rounded-full border-8 border-skySeal/30" />
            <p className="mt-5 text-xl font-bold text-palm">الرَّحْمَٰنُ عَلَّمَ الْقُرْآنَ</p>
          </Card>
          <div>
            <p className="mb-3 text-2xl font-bold text-palm">Darsgah Taleemul Quran Wal Hadith</p>
            <h1 className="text-4xl font-black leading-tight text-emeraldInk md:text-6xl">DARSGAH TALEEMUL QURAN WAL HADITH KONGAMDARA PATTAN</h1>
            <p className="mt-4 inline-flex items-center rounded-full border border-skySeal/20 bg-white px-5 py-2 text-sm font-bold uppercase tracking-wide text-skySeal shadow-soft">Kongamdara Pattan</p>
            <p className="mt-5 max-w-2xl text-lg text-emerald-900/75">A live institute portal for admissions, students, parents, faculty, attendance, marks, books, notices, grade cards, ID cards, and Islamic learning resources.</p>
            <form action="/search" className="mt-6 flex max-w-xl gap-2 rounded-full border bg-white p-2 shadow-soft">
              <input name="q" placeholder="Search books, resources, notices, gallery..." className="min-w-0 flex-1 rounded-full px-4 py-2 outline-none" />
              <button className="rounded-full bg-palm px-5 py-2 font-semibold text-white">Search</button>
            </form>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="rounded-full bg-palm px-5 py-3 font-semibold text-white shadow-soft" href="/login/student">Student Login</Link>
              <Link className="rounded-full border border-palm bg-white px-5 py-3 font-semibold text-palm" href="/login/parent">Parent Login</Link>
              <Link className="rounded-full bg-emeraldInk px-5 py-3 font-semibold text-white" href="/login/faculty">Faculty Login</Link>
              <Link className="rounded-full bg-gold px-5 py-3 font-semibold text-emeraldInk" href="/login/admin">Admin Login</Link>
              <a className="inline-flex items-center gap-2 rounded-full border border-skySeal bg-white px-5 py-3 font-semibold text-skySeal shadow-soft" href="/downloads/DarsgahKongamdara.apk" download>
                <Download size={18} /> Download Android App
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emeraldInk py-5 text-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Live Student Records", "Secure Student / Parent / Faculty Portals", "Digital Books and Resources", "Grade Card and ID Card Downloads"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center font-semibold">{item}</div>
          ))}
        </div>
      </section>

      <Section id="about" title="About Institute" icon={<GraduationCap />}>
        <Card><p>Darsgah Taleemul Quran Wal Hadith focuses on Quran, Hadeeth, Fiqh, Seerah, Tajweed, Arabic, Akhlaq, and disciplined Islamic learning with transparent communication for parents and students.</p></Card>
      </Section>

      <Section id="faculty" title="Our Faculty" icon={<GraduationCap />}>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(home.faculty || []).length ? home.faculty.map((member: any) => (
            <Card key={member._id} className="overflow-hidden p-0">
              <Image src={assetUrl(member.photoUrl, "/default-avatar.svg")} alt={member.name} width={480} height={360} loading="lazy" className="h-56 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-black text-emeraldInk">{member.name}</h3>
                <p className="mt-1 font-semibold text-palm">{member.designation || "Faculty Member"}</p>
                <p className="mt-1 text-sm text-emerald-700">{member.qualification || "Islamic Studies"}</p>
                <p className="mt-2 text-sm">{(member.assignedSubjects || []).map((subject: any) => subject.name).join(", ") || "Quran and Islamic Studies"}</p>
              </div>
            </Card>
          )) : <Card>No faculty profiles available yet.</Card>}
        </div>
      </Section>

      <Section id="admissions" title="Admissions" icon={<CalendarDays />}>
        <AdmissionForm />
      </Section>

      <Section id="books" title="Islamic Digital Library" icon={<BookOpen />}>
        <div className="grid gap-4 md:grid-cols-3">
          {home.books?.map((book: any) => (
            <Card key={book._id} className="overflow-hidden p-0">
              <Image src={assetUrl(book.coverUrl || book.thumbnailUrl)} alt={book.title} width={520} height={300} loading="lazy" className="h-44 w-full object-cover" />
              <div className="p-4">
                <strong className="text-lg">{book.title}</strong>
                <p className="mt-1 text-sm text-emerald-700">{book.category} | {book.author} | {book.language}</p>
                <p className="mt-1 text-xs text-emerald-800">Pages: {book.pages || "-"} | Edition: {book.edition || "2026"} | Downloads: {book.downloads || 0}</p>
                <p className="mt-2 line-clamp-3 text-sm">{book.description}</p>
                <CardActions readHref={`/reader/book/${book._id}`} downloadHref={`${API_URL}/books/${book._id}/download`} detailsHref="/books" />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="resources" title="Resources" icon={<BookOpen />}>
        <div className="grid gap-4 md:grid-cols-3">
          {home.resources?.map((resource: any) => (
            <Card key={resource._id} className="overflow-hidden p-0">
              <Image src={assetUrl(resource.thumbnailUrl)} alt={resource.title} width={520} height={300} loading="lazy" className="h-44 w-full object-cover" />
              <div className="p-4">
                <strong className="text-lg">{resource.title}</strong>
                <p className="mt-1 text-sm text-emerald-700">{resource.category} | {resource.fileType?.toUpperCase?.()} | {resource.fileSize || "Public resource"}</p>
                <p className="mt-1 text-xs text-emerald-800">Uploaded by {resource.uploadedBy || "Institute"} | Downloads: {resource.downloads || 0}</p>
                <p className="mt-2 line-clamp-3 text-sm">{resource.description}</p>
                <CardActions readHref={`/reader/resource/${resource._id}`} downloadHref={`${API_URL}/resources/${resource._id}/download`} detailsHref="/resources" />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="notices-events" title="Notices and Events">
        <div className="grid gap-4 md:grid-cols-3">{[...(home.notices || []), ...(home.events || [])].length ? [...(home.notices || []), ...(home.events || [])].map((item: any) => <Card key={item._id}><strong>{item.title}</strong><p className="mt-2 text-sm">{item.body || item.description}</p><p className="mt-2 text-xs text-emerald-700">{item.date?.slice?.(0, 10) || item.createdAt?.slice?.(0, 10) || "Published"}</p></Card>) : <Card>No notices or events available yet.</Card>}</div>
      </Section>

      <Section title="Featured Gallery">
        {(home.gallery || []).length ? <GalleryLightbox items={home.gallery || []} /> : <Card>No gallery images available yet.</Card>}
      </Section>

      <Section id="videos" title="Institute Videos">
        <div className="grid gap-4 md:grid-cols-2">{(home.videos || []).length ? home.videos?.map((video: any) => <VideoEmbedCard key={video._id} video={video} />) : <Card>No videos available yet.</Card>}</div>
      </Section>

      <Section title="Donate / Support Institute" icon={<HeartHandshake />}>
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>Support Quranic education, student welfare, books, learning resources, and institute development. Contact the office for donation details.</p>
            <a className="inline-flex items-center justify-center gap-2 rounded-full bg-palm px-5 py-3 font-semibold text-white" href="/downloads/DarsgahKongamdara.apk" download>
              <Download size={18} /> Download Android App
            </a>
          </div>
        </Card>
      </Section>

      <section className="bg-emeraldInk py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          <div><Phone /><h2 className="mt-3 text-2xl font-bold">Contact</h2><p>+91 70000 00000</p></div>
          <div><MapPin /><h2 className="mt-3 text-2xl font-bold">Location</h2><p>Kongamdara Pattan, Jammu & Kashmir</p></div>
          <div><Image src="/institute-logo.png" alt="Institute logo" width={68} height={68} className="rounded-full border-2 border-gold bg-white" /><h2 className="mt-3 text-2xl font-bold">Official Portal</h2></div>
        </div>
      </section>
      <IslamicAssistantChat />
    </main>
  );
}

function CardActions({ readHref, downloadHref, detailsHref }: { readHref: string; downloadHref: string; detailsHref: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link className="rounded-full bg-palm px-3 py-2 text-sm font-semibold text-white" href={readHref}>Read Online</Link>
      <a className="rounded-full border border-palm px-3 py-2 text-sm font-semibold text-palm" href={downloadHref}>Download</a>
      <Link className="rounded-full border px-3 py-2 text-sm font-semibold text-emeraldInk" href={detailsHref}>View Details</Link>
    </div>
  );
}

function Section({ id, title, icon, children }: { id?: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <section id={id} className="py-12"><div className="mx-auto max-w-7xl px-4"><div className="mb-6 flex items-center gap-3 text-palm">{icon}<h2 className="text-3xl font-bold text-emeraldInk">{title}</h2></div>{children}</div></section>;
}

function AdmissionForm() {
  return (
    <form action={`${API_URL}/public/admissions`} method="post" className="grid gap-4 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-soft md:grid-cols-2">
      <input name="studentName" required placeholder="Student Name" className="rounded-xl border px-4 py-3" />
      <input name="fatherName" placeholder="Father Name" className="rounded-xl border px-4 py-3" />
      <input name="phone" required placeholder="Phone" className="rounded-xl border px-4 py-3" />
      <input name="className" placeholder="Class" className="rounded-xl border px-4 py-3" />
      <textarea name="message" placeholder="Message" className="rounded-xl border px-4 py-3 md:col-span-2" />
      <button className="rounded-full bg-palm px-5 py-3 font-semibold text-white md:w-max">Submit Admission</button>
    </form>
  );
}
