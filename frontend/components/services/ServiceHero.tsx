'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
}

interface ServiceHeroProps {
  badge?: string;
  headline: string;
  subHeadline: string;
  description?: string;
  stats: StatItem[];
  ctaText: string;
  ctaHref: string;
  secondaryCta?: { text: string; href: string };
}

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const num = parseInt(target.replace(/[^0-9]/g, ''), 10);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1500;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * num));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-white">
      {count}{suffix}
    </div>
  );
}

export default function ServiceHero({
  badge,
  headline,
  subHeadline,
  description,
  stats,
  ctaText,
  ctaHref,
  secondaryCta,
}: ServiceHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
        {badge && (
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            {badge}
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-4xl">
          {headline}
        </h1>

        <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-3xl leading-relaxed">
          {subHeadline}
        </p>

        {description && (
          <p className="mt-3 text-base text-blue-200 max-w-2xl">
            {description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-lg"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </a>
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg"
            >
              {secondaryCta.text}
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => {
            const numMatch = stat.value.match(/^(\d+)/);
            const suffix = stat.value.replace(/^\d+/, '');
            return (
              <div key={idx} className="text-center">
                {numMatch ? (
                  <AnimatedCounter target={numMatch[1]} suffix={suffix} />
                ) : (
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                )}
                <div className="mt-1 text-sm text-blue-200">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
