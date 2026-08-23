import type { Metadata } from "next";

import InfoShell, { Section } from "@/components/InfoShell";
import { STAGES } from "@/lib/types";

export const metadata: Metadata = {
  title: "About — Nexsus.Spec",
  description:
    "Nexsus.Spec reads spec sheets, datasheets and catalogs and turns them into organized, searchable product data. Built by Team Nexsus.",
};

const FACTS = [
  { n: "5", l: "pipeline stages" },
  { n: "3", l: "AI providers on failover" },
  { n: "3", l: "export formats" },
  { n: "0", l: "spreadsheets typed by hand" },
];

export default function AboutPage() {
  return (
    <InfoShell
      kicker="01 — who we are"
      title="about"
      blurb="A machine for reading the documents nobody wants to read."
    >
      <Section index="01" title="the idea">
        <p>
          Every product business runs on spec sheets, datasheets and catalogs —
          dense PDFs where the answer you need is buried between a voltage
          rating and a footnote. Humans copy that data by hand. It is slow,
          boring and full of typos.
        </p>
        <p>
          <span className="text-white">Nexsus.Spec</span> reads those documents
          for you. Drop a PDF in, get every product out as a clean page: each
          attribute with its value, key features, use cases — searchable,
          filterable and ready to export.
        </p>
      </Section>

      <Section index="02" title="how it works">
        <div className="grid gap-2 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <span className="text-xl">{s.icon}</span>
              <h3 className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white">
                {s.name}
              </h3>
            </div>
          ))}
        </div>
        <p>
          Ingest → Extract → Organize → Check → Export. Live AI does the
          reading; deterministic parsers stand by offline, so the machine never
          leaves you empty-handed.
        </p>
      </Section>

      <Section index="03" title="the team">
        <p>
          Built by <span className="text-white">Team Nexsus</span> — we believe
          product data should move at the speed of the products it describes.
          Nothing OS inspired the interface: quiet surfaces, dot-matrix texture,
          one red signal when something matters.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.l} className="rounded-xl border border-line bg-white/[0.02] px-4 py-3">
              <p className="font-mono text-xl font-bold text-white">{f.n}</p>
              <p className="mt-0.5 text-[10.5px] text-fog-faint">{f.l}</p>
            </div>
          ))}
        </div>
      </Section>
    </InfoShell>
  );
}
