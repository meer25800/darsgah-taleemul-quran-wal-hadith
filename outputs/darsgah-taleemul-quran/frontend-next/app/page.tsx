import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, Download, GraduationCap, HeartHandshake, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { VideoEmbedCard } from "@/components/VideoEmbedCard";
import { IslamicAssistantChat } from "@/components/IslamicAssistantChat";
import { assetUrl } from "@/lib/assets";
import { DocumentCard } from "@/components/DocumentCard";
import { LogoBadge } from "@/components/LogoBadge";

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
  const institute = {
    phone: home.institute?.phone || "+919906237556",
    location: home.institute?.location || "Kongamdara Pattan, Jammu & Kashmir",
    mapUrl:
      home.institute?.mapUrl ||
      "https://www.google.com/maps/place/34%C2%B007'04.8%22N+74%C2%B035'12.4%22E/@34.1182154,74.5868014,19z/data=!4m4!3m3!8m2!3d34.1179956!4d74.5867706?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D",
    mapEmbedUrl:
      home.institute?.mapEmbedUrl ||
      "https://www.google.com/maps?q=34.1179956,74.5867706&z=18&output=embed"
  };
  return (
    <main>
      <section className="islamic-pattern bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="mx-auto grid min-h-[min(760px,calc(100svh-61px))] max-w-7xl items-center gap-8 px-3 py-8 sm:px-4 sm:py-12 lg:grid-cols-[.72fr_1.28fr]">
          <div className="mx-auto text-center">
            <LogoBadge size={280} priority className="h-44 w-44 shadow-soft sm:h-60 sm:w-60 lg:h-64 lg:w-64" />
            <p className="mt-4 text-lg font-bold text-palm sm:text-xl">الرَّحْمَٰنُ عَلَّمَ الْقُرْآنَ</p>
          </div>
          <div className="min-w-0">
            <p className="mb-3 text-2xl font-bold text-palm">Darsgah Taleemul Quran Wal Hadith</p>
            <h1 className="text-balance text-[clamp(2rem,5vw,4rem)] font-black leading-[1.08] text-emeraldInk">DARSGAH TALEEMUL QURAN WAL HADITH KONGAMDARA PATTAN</h1>
            <p className="mt-4 inline-flex items-center rounded-full border border-skySeal/20 bg-white px-5 py-2 text-sm font-bold uppercase tracking-wide text-skySeal shadow-soft">Kongamdara Pattan</p>
            <p className="mt-5 max-w-2xl text-base text-emerald-900/75 sm:text-lg">A live institute portal for admissions, students, parents, faculty, attendance, marks, books, notices, grade cards, ID cards, and Islamic learning resources.</p>
            <form action="/search" className="mt-6 flex max-w-xl flex-col gap-2 rounded-3xl border bg-white p-2 shadow-soft min-[390px]:flex-row min-[390px]:rounded-full">
              <input name="q" placeholder="Search books, resources, notices, gallery..." className="min-w-0 flex-1 rounded-full px-4 py-2 outline-none" />
              <button className="touch-target rounded-full bg-palm px-5 py-2 font-semibold text-white">Search</button>
            </form>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="touch-target inline-flex flex-1 items-center justify-center rounded-full bg-palm px-5 py-3 font-semibold text-white shadow-soft min-[390px]:flex-none" href="/login/student">Student Login</Link>
              <Link className="touch-target inline-flex flex-1 items-center justify-center rounded-full border border-palm bg-white px-5 py-3 font-semibold text-palm min-[390px]:flex-none" href="/login/parent">Parent Login</Link>
              <Link className="touch-target inline-flex flex-1 items-center justify-center rounded-full bg-emeraldInk px-5 py-3 font-semibold text-white min-[390px]:flex-none" href="/login/faculty">Faculty Login</Link>
              <Link className="touch-target inline-flex flex-1 items-center justify-center rounded-full bg-gold px-5 py-3 font-semibold text-emeraldInk min-[390px]:flex-none" href="/login/admin">Admin Login</Link>
              <a className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-skySeal bg-white px-5 py-3 font-semibold text-skySeal shadow-soft sm:w-auto" href="/downloads/DarsgahKongamdara.apk" download>
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
          {home.books?.length ? home.books.map((book: any) => <DocumentCard key={book._id} item={book} kind="book" detailsHref={`/books#book-${book._id}`} />) : <Card>No books are available yet.</Card>}
        </div>
      </Section>

      <Section id="resources" title="Resources" icon={<BookOpen />}>
        <div className="grid gap-4 md:grid-cols-3">
          {home.resources?.length ? home.resources.map((resource: any) => <DocumentCard key={resource._id} item={resource} kind="resource" detailsHref={`/resources#resource-${resource._id}`} />) : <Card>No resources are available yet.</Card>}
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

      <Section id="location-map" title="Location Map" icon={<MapPin />}>
        <Card className="overflow-hidden p-0">
          <iframe
            className="h-[360px] w-full border-0 sm:h-[440px]"
            src={institute.mapEmbedUrl}
            title="Darsgah Taleemul Quran Wal Hadith location map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-emeraldInk">{institute.location}</p>
            <a
              className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-palm px-5 py-3 font-semibold text-white"
              href={institute.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={18} /> Open in Google Maps
            </a>
          </div>
        </Card>
      </Section>

      <section className="bg-emeraldInk py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          <div>
            <Phone />
            <h2 className="mt-3 text-2xl font-bold">Contact</h2>
            <a className="mt-1 inline-flex min-h-12 items-center font-semibold underline-offset-4 hover:underline" href={`tel:${institute.phone}`}>
              {formatPhone(institute.phone)}
            </a>
          </div>
          <div>
            <MapPin />
            <h2 className="mt-3 text-2xl font-bold">Location</h2>
            <a
              className="mt-1 inline-flex min-h-12 items-center font-semibold underline-offset-4 hover:underline"
              href={institute.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${institute.location} in Google Maps`}
            >
              {institute.location}
            </a>
          </div>
          <div><LogoBadge size={68} /><h2 className="mt-3 text-2xl font-bold">Official Portal</h2></div>
        </div>
      </section>
      <IslamicAssistantChat />
    </main>
  );
}

function formatPhone(value: string) {
  const normalized = value.replace(/\s+/g, "");
  return normalized.startsWith("+91") ? `+91 ${normalized.slice(3, 8)} ${normalized.slice(8)}` : value;
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
