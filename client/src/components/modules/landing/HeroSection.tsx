'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  HardHat,
  Package,
} from 'lucide-react';

const slides = [
  {
    src: '/images/construction/construction-team.jpg',
    alt: 'Construction team coordinating work at an active building site',
    label: 'One team. One project view.',
  },
  {
    src: '/images/construction/site-progress.jpg',
    alt: 'Contractors working with steel reinforcement on a construction site',
    label: 'Track site work as it happens.',
  },
  {
    src: '/images/construction/building-plan.jpg',
    alt: 'Building professional reviewing architectural construction drawings',
    label: 'Plan clearly. Build confidently.',
  },
];

const workflowHighlights = [
  { icon: ClipboardCheck, label: 'Assigned tasks & progress' },
  { icon: CalendarDays, label: 'Deadlines & reports' },
  { icon: Package, label: 'Material requests' },
];

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  function showPreviousSlide() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section
      className="relative isolate flex min-h-[560px] flex-col overflow-hidden bg-slate-950 text-white sm:min-h-[600px] lg:min-h-[640px]"
      aria-roledescription="carousel"
      aria-label="Construction project photos"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          role="img"
          aria-label={slide.alt}
          aria-hidden={index !== activeSlide}
          className={`absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-1000 ${
            index === activeSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url("${slide.src}")` }}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/15" />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-center px-3 py-8 sm:py-10 lg:py-12">
        <div className="w-full max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-amber-200 shadow-sm backdrop-blur-md">
            <HardHat className="h-4 w-4" />
            Construction project workspace
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl">
              Plan the build.
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Track every task.
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
              BuildTrack brings Project Managers and Contractors together to organize projects,
              assign work, follow deadlines, report progress, and review material requests.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/30 transition hover:bg-amber-300"
            >
              Explore the workflow <ArrowDown className="h-4 w-4" />
            </Link>
            <Link
              href="#roles"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-slate-950/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              See team responsibilities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid max-w-2xl gap-3 border-t border-white/20 pt-5 sm:grid-cols-3">
            {workflowHighlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-950/40 text-amber-300 backdrop-blur-sm">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 border-t border-white/20 px-3 py-4 sm:py-5">
        <div className="max-w-[65%]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
            BuildTrack on site
          </p>
          <p className="mt-1 text-sm font-bold text-white sm:text-base" aria-live="polite">
            {slides[activeSlide].label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden gap-1.5 sm:flex">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={index === activeSlide}
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-8 bg-amber-400' : 'w-3 bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous construction photo"
            onClick={showPreviousSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-slate-950/40 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next construction photo"
            onClick={showNextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-slate-950/40 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
