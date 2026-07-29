import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy | Darsgah Kongamdara"
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-black text-emeraldInk">Privacy Policy</h1>
      <p className="mt-2 text-palm">Darsgah Taleemul Quran Wal Hadith, Kongamdara Pattan</p>

      <Card className="mt-8 space-y-5 leading-7">
        <p>
          This portal and Android app are used for Islamic institute information, admissions, student records,
          parent access, faculty attendance, marks, notices, books, resources, and related educational services.
        </p>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">Information We Collect</h2>
          <p>
            The system may store student, parent, faculty, admission, attendance, marks, fee, contact, uploaded
            document, and account-login information required to run the institute portal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">How We Use Information</h2>
          <p>
            Information is used only for institute administration, student and parent dashboards, faculty workflows,
            communication, academic records, notices, resources, and account security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">Data Sharing</h2>
          <p>
            Private student, parent, faculty, attendance, fee, and result data is not sold. Access is limited by role:
            admins manage records, faculty see assigned academic data, students see their own records, and parents see
            linked child records.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">Storage and Security</h2>
          <p>
            Passwords are stored in hashed form. Uploaded files are stored using configured cloud storage or secure
            hosting services. The institute takes reasonable steps to protect account and academic information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">Children and Students</h2>
          <p>
            Student data is handled for educational and administrative purposes under institute supervision. Parents or
            guardians may contact the administration for corrections or access concerns.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emeraldInk">Contact</h2>
          <p>
            For privacy questions, account issues, or data correction requests, please contact the Darsgah
            administration at Kongamdara, Pattan, Jammu and Kashmir.
          </p>
        </section>

        <p className="text-sm text-slate-500">Last updated: July 14, 2026</p>
      </Card>
    </main>
  );
}
