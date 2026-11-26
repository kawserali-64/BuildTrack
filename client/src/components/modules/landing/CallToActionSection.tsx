import Link from 'next/link';
import { ArrowRight, HardHat } from 'lucide-react';

export function CallToActionSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-amber-400/50 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/construction/site-progress.jpg")' }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/60" />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-7 sm:flex-row sm:items-center sm:py-8">
        <HardHat className="h-12 w-12 shrink-0 text-amber-400 sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Keep every construction task moving forward.
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Plan projects, coordinate teams, and track site progress with BuildTrack.
          </p>
        </div>
        <Link
          href="#features"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/30 transition hover:bg-amber-300"
        >
          Explore Features <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
