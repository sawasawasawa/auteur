import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auteur",
  description: "Become a content creator in 90 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain">
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-5 flex items-center justify-between">
            <a href="/" className="display text-2xl">auteur</a>
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Ralphthon SG 2026</div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="px-6 py-4 text-xs text-white/30 flex justify-between">
            <span>Built today. Voice in, short out.</span>
            <span>github.com/sawasawasawa/auteur</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
