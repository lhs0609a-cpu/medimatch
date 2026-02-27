'use client';

import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  result?: string;
  rating?: number;
}

interface ServiceTestimonialsProps {
  headline: string;
  subHeadline?: string;
  testimonials: Testimonial[];
}

export default function ServiceTestimonials({
  headline,
  subHeadline,
  testimonials,
}: ServiceTestimonialsProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{headline}</h2>
          {subHeadline && (
            <p className="mt-3 text-lg text-gray-600">{subHeadline}</p>
          )}
        </div>

        <div className={`grid gap-6 ${
          testimonials.length === 1 ? 'max-w-lg mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-blue-200 mb-3" />

              {/* Rating */}
              {t.rating && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              )}

              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                &ldquo;{t.content}&rdquo;
              </p>

              {t.result && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 mb-4">
                  <p className="text-xs text-blue-700 font-medium">{t.result}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3">
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
