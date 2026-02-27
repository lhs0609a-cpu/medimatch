'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

interface ServiceStickyHeaderProps {
  title: string;
  navItems: NavItem[];
  ctaText: string;
  ctaHref: string;
  homeHref?: string;
}

export default function ServiceStickyHeader({
  title,
  navItems,
  ctaText,
  ctaHref,
  homeHref = '/',
}: ServiceStickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={homeHref} className={`font-bold text-lg ${scrolled ? 'text-gray-900' : 'text-white'}`}>
          {title}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={ctaHref}
            className="bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {ctaText}
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden ${scrolled ? 'text-gray-700' : 'text-white'}`}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-gray-700 py-2"
              >
                {item.label}
              </a>
            ))}
            <a
              href={ctaHref}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center bg-blue-600 text-white text-sm font-bold py-3 rounded-lg"
            >
              {ctaText}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
