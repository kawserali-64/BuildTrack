import React from 'react';
import Link from 'next/link';
import { Coins, Hammer, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  variant?: 'workspace' | 'marketing';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'workspace' }) => {
  if (variant === 'marketing') {
    return (
      <footer className="relative overflow-hidden border-t border-amber-400/40 bg-slate-950 text-slate-400">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.45),transparent_65%)]"
        />
        <div className="mx-auto w-full max-w-[1600px] px-3">
          <div className="relative grid gap-9 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1fr_1.25fr] lg:gap-7 lg:py-12">
            <section className="max-w-sm">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/30">
                  <Hammer className="h-5 w-5" />
                </span>
                <span className="text-xl font-black tracking-tight text-white">
                  Build<span className="text-amber-400">Track</span>
                </span>
              </Link>
              <p className="mt-3 text-xs font-bold tracking-wide text-slate-200">
                Build smarter. Build better.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                A modern construction management workspace for teams that build the future.
              </p>
            </section>

            <nav aria-label="Footer navigation">
              <h2 className="text-sm font-bold text-white">Quick Links</h2>
              <ul className="mt-4 space-y-3 text-xs">
                <li>
                  <Link href="/" className="transition hover:text-amber-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="transition hover:text-amber-300">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#roles" className="transition hover:text-amber-300">
                    Project roles
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="transition hover:text-amber-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Project resources">
              <h2 className="text-sm font-bold text-white">Resources</h2>
              <ul className="mt-4 space-y-3 text-xs">
                <li>
                  <Link href="#features" className="transition hover:text-amber-300">
                    Project setup
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="transition hover:text-amber-300">
                    Tasks &amp; deadlines
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="transition hover:text-amber-300">
                    Progress &amp; reports
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="transition hover:text-amber-300">
                    Material requests
                  </Link>
                </li>
              </ul>
            </nav>

            <section id="contact">
              <h2 className="text-sm font-bold text-white">Contact Us</h2>
              <ul className="mt-4 space-y-3 text-xs">
                <li>
                  <a
                    href="tel:+8801712345678"
                    className="inline-flex items-center gap-2 transition hover:text-amber-300"
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-400" />
                    +880 1712 345678
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@buildtrack.com"
                    className="inline-flex items-center gap-2 transition hover:text-amber-300"
                  >
                    <Mail className="h-3.5 w-3.5 text-amber-400" />
                    info@buildtrack.com
                  </a>
                </li>
                <li className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  Sirajganj, Bangladesh
                </li>
              </ul>
            </section>
          </div>

          <div className="relative flex flex-col gap-3 border-t border-white/10 py-4 text-[11px] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} BuildTrack. All rights reserved.</span>
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Currency: BDT (৳)
            </span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200/80 bg-white/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} BuildTrack</span>
        <span>Construction project intelligence, all in one workspace.</span>
      </div>
    </footer>
  );
};
