import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const defaults = {
  enabled: true,
  publicName: "Darsgah Islamic Assistant",
  greeting:
    "Assalamu Alaikum! I can help with Islamic teachings, Quranic concepts, Hadith, Seerah, Islamic history, worship and Islamic terminology. How may I help you?",
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
  disclaimer:
    "This assistant provides general Islamic educational information. For personal religious rulings or important matters, please consult a qualified Islamic scholar.",
  homepageVisible: true,
  displayPosition: "bottom-right",
  maintenanceMessage: "The Islamic Assistant is currently unavailable."
};

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/public/islamic-assistant-settings`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ ...defaults, ...data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(defaults, { headers: { "Cache-Control": "no-store" } });
  }
}
