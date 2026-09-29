import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Functions, ExecutionMethod } from "appwrite";
import { Send, X, Sparkles } from "lucide-react";
import { appwriteClient } from "@/lib/appwrite";
import { useAuth } from "@/hooks/useAuth";
import type { University } from "@/types/university";

export function openAdvisor(university?: University) {
  window.dispatchEvent(new CustomEvent("unispora:advisor", { detail: university }));
}

type Message = { role: "user" | "assistant"; text: string };
const functions = new Functions(appwriteClient);
const draftKey = "unispora-advisor-draft";
function readDraft(): string | undefined {
  try {
    const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
    if (saved && typeof saved.text === "string" && saved.expiresAt > Date.now()) return saved.text.slice(0, 2000);
    sessionStorage.removeItem(draftKey);
  } catch { /* Storage may be unavailable. */ }
}
function saveDraft(text: string) {
  try { sessionStorage.setItem(draftKey, JSON.stringify({ text, expiresAt: Date.now() + 30 * 60 * 1000 })); } catch { /* Keep the in-memory draft. */ }
}

export function AdvisorChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [university, setUniversity] = useState<University>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [authPrompt, setAuthPrompt] = useState(false);
  const pendingDraft = useRef<string | undefined>(readDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const sending = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    const show = (event: Event) => {
      trigger.current = document.activeElement as HTMLElement;
      const context = (event as CustomEvent<University | undefined>).detail;
      if (context) setUniversity(context);
      setOpen(true);
    };
    window.addEventListener("unispora:advisor", show);
    return () => window.removeEventListener("unispora:advisor", show);
  }, []);
  useEffect(() => {
    generation.current += 1;
    setMessages([]);
    if (user?.emailVerification && pendingDraft.current) {
      setInput(pendingDraft.current);
      pendingDraft.current = undefined;
      try { sessionStorage.removeItem(draftKey); } catch { /* Storage may be unavailable. */ }
      setOpen(true);
    } else {
      setInput(pendingDraft.current ?? "");
    }
    setAuthPrompt(false);
    setError("");
    setUniversity(undefined);
  }, [user?.$id]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy, open]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  async function send() {
    const text = input.trim();
    if (!text || sending.current) return;
    if (!user?.emailVerification) {
      setAuthPrompt(true);
      return;
    }
    sending.current = true;
    const requestGeneration = generation.current;
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next); setInput(""); setBusy(true); setError("");
    try {
      const result = await functions.createExecution({
        functionId: "unispora-ai-advisor", method: ExecutionMethod.POST, async: false,
        body: JSON.stringify({ messages: next.slice(-12), university: university ? {
          name: university.name, country: university.country, programs: university.programs,
          tuition: university.tuition, languages: university.languages,
          scholarships: university.scholarships, website: university.website,
        } : undefined }),
      });
      const data = JSON.parse(result.responseBody || "{}");
      if (result.responseStatusCode !== 200 || typeof data.answer !== "string") {
        throw new Error(data.message || "The advisor is temporarily unavailable. Please try again.");
      }
      if (generation.current === requestGeneration) setMessages([...next, { role: "assistant", text: data.answer }]);
    } catch (err) {
      if (generation.current === requestGeneration) {
        setError(err instanceof Error ? err.message : "Could not send your message.");
        setMessages(next.slice(0, -1)); setInput(text);
      }
    } finally { sending.current = false; setBusy(false); }
  }
  if (!open) return null;
  return (
    <section className="advisor-chat" role="dialog" aria-label="AI Advisor" onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <header className="advisor-chat-header"><span><Sparkles size={18} /> AI Advisor</span><button type="button" onClick={close} aria-label="Close AI Advisor"><X size={20} /></button></header>
      {university ? <div className="advisor-context">About {university.name}<button type="button" onClick={() => setUniversity(undefined)} aria-label="Clear university context"><X size={14} /></button></div> : null}
      <div className="advisor-messages" role="log" aria-live="polite">
        {!messages.length ? <p className="advisor-welcome">Hi! What would you like to know about universities, scholarships, or studying abroad?</p> : null}
        {messages.map((message, index) => <div key={index} className={`advisor-message ${message.role}`}>{message.text}</div>)}
        {busy ? <p role="status">Thinking…</p> : null}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="advisor-error" role="alert">{error}</p> : null}
      {authPrompt && !user?.emailVerification ? <div className="advisor-auth-prompt" role="alert">
        <p>Log in or sign up to send your message.</p>
        <div>
          <Link className="panel-action primary" to="/login" onClick={() => { pendingDraft.current = input; saveDraft(input); setOpen(false); }}>Log in</Link>
          <Link className="panel-action" to="/signup" onClick={() => { pendingDraft.current = input; saveDraft(input); setOpen(false); }}>Sign up</Link>
        </div>
        <small>Your draft will be here when you return.</small>
      </div> : null}
      <form className="advisor-compose" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask anything about studying abroad…" aria-label="Message AI Advisor" disabled={busy} />
        <button type="submit" aria-label="Send message" disabled={busy || !input.trim()}><Send size={18} /></button>
      </form>
      <p className="advisor-note">Powered by Gemini. Messages are sent to Google. Confirm fees and deadlines with official sources.</p>
    </section>
  );
}
