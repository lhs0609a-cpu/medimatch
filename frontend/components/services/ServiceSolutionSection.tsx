'use client';

import type { LucideIcon } from 'lucide-react';

interface SolutionItem {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights?: string[];
}

interface ServiceSolutionSectionProps {
  badge?: string;
  headline: string;
  subHeadline?: string;
  solutions: SolutionItem[];
}

export default function ServiceSolutionSection({
  badge,
  headline,
  subHeadline,
  solutions,
}: ServiceSolutionSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          {badge && (
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              {badge}
            </span>
          )}
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            {headline}
          </h2>
          {subHeadline && (
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subHeadline}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{item.description}</p>
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-blue-700">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
