"use client";

import { useState } from "react";
import type { Metadata } from "next";

import InfoShell, { Section } from "@/components/InfoShell";

// Demo page — the form is local-only and says so. No fake inboxes, no dead links.

const CHANNELS = [
  {
    icon: "✉",
    title: "email",
    line: "hello@nexsus.spec",
    note: "demo address — not wired to an inbox yet",
  },
  {
    icon: "⏱",
    title: "response time",
    line: "within one working day",
    note: "usually much faster",
  },
  {
    icon: "⚑",
    title: "issues",
    line: "report a bad extraction",
    note: "paste the document name + what looked wrong",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const valid =
    name.trim().length > 1 &&
    /.+@.+\..+/.test(email) &&
    message.trim().length > 5;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sent) return;
    setSent(true);
  };

  return (
    <InfoShell
      kicker="02 — talk to us"
      title="contact"
      blurb="Questions, feedback, or a PDF that fought back — we want to hear it."
    >
      <Section index="01" title="channels">
        <div className="grid gap-2 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <span className="text-lg text-fog-dim">{c.icon}</span>
              <h3 className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
                {c.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-white">{c.line}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-fog-faint">{c.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section index="02" title="send a message">
        {sent ? (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-6 text-center">
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-emerald-300">
              ✓ message received
            </p>
            <p className="mt-2 text-xs leading-relaxed text-fog-dim">
              This is a demo build — your note stayed on this device and was not
              sent anywhere. Wire up a mail endpoint to go live.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setMessage("");
              }}
              className="mt-4 rounded-lg border border-line-strong bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-fog-dim transition hover:border-white hover:text-white"
            >
              write another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
                  name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Ada Lovelace"
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-fog-faint focus:border-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
                  email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ada@analytical.engine"
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-fog-faint focus:border-white focus:outline-none"
                />
              </label>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
                message
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={6}
                rows={5}
                placeholder="Tell us what you're extracting, or what went sideways…"
                className="mt-1.5 w-full resize-none rounded-xl border border-line-strong bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-fog-faint focus:border-white focus:outline-none"
              />
            </label>
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-[11px] text-fog-faint">demo form — nothing leaves your browser.</p>
              <button
                type="submit"
                disabled={!valid}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                  valid
                    ? "bg-white text-black hover:bg-fog"
                    : "pointer-events-none border border-transparent bg-white/10 text-fog-faint"
                }`}
              >
                send message ⏎
              </button>
            </div>
          </form>
        )}
      </Section>
    </InfoShell>
  );
}
