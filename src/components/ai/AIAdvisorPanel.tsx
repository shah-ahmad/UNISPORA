import { Link } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import type { University } from "@/data/universities";
import { GlassCard } from "@/components/ui/GlassCard";

const chips = [
  "Is this university good for Computer Science?",
  "Can I study in English?",
  "What scholarships are available?",
  "How much is tuition?",
  "What are the admission requirements?",
];

export function AIAdvisorPanel({ university }: { university: University }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `I can help with ${university.name}. I will use UniSpora's stored university data first, then point you to official sources when details may change.` },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "assistant", text: mockAnswer(text, university) },
    ]);
    setInput("");
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <GlassCard className="p-5">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-[#f6b75c]"><Sparkles size={16} /> UniSpora AI Advisor</p>
        <h1 className="mt-4 font-serif text-4xl text-[#fff4df]">University guidance, grounded in your shortlist.</h1>
        <div className="mt-5 rounded-[8px] border border-white/10 bg-black/20 p-4">
          <span className="text-xs uppercase tracking-[0.18em] text-[#ae9f89]">Selected context</span>
          <h2 className="mt-2 text-xl font-semibold text-[#fff6e7]">{university.name}</h2>
          <p className="mt-1 text-sm text-[#d7ccbb]">{university.city}, {university.country}</p>
          <p className="mt-3 text-sm text-[#d7ccbb]">{university.programs.join(", ")}</p>
        </div>
        <div className="mt-5 grid gap-2">
          {chips.map((chip) => (
            <button key={chip} type="button" className="prompt-chip text-left" onClick={() => send(chip)}>{chip}</button>
          ))}
        </div>
        <Link to="/consultants" className="panel-action primary mt-5">Talk to Consultant</Link>
      </GlassCard>
      <GlassCard className="flex min-h-[640px] flex-col p-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role === "user" ? "user" : ""}`}>{message.text}</div>
          ))}
        </div>
        <div className="mt-4 rounded-[8px] border border-white/10 bg-black/20 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#ae9f89]">Official source links</p>
          <a href={university.website} target="_blank" rel="noreferrer" className="text-sm text-[#ffd493] underline-offset-4 hover:underline">{university.website}</a>
        </div>
        <form
          className="mt-4 flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input className="lux-input flex-1" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about tuition, language, admissions, or scholarships..." />
          <button className="icon-send" type="submit" aria-label="Send message"><Send size={18} /></button>
        </form>
      </GlassCard>
    </section>
  );
}

function mockAnswer(prompt: string, university: University) {
  const lower = prompt.toLowerCase();
  if (lower.includes("english")) return `${university.name} supports ${university.languages.join(" and ")} study paths. For exact program language requirements, check the official program page before applying.`;
  if (lower.includes("scholarship")) return `Stored UniSpora data lists: ${university.scholarships.join(", ")}. I recommend confirming eligibility windows and required documents on the official scholarship pages.`;
  if (lower.includes("tuition")) return `The current UniSpora estimate is ${university.tuition}. Tuition can change by faculty and citizenship status, so verify it on the official fee page.`;
  if (lower.includes("computer science")) return `${university.programs.includes("Computer Science") || university.programs.includes("AI") ? "Yes, this looks relevant for Computer Science or adjacent technology pathways." : "It may not be the strongest Computer Science fit in this shortlist."} Compare curriculum, internship access, and English-taught modules.`;
  return `For ${university.name}, start with program fit, tuition range, language of instruction, scholarship deadlines, and admission documents. If you need document-level guidance, UniSpora can connect you with a consultant.`;
}
