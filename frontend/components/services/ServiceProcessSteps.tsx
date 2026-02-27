'use client';

import type { LucideIcon } from 'lucide-react';

interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
  duration?: string;
}

interface ServiceProcessStepsProps {
  headline: string;
  subHeadline?: string;
  steps: ProcessStep[];
}

export default function ServiceProcessSteps({
  headline,
  subHeadline,
  steps,
}: ServiceProcessStepsProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{headline}</h2>
          {subHeadline && (
            <p className="mt-3 text-lg text-gray-600">{subHeadline}</p>
          )}
        </div>

        <div className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-blue-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative text-center">
                  {/* Step number + icon */}
                  <div className="relative inline-flex flex-col items-center">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 z-10">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-800 text-white text-xs font-bold rounded-full flex items-center justify-center z-20">
                      {idx + 1}
                    </span>
                  </div>

                  <h3 className="mt-4 font-bold text-gray-900">{step.title}</h3>
                  {step.duration && (
                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {step.duration}
                    </span>
                  )}
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.description}</p>

                  {/* Mobile connector */}
                  {idx < steps.length - 1 && (
                    <div className="md:hidden flex justify-center my-4">
                      <div className="w-0.5 h-8 bg-blue-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
