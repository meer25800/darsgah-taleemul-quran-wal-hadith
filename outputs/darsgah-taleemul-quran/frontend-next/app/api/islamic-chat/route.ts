import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createHash } from "crypto";
import { z } from "zod";
import {
  ISLAMIC_ASSISTANT_SYSTEM_PROMPT,
  ISLAMIC_REFUSAL,
  classifyIslamicScope,
  localIslamicFallback,
  sanitizeAssistantAnswer
} from "@/lib/islamic-assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const historySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1200)
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(historySchema).max(8).optional().default([])
});

const windowStore = new Map<string, { count: number; resetAt: number }>();
const dayStore = new Map<string, { count: number; resetAt: number }>();

const minuteLimit = Number(process.env.ISLAMIC_ASSISTANT_MINUTE_LIMIT || 10);
const dailyLimit = Number(process.env.ISLAMIC_ASSISTANT_DAILY_LIMIT || 50);
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function visitorKey(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip") || forwarded || "local";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${realIp}:${userAgent}:${process.env.JWT_SECRET || "darsgah"}`).digest("hex");
}

function hitLimit(store: Map<string, { count: number; resetAt: number }>, key: string, max: number, ms: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + ms });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Groq request timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function compactList(items: any[] = [], mapper: (item: any) => string) {
  return items.slice(0, 8).map(mapper).filter(Boolean).join("; ") || "No public records available.";
}

async function getDarsgahPublicContext() {
  try {
    const res = await fetch(`${API_URL}/public/home`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Public home failed: ${res.status}`);
    const home = await res.json();
    return [
      "APPROVED PUBLIC DARSGAH DATABASE CONTEXT:",
      "School name: Darsgah Taleemul Quran Wal Hadith.",
      "Location: Kongamdara, Pattan, Jammu and Kashmir.",
      "Classes: Class 1 through Class 8 when active class records are available.",
      `Public faculty: ${compactList(home.faculty, (item) => `${item.name}${item.designation ? ` (${item.designation})` : ""}`)}`,
      `Public books: ${compactList(home.books, (item) => `${item.title}${item.category ? ` [${item.category}]` : ""}`)}`,
      `Public resources: ${compactList(home.resources, (item) => `${item.title}${item.category ? ` [${item.category}]` : ""}`)}`,
      `Public syllabus: ${compactList(home.syllabus, (item) => `${item.title}${item.className ? ` (${item.className})` : ""}`)}`,
      `Public notices: ${compactList(home.notices, (item) => `${item.title}: ${item.body || item.description || ""}`.slice(0, 180))}`,
      `Public events: ${compactList(home.events, (item) => `${item.title}: ${item.description || ""}`.slice(0, 180))}`,
      `Public videos: ${compactList(home.videos, (item) => item.title)}`,
      "If a Darsgah detail is not present in this context, answer exactly: This information is not currently available. Please contact the Darsgah administration.",
      "Never reveal private student, parent, faculty, attendance, marks, login or password information."
    ].join("\n");
  } catch (error) {
    console.error("Darsgah context fetch failed:", error instanceof Error ? error.message : error);
    return [
      "APPROVED PUBLIC DARSGAH DATABASE CONTEXT:",
      "School name: Darsgah Taleemul Quran Wal Hadith.",
      "Location: Kongamdara, Pattan, Jammu and Kashmir.",
      "Detailed public database information is currently unavailable.",
      "For unavailable Darsgah details, answer exactly: This information is not currently available. Please contact the Darsgah administration."
    ].join("\n");
  }
}

export async function POST(req: NextRequest) {
  let fallbackPayload: z.infer<typeof chatSchema> | null = null;
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 16_000) {
      return json({ success: false, error: "The request is too large." }, 413);
    }

    const key = visitorKey(req);
    if (hitLimit(windowStore, key, minuteLimit, 60_000) || hitLimit(dayStore, key, dailyLimit, 24 * 60 * 60_000)) {
      return json({ success: false, error: "Too many questions have been submitted. Please wait and try again." }, 429);
    }

    const parsed = chatSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ success: false, error: "Please enter a valid Islamic-related question." }, 400);
    }

    const { message, history } = parsed.data;
    fallbackPayload = parsed.data;
    const scope = classifyIslamicScope(message);
    if (scope.classification === "unrelated") {
      return json({ success: true, answer: ISLAMIC_REFUSAL, classification: scope.classification });
    }
    if (scope.classification === "unsafe") {
      return json({
        success: true,
        answer: ISLAMIC_REFUSAL,
        classification: scope.classification
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured.");
      return json({
        success: true,
        answer: localIslamicFallback(message, scope.classification),
        classification: scope.classification,
        degraded: true
      });
    }

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const darsgahContext = await getDarsgahPublicContext();
    const completion = await withTimeout(
      groq.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: ISLAMIC_ASSISTANT_SYSTEM_PROMPT },
          { role: "system", content: darsgahContext },
          ...history.map((entry) => ({ role: entry.role, content: entry.content })),
          { role: "user", content: message }
        ]
      }),
      18_000
    );

    const answer = sanitizeAssistantAnswer(completion.choices?.[0]?.message?.content, scope.classification, message);
    return json({ success: true, answer, classification: scope.classification });
  } catch (error) {
    console.error("Islamic assistant error:", error instanceof Error ? error.message : error);
    if (fallbackPayload) {
      const scope = classifyIslamicScope(fallbackPayload.message);
      return json({
        success: true,
        answer: localIslamicFallback(fallbackPayload.message, scope.classification),
        classification: scope.classification,
        degraded: true
      });
    }
    return json({ success: true, answer: ISLAMIC_REFUSAL, degraded: true });
  }
}
