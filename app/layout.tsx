import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spacemono",
});

export const metadata: Metadata = {
  title: "Nexsus.Spec — Raw notes in. Sharp specs out.",
  description:
    "Nexsus.Spec turns spec sheets, datasheets and catalogs into an organized product dashboard: attribute-level specs, key features, use cases — searchable, filterable, exportable.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`min-h-screen font-sans ${grotesk.variable} ${spaceMono.variable}`}
      >
        {/* Browser extensions (e.g. Urban VPN) crash into the page context and
            pollute the dev overlay with errors the app cannot fix. Swallow any
            uncaught error whose stack/filename originates from chrome-extension://
            so only real app errors are surfaced. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('error',function(e){var s='';" +
              "try{s=(e.error&&e.error.stack)||e.filename||''}catch(_){}" +
              "if(String(s).indexOf('chrome-extension://')!==-1){" +
              "e.preventDefault();e.stopImmediatePropagation();}},true);",
          }}
        />
        {children}
      </body>
    </html>
  );
}
