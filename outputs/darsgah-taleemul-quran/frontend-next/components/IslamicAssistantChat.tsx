"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Copy, Loader2, RefreshCcw, Send, Square, Trash2, X } from "lucide-react";
import { ISLAMIC_REFUSAL, isLikelyRtl } from "@/lib/islamic-assistant-client";
import { LogoBadge } from "@/components/LogoBadge";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Settings = {
  enabled: boolean;
  publicName: string;
  greeting: string;
  suggestedQuestions: string[];
  maxMessageLength: number;
  disclaimer: string;
  homepageVisible: boolean;
  displayPosition: string;
  maintenanceMessage: string;
};

const fallbackSettings: Settings = {
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
  disclaimer:
    "This assistant provides general Islamic educational information. For personal religious rulings or important matters, please consult a qualified Islamic scholar.",
  homepageVisible: true,
  displayPosition: "bottom-right",
  maintenanceMessage: "The Islamic Assistant is currently unavailable."
};

export function IslamicAssistantChat() {
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/islamic-chat/settings")
      .then((res) => res.json())
      .then((data) => setSettings({ ...fallbackSettings, ...data }))
      .catch(() => setSettings(fallbackSettings));
    try {
      const saved = sessionStorage.getItem("darsgah_islamic_chat");
      if (saved) setMessages(JSON.parse(saved).slice(-8));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("darsgah_islamic_chat", JSON.stringify(messages.slice(-8)));
    } catch {
      // Session storage is optional.
    }
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  const remaining = settings.maxMessageLength - input.length;
  const nearLimit = remaining <= 120;
  const visibleMessages = useMemo(
    () => [{ role: "assistant" as const, content: settings.greeting }, ...messages],
    [messages, settings.greeting]
  );

  if (!settings.homepageVisible) return null;

  async function sendMessage(text = input) {
    const clean = text.trim().slice(0, settings.maxMessageLength);
    if (!clean || loading) return;
    setError("");
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(nextMessages);
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/islamic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, history: messages.slice(-8) }),
        signal: abortRef.current.signal
      });
      const data = await res.json();
      if (res.status === 429) throw new Error("Too many questions have been submitted. Please wait and try again.");
      if (!data.success) throw new Error(data.error || "The assistant is temporarily unavailable. Please try again.");
      setMessages([...nextMessages, { role: "assistant", content: String(data.answer || ISLAMIC_REFUSAL) }]);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const message =
          err?.message ||
          "The assistant is temporarily unavailable. Please try again with an Islamic or institute-related question.";
        setError(message);
        setMessages([...nextMessages, { role: "assistant", content: message }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stopRequest() {
    abortRef.current?.abort();
    setLoading(false);
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setError("");
    try {
      sessionStorage.removeItem("darsgah_islamic_chat");
    } catch {
      // Ignore unavailable storage.
    }
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1400);
    } catch {
      setCopiedIndex(null);
    }
  }

  return (
    <div className="assistant-launcher fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-50 print:hidden sm:right-4">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-12 items-center gap-3 rounded-full border border-gold/50 bg-emeraldInk px-2 py-2 text-sm font-bold text-white shadow-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-gold/40 sm:px-4"
          aria-label="Open Darsgah Islamic Assistant"
        >
          <LogoBadge size={40} alt="" className="h-10 w-10" />
          <span className="hidden sm:inline">Islamic Assistant</span>
        </button>
      )}

      {open && (
        <section className="fixed inset-x-2 bottom-2 top-16 flex flex-col overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-2xl sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[680px] sm:max-h-[calc(100vh-2rem)] sm:w-[430px]" aria-label="Darsgah Islamic Assistant chat">
          <header className="flex items-center justify-between gap-3 bg-emeraldInk p-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <LogoBadge size={44} className="h-11 w-11" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-black">{settings.publicName}</h2>
                <p className="text-xs text-emerald-50">Islamic educational help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearChat} className="rounded-full p-2 hover:bg-white/10" aria-label="Clear conversation"><Trash2 size={18} /></button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close assistant"><X size={20} /></button>
            </div>
          </header>

          {!settings.enabled ? (
            <div className="grid flex-1 place-items-center p-6 text-center text-emeraldInk">{settings.maintenanceMessage}</div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-emerald-50/40 p-4">
                {visibleMessages.map((message, index) => {
                  const rtl = isLikelyRtl(message.content);
                  const assistant = message.role === "assistant";
                  return (
                    <div key={`${message.role}-${index}`} className={`group flex ${assistant ? "justify-start" : "justify-end"}`}>
                      <div
                        dir={rtl ? "rtl" : "ltr"}
                        className={`relative max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${assistant ? "bg-white text-emeraldInk shadow-soft" : "bg-palm text-white"}`}
                      >
                        {assistant && index === 0 && <Bot size={16} className="mb-1 inline-block text-gold" />} {message.content}
                        {assistant && index > 0 && (
                          <button
                            type="button"
                            onClick={() => copyMessage(message.content, index)}
                            className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 opacity-80 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-gold/40 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Copy assistant response"
                          >
                            {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-emeraldInk shadow-soft"><Loader2 size={16} className="animate-spin" /> Thinking...</div>}
                <div ref={scrollRef} />
              </div>

              <div className="border-t bg-white p-4">
                {!messages.length && (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                    {settings.suggestedQuestions.slice(0, 6).map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => sendMessage(question)}
                        disabled={loading}
                        className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emeraldInk hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                    <button type="button" onClick={() => messages.at(-1)?.role === "user" && sendMessage(messages.at(-1)!.content)} className="ml-2 inline-flex items-center gap-1 font-bold"><RefreshCcw size={14} /> Retry</button>
                  </div>
                )}

                <div className="rounded-2xl border border-emerald-900/10 bg-white p-2 focus-within:ring-2 focus-within:ring-gold/40">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value.slice(0, settings.maxMessageLength))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask an Islamic-related question..."
                    rows={2}
                    className="max-h-28 w-full resize-none bg-transparent px-2 py-1 text-sm outline-none"
                    aria-label="Message for Islamic Assistant"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${nearLimit ? "text-amber-700" : "text-emerald-700"}`}>{nearLimit ? `${remaining} characters left` : "Enter to send, Shift+Enter for new line"}</span>
                    {loading ? (
                      <button type="button" onClick={stopRequest} className="rounded-full bg-amber-100 p-2 text-amber-800" aria-label="Stop response"><Square size={17} /></button>
                    ) : (
                      <button type="button" onClick={() => sendMessage()} disabled={!input.trim()} className="rounded-full bg-palm p-2 text-white disabled:opacity-50" aria-label="Send message"><Send size={17} /></button>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-emerald-800/80">{settings.disclaimer}</p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
