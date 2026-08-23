import type { Metadata } from "next";

import InfoShell, { Section } from "@/components/InfoShell";

export const metadata: Metadata = {
  title: "Terms & Conditions — Nexsus.Spec",
  description:
    "The rules of the road for using Nexsus.Spec: acceptable use, ownership, and the honest disclaimers of a demo product.",
};

export default function TermsPage() {
  return (
    <InfoShell
      kicker="04 — rules of the road"
      title="terms & conditions"
      blurb="Short, readable, and free of traps. By using Nexsus.Spec you agree to what's below."
    >
      <Section index="01" title="the service">
        <p>
          Nexsus.Spec reads documents you provide and organizes their product
          information into structured pages. It is provided{" "}
          <span className="text-black">as is</span>, currently as a demo build
          by Team Nexsus. Features may change, break while we improve them, or
          disappear — extraction results are best-effort, not certified data.
        </p>
      </Section>

      <Section index="02" title="acceptable use">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-fog-faint">
          <li>Only upload documents you have the right to process.</li>
          <li>Don&apos;t use the service to break the law or anyone&apos;s rights.</li>
          <li>
            Don&apos;t hammer the site with automated bulk traffic — it runs on
            free AI tiers and shared infrastructure.
          </li>
          <li>Don&apos;t attempt to breach, scrape or disrupt other users&apos; data.</li>
        </ul>
      </Section>

      <Section index="03" title="your content, your ownership">
        <p>
          You keep every right to the documents you upload and the extractions
          generated from them. We claim no license over your content beyond
          what&apos;s technically needed to process it during a session and
          store it when you explicitly press “Save to library”.
        </p>
      </Section>

      <Section index="04" title="disclaimers & liability">
        <p>
          No warranty: we don&apos;t guarantee uninterrupted availability,
          error-free extractions, or fitness for a particular purpose. Always
          double-check critical specs against the source document before they
          go into production, safety-critical or contractual contexts.
        </p>
        <p>
          To the maximum extent permitted by law, Team Nexsus is not liable
          for indirect or consequential damages arising from use of the
          service. If something breaks, tell us and we&apos;ll fix it.
        </p>
      </Section>

      <Section index="05" title="changes">
        <p>
          These terms may be updated as the demo matures into a real product.
          Continued use after changes means acceptance. The current version
          always lives on this page.
        </p>
      </Section>
    </InfoShell>
  );
}
