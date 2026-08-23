import Link from 'next/link';

export const metadata = {
  title: 'FINAL BUILD DEMO — Nexsus.Spec',
  description: 'Official final build demonstration video for Nexsus.Spec universal industrial specification forge.',
};

export default function DemoVideoPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#D71921] selection:text-white font-sans antialiased">
      {/* Subtle Background Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors font-mono"
          >
            <svg className="w-4 h-4 text-[#D71921]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Nexsus.Spec Live App
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D71921] animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-neutral-300 font-mono">
              PUBLIC JUDGES ACCESS · LIVE STREAM
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D71921]/10 border border-[#D71921]/30 text-[#D71921] text-xs font-mono font-bold tracking-widest uppercase">
            <span>🔴 OFFICIAL SUBMISSION</span>
            <span>·</span>
            <span>FINAL BUILD DEMO</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
            FINAL BUILD DEMO
          </h1>
          <p className="text-neutral-400 max-w-3xl text-sm sm:text-base leading-relaxed">
            Broadcast-quality AI-narrated walkthrough of Team Nexsus&apos;s universal product specification forge. Demonstrating raw PDF/URL ingestion, 3D isometric pipeline streaming, 100% uptime AI failover architecture, compare matrix, and multi-format exports.
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 p-2 sm:p-4 shadow-2xl shadow-red-950/20 mb-8 group">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-900">
            <video
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="auto"
              poster="/icon.svg"
            >
              <source src="/final-build-demo.mp4" type="video/mp4" />
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support HTML5 video playback.
            </video>
          </div>
        </div>

        {/* Video Details & Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D71921] flex items-center gap-2 font-mono">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              FINAL BUILD DEMO // CHAPTER TIMELINE
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#D71921] font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  0:00 - 0:15
                </span>
                <span>
                  <strong>Cinematic RoomIntro:</strong> Welcome from Team Nexsus & project overview.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#D71921] font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  0:15 - 0:45
                </span>
                <span>
                  <strong>Hero Studio & 3D Stage:</strong> Multi-input ingest (PDF/URL/Text) & real-time 3D isometric NDJSON streaming.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#D71921] font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  0:45 - 1:25
                </span>
                <span>
                  <strong>Spec Dashboard:</strong> Canonical attribute cards (`Input voltage — 230V AC`), brand filter chips, & multi-vector search.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#D71921] font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  1:25 - 1:45
                </span>
                <span>
                  <strong>Compare Matrix & Audit:</strong> Side-by-side product spec comparison & raw extraction audit trail.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#D71921] font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  1:45 - 3:20
                </span>
                <span>
                  <strong>Export Suite & PDF Datasheet:</strong> Single-click PDF datasheet generation, XLSX, CSV, JSON, & Markdown exports.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D71921] flex items-center gap-2 font-mono">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                PUBLIC ACCESSIBLE LINKS
              </h3>
              <p className="text-xs text-neutral-400">
                These links are public and can be opened in any browser by anyone.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href="/final-build-demo.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D71921] hover:bg-[#b0141b] text-xs font-semibold text-white transition-colors shadow-lg shadow-red-950/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Direct Video Stream Link
              </a>

              <a
                href="/final-build-demo.mp4"
                download
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold border border-neutral-800 transition-colors"
              >
                <svg className="w-4 h-4 text-[#D71921]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP4 Video
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-neutral-900 text-center text-xs text-neutral-500 font-mono">
          NEXSUS.SPEC — FINAL BUILD DEMO · TEAM NEXSUS
        </div>
      </div>
    </main>
  );
}
