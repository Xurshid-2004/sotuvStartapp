"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type Slide = {
  id: number;
  title: string;
  subtitle?: string;
  price?: string;
  image: string;
  tone?: string; // gradient classes
};

function fmtPrice(p?: string) {
  if (!p) return "";
  return Math.round(Number(p)).toLocaleString("ru-RU");
}

const TONES = [
  "from-violet-900 via-violet-700 to-violet-600",
  "from-fuchsia-900 via-purple-700 to-violet-600",
  "from-indigo-900 via-violet-800 to-purple-600",
  "from-violet-800 via-purple-700 to-fuchsia-600",
];

export default function Carousel({
  slides,
  onSlideClick,
  interval = 4000,
}: {
  slides: Slide[];
  onSlideClick?: (id: number) => void;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);
  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + n) % n), [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), interval);
    return () => clearInterval(t);
  }, [paused, n, interval]);

  if (n === 0) return null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-8 fade-up select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 50) prev();
        else if (dx < -50) next();
        touchX.current = null;
      }}
    >
      {/* Slaydlar */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSlideClick?.(s.id)}
            className={`relative w-full shrink-0 text-left bg-gradient-to-r ${s.tone || TONES[i % TONES.length]} h-48 sm:h-64`}
          >
            <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 max-w-[60%]">
              <p className="text-electric font-bold text-[11px] sm:text-sm uppercase tracking-wider mb-1">Tavsiya etamiz</p>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight line-clamp-2">{s.title}</h2>
              {s.subtitle && <p className="text-violet-200 text-xs sm:text-sm mt-1">{s.subtitle}</p>}
              {s.price && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-electric text-violet-900 font-black text-lg sm:text-2xl px-3 py-1 rounded-xl w-fit">
                  {fmtPrice(s.price)} <span className="text-xs sm:text-sm">so&apos;m</span>
                </div>
              )}
            </div>
            {/* Rasm */}
            <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt={s.title}
                className="h-[78%] w-[78%] object-cover rounded-2xl shadow-2xl rotate-3"
              />
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          </button>
        ))}
      </div>

      {/* O'q tugmalar */}
      {n > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Oldingi"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur text-white flex items-center justify-center transition active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={next}
            aria-label="Keyingi"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur text-white flex items-center justify-center transition active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}

      {/* Nuqtalar */}
      {n > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`${i + 1}-slayd`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
