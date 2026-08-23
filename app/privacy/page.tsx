import type { Metadata } from "next";

import InfoShell, { Section } from "@/components/InfoShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Nexsus.Spec",
  description:
    "What Nexsus.Spec processes, why, and what it never does with your data. Plain language, no dark patterns.",
};

const NEVER = [
  "we do not sell your documents or your data",
  "we do not run ads or third-party trackers on this site",
  "we do not train AI models on your extractions",
  "we do not keep a document after you delete it from the library",
];

export default function PrivacyPage() {
  return (
    <InfoShell
      kicker="03 — your data"
      title="privacy policy"
      blurb="The short version: your documents belong to you. Here is exactly what touches them and why."
    >
      <Section index="01" title="what we process">
        <p>
          <span className="text-white">Documents you upload</span> — PDFs,
          text files and pasted text are read to extract product information.
          Extraction runs through our AI providers (Groq, Google Gemini,
          OpenRouter); whichever answers first does the reading, then the raw
          document is discarded from the working session.
        </p>
        <p>
          <span className="text-white">Your account</span> — if you sign in
          with Google, we store your name, email and profile picture solely to
          attach saved extractions to you. We never post, email or contact
          anyone on your behalf.
        </p>
        <p>
          <span className="text-white">Saved extractions</span> — pressing
          “Save to library” stores the organized result (not the original
          document) in our database so you can revisit or share it via a link.
          Deleting an entry removes it permanently.
        </p>
      </Section>

      <Section index="02" title="what stays on your device">
        <p>
          Your sign-in session lives in a cookie on your device. A one-per-tab
          intro flag lives in sessionStorage so the cinematic opening plays
          once, not every click. Neither is used for advertising or profiling.
        </p>
      </Section>

      <Section index="03" title="what we never do">
        <ul className="space-y-1.5">
          {NEVER.map((n) => (
            <li key={n} className="flex gap-2.5">
              <span className="text-accent">×</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="04" title="the honest fine print">
        <p>
          Nexsus.Spec is currently a demo build by Team Nexsus. Policies may
          evolve as the product ships for real; meaningful changes will be
          reflected here before they take effect. Questions? Use the{" "}
          <a href="/contact" className="text-white underline decoration-line-strong underline-offset-4 hover:decoration-white">
            contact page
          </a>
          .
        </p>
      </Section>
    </InfoShell>
  );
}
