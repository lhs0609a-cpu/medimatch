'use client';

import { AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProblemItem {
  icon: LucideIcon;
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
}

interface ServiceProblemSectionProps {
  badge?: string;
  headline: string;
  subHeadline?: string;
  problems: ProblemItem[];
  bottomCallout?: {
    amount: string;
    label: string;
    description: string;
  };
}

export default function ServiceProblemSection({
  badge,
  headline,
  subHeadline,
  problems,
  bottomCallout,
}: ServiceProblemSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          {badge && (
            <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
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
          {problems.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{problem.title}</h3>
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">{problem.description}</p>
                    {problem.stat && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">{problem.stat}</span>
                        {problem.statLabel && (
                          <span className="text-sm text-gray-500">{problem.statLabel}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {bottomCallout && (
          <div className="mt-10 bg-red-50 border border-red-100 rounded-2xl p-6 md:p-8 text-center">
            <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
              {bottomCallout.amount}
            </div>
            <div className="text-lg font-semibold text-gray-900">{bottomCallout.label}</div>
            <p className="mt-2 text-gray-600">{bottomCallout.description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
