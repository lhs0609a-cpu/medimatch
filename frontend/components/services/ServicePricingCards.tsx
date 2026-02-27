'use client';

import { Check, Star } from 'lucide-react';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  priceUnit?: string;
  badge?: string;
  description?: string;
  features: PricingFeature[];
  ctaText: string;
  ctaHref: string;
  highlight?: boolean;
  popularLabel?: string;
}

interface ServicePricingCardsProps {
  headline: string;
  subHeadline?: string;
  tiers: PricingTier[];
  freeLabel?: string;
  bottomNote?: string;
}

export default function ServicePricingCards({
  headline,
  subHeadline,
  tiers,
  freeLabel = "제작비 0원",
  bottomNote,
}: ServicePricingCardsProps) {
  return (
    <section className="py-16 md:py-24 bg-gray-50" id="pricing">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{headline}</h2>
          {subHeadline && (
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subHeadline}</p>
          )}
          {freeLabel && (
            <div className="mt-4 inline-block bg-green-100 text-green-700 font-bold px-6 py-2 rounded-full text-lg">
              {freeLabel}
            </div>
          )}
        </div>

        <div className={`grid gap-6 ${
          tiers.length === 1 ? 'max-w-md mx-auto' :
          tiers.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden ${
                tier.highlight
                  ? 'bg-white ring-2 ring-blue-600 shadow-xl scale-[1.02]'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {tier.popularLabel && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-bold flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  {tier.popularLabel}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  {tier.badge && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {tier.badge}
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                )}

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{tier.priceUnit || '/월'}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`} />
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`block w-full py-3.5 rounded-xl font-bold text-center transition-colors ${
                    tier.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tier.ctaText}
                </a>
              </div>
            </div>
          ))}
        </div>

        {bottomNote && (
          <p className="mt-8 text-center text-sm text-gray-500">{bottomNote}</p>
        )}
      </div>
    </section>
  );
}
