import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mohamadawad.vercel.app"),
  title: {
    default: "Mohamad Awad — Civil Engineering & AI at TMU",
    template: "%s — Mohamad Awad",
  },
  description:
    "Second-year civil engineering student at Toronto Metropolitan University, building AI and automation tools for infrastructure inspection.",
  openGraph: {
    title: "Mohamad Awad — Civil Engineering & AI at TMU",
    description:
      "Second-year civil engineering student at Toronto Metropolitan University, building AI and automation tools for infrastructure inspection.",
    type: "website",
    locale: "en_CA",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <header className="border-b border-border/40 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-sm"
          >
            <Link
              href="/"
              className="font-[family-name:var(--font-fraunces)] text-base tracking-tight"
            >
              Mohamad Awad
            </Link>
            <ul className="flex items-center gap-6 text-muted-foreground">
              <li>
                <Link
                  href="/#about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/projects/pavescan-ai"
                  className="hover:text-foreground transition-colors"
                >
                  PaveScan
                </Link>
              </li>
              <li>
                <Link
                  href="/projects/pop-up-chapel"
                  className="hover:text-foreground transition-colors"
                >
                  Pop-Up Chapel
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border/40 mt-24">
          <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
            <span>© {new Date().getFullYear()} Mohamad Awad</span>
            <span>Built with Next.js, Tailwind, shadcn/ui</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
