'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronDown, Search, Zap, Plane, Clock, DollarSign, Shield, ExternalLink, ArrowRight } from 'lucide-react';
import { C, AIRLINE_STYLE, WING_RATINGS, WING_COLORS } from '../../data/constants';

/* ─── Theme ─── */
const T = (dark: boolean) => ({
  bg: dark ? '#0E0E0E' : '#F7F4ED',
  bgAlt: dark ? '#161616' : '#FFFFFF',
  card: dark ? '#1A1A1A' : '#FFFFFF',
  cardBorder: dark ? '#2A2A2A' : '#E8E5DC',
  text: dark ? '#F0EBD8' : '#1A1A1A',
  textSec: dark ? '#A0A096' : '#5A5A52',
  textMuted: dark ? '#6B6B63' : '#9B9B93',
  accent: dark ? '#E8576D' : '#0A3D2E',
  accentBg: dark ? 'rgba(232,87,109,0.1)' : 'rgba(10,61,46,0.06)',
});

/* ─── Scroll-triggered reveal hook (fixaplan-style) ─── */
const useReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

/* ─── Staggered fade-up style (like fixaplan's spring animations) ─── */
const fadeUp = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(40px)',
  transition: `opacity 0.8s cubic-bezier(0.12, 0.23, 0.5, 1) ${delay}s, transform 0.8s cubic-bezier(0.12, 0.23, 0.5, 1) ${delay}s`,
});

/* ─── Accordion FAQ component ─── */
const FAQ = ({ question, answer, dark }: { question: string; answer: string; dark: boolean }) => {
  const [open, setOpen] = useState(false);
  const t = T(dark);
  return (
    <div style={{
      borderBottom: `1px solid ${t.cardBorder}`,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '17px', fontWeight: 700, color: t.text, flex: 1, paddingRight: '16px', lineHeight: 1.4 }}>{question}</span>
        <ChevronDown style={{
          width: '20px', height: '20px', color: t.textMuted, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.35s cubic-bezier(0.12, 0.23, 0.5, 1)',
        }} />
      </button>
      <div style={{
        maxHeight: open ? '300px' : '0',
        opacity: open ? 1 : 0,
        transition: 'max-height 0.45s cubic-bezier(0.12, 0.23, 0.5, 1), opacity 0.35s ease',
        overflow: 'hidden',
      }}>
        <p style={{ fontSize: '15px', color: t.textSec, lineHeight: 1.7, margin: '0 0 24px', paddingRight: '40px' }}>{answer}</p>
      </div>
    </div>
  );
};

/* ─── Wing Icon ─── */
const WingIcon = ({ size = 14, color = '#0A3D2E' }: { size?: number; color?: string }) => (
  <svg width={size} height={Math.round(size * 0.8)} viewBox="0 0 24 19" fill={color}>
    <path d="M2 17C5 11 10 6 16 4c2.5-0.8 4.5-0.5 6 1s1.5 4-0.5 7c-3 4-8 5.5-12 5C6.5 16.5 4 15 2 17z" />
  </svg>
);

/* ─── Interactive Pricing Comparison ─── */
const ROUTES = [
  { label: 'LA to Vegas',       semi: 215,  first: 580,  airline: 'JSX' },
  { label: 'NY to Miami',       semi: 495,  first: 750,  airline: 'JSX' },
  { label: 'Dallas to Houston', semi: 99,   first: 420,  airline: 'JSX' },
  { label: 'NY to Nantucket',   semi: 395,  first: 680,  airline: 'Tradewind' },
  { label: 'LA to Cabo',        semi: 349,  first: 890,  airline: 'JSX' },
];

const PricingComparison = ({ dark, pricingRef, pricingReveal }: {
  dark: boolean;
  pricingRef: React.RefObject<HTMLDivElement | null>;
  pricingReveal: { ref: React.RefObject<HTMLDivElement | null>; visible: boolean };
}) => {
  const t = T(dark);
  const [activeRoute, setActiveRoute] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const route = ROUTES[activeRoute];
  const savings = Math.round((1 - route.semi / route.first) * 100);
  const maxPrice = 1000;

  const switchRoute = (i: number) => {
    setActiveRoute(i);
    setAnimKey(k => k + 1);
  };

  return (
    <div ref={(el) => {
      // Assign both refs
      (pricingReveal.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      (pricingRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }} id="pricing" style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: t.accent, letterSpacing: '0.1em', margin: '0 0 20px', ...fadeUp(pricingReveal.visible, 0) }}>THE PRICE MIGHT SURPRISE YOU</p>
        <h2 style={{ fontSize: '48px', fontWeight: 900, color: t.text, margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1, ...fadeUp(pricingReveal.visible, 0.08) }}>
          From <span style={{ color: dark ? C.pink : C.darkGreen }}>$99</span>/seat
        </h2>
        <p style={{ fontSize: '17px', color: t.textSec, margin: '12px 0 36px', lineHeight: 1.6, ...fadeUp(pricingReveal.visible, 0.15) }}>
          Pick a route and see how semi-private stacks up against first class.
        </p>

        {/* Route selector pills */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px', ...fadeUp(pricingReveal.visible, 0.2) }}>
          {ROUTES.map((r, i) => (
            <button key={i} onClick={() => switchRoute(i)} style={{
              padding: '8px 18px', borderRadius: '20px', border: `1.5px solid ${activeRoute === i ? C.pink : t.cardBorder}`,
              backgroundColor: activeRoute === i ? C.pink : 'transparent',
              color: activeRoute === i ? '#fff' : t.textSec,
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Animated bar chart comparison */}
        <div key={animKey} style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'left', ...fadeUp(pricingReveal.visible, 0.25) }}>
          {/* Semi-private bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: C.pink }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>Semi-Private ({route.airline})</span>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: C.pink, letterSpacing: '-0.02em' }}>${route.semi}</span>
            </div>
            <div style={{ height: '40px', borderRadius: '12px', backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: '12px',
                background: `linear-gradient(90deg, ${C.pink}, ${C.pink}cc)`,
                width: `${(route.semi / maxPrice) * 100}%`,
                animation: 'barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }} />
              <div style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.04em',
              }}>
                PRIVATE TERMINAL &bull; NO TSA &bull; FREE FOOD
              </div>
            </div>
          </div>

          {/* First class bar */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: t.textMuted }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: t.textSec }}>Domestic First Class</span>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: t.textSec, letterSpacing: '-0.02em' }}>${route.first}</span>
            </div>
            <div style={{ height: '40px', borderRadius: '12px', backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: '12px',
                backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                width: `${(route.first / maxPrice) * 100}%`,
                animation: 'barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
                opacity: 0,
              }} />
              <div style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.04em',
              }}>
                TSA LINES &bull; CROWDED GATE &bull; AIRLINE SNACKS
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '16px 24px', borderRadius: '14px',
            background: dark
              ? `linear-gradient(135deg, rgba(232,87,109,0.12) 0%, rgba(245,240,225,0.03) 100%)`
              : `linear-gradient(135deg, rgba(232,87,109,0.08) 0%, rgba(10,61,46,0.04) 100%)`,
            border: `1px solid rgba(232,87,109,${dark ? '0.2' : '0.15'})`,
            animation: 'fadeIn 0.6s ease 0.5s forwards',
            opacity: 0,
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: C.pink,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>
              {savings}%
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: t.text }}>
                Save ${route.first - route.semi} on {route.label}
              </div>
              <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>
                Plus private terminals, no TSA, leather seats, and complimentary food and drinks
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: t.textMuted, margin: '28px 0 0', lineHeight: 1.5, fontStyle: 'italic', ...fadeUp(pricingReveal.visible, 0.3) }}>
          Prices are estimates based on published rates. Always confirm on the airline&apos;s website.
        </p>

        {/* CSS keyframes for bar animation */}
        <style>{`
          @keyframes barGrow {
            from { width: 0; opacity: 1; }
            to { opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default function AboutPage() {
  const [dark, setDark] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stored = new URLSearchParams(window.location.search).get('theme');
    if (stored === 'dark') setDark(true);
    // Auto-scroll to pricing section if hash is #pricing
    if (window.location.hash === '#pricing') {
      setTimeout(() => {
        pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, []);

  const t = T(dark);

  // Section reveals
  const heroReveal = useReveal(0.1);
  const missionReveal = useReveal(0.15);
  const howReveal = useReveal(0.1);
  const whyReveal = useReveal(0.1);
  const pricingReveal = useReveal(0.1);
  const airlinesReveal = useReveal(0.1);
  const statusReveal = useReveal(0.15);
  const faqReveal = useReveal(0.1);
  const ctaReveal = useReveal(0.2);

  const faqs = [
    {
      q: 'What is Aviato?',
      a: 'A search engine for semi-private flights. We pull in flights from JSX, Aero, Tradewind, Slate, and BARK Air so you can compare everything in one place.',
    },
    {
      q: 'Is it free?',
      a: 'Completely free. We link you to the airline to book. Same price as going direct.',
    },
    {
      q: 'Do I book through Aviato?',
      a: 'Nope. We link you straight to the airline\'s booking page. We never handle your payment info.',
    },
    {
      q: 'What is semi-private flying?',
      a: 'Small jets (16–30 seats), private terminals, no TSA, 15-minute check-in, leather seats, free food and drinks. Starting at $99/seat.',
    },
    {
      q: 'Is it really cheaper than first class?',
      a: 'On many routes, yes. Most semi-private fares are $200 to $600 vs. $500 to $900 for domestic first class, with a much better experience.',
    },
    {
      q: 'Are the prices accurate?',
      a: 'We update regularly, but prices are estimates. Always confirm on the airline\'s site before booking.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg, transition: 'background-color 0.5s ease' }}>

      {/* ─── Top bar ─── */}
      <div style={{ background: dark ? '#000' : C.black, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/desktop" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.white, textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
          <ChevronLeft style={{ width: '18px', height: '18px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
            <div style={{ width: '12px', height: '5px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
            <div style={{ width: '12px', height: '5px', backgroundColor: C.pink, borderRadius: '1px' }} />
            <div style={{ width: '12px', height: '5px', backgroundColor: C.cream, borderRadius: '1px' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 900 }}>Aviato</span>
        </a>
      </div>

      {/* ─── Hero statement (fixaplan-style centered text) ─── */}
      <div ref={heroReveal.ref} style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 48px 80px', textAlign: 'center' }}>
        <div style={{ ...fadeUp(heroReveal.visible, 0) }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ width: '24px', height: '10px', backgroundColor: C.darkGreen, borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '10px', backgroundColor: C.pink, borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '10px', backgroundColor: C.cream, borderRadius: '2px' }} />
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: t.text, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em', ...fadeUp(heroReveal.visible, 0.1) }}>
          Rediscover what flying is all about
        </h1>
        <p style={{ fontSize: '19px', color: t.textSec, margin: '0 0 36px', lineHeight: 1.6, ...fadeUp(heroReveal.visible, 0.2) }}>
          Search semi-private flights across multiple airlines. Compare prices, times, and amenities, then book direct.
        </p>
        <a href="/desktop" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '12px',
          backgroundColor: dark ? C.pink : C.black, color: C.cream, fontSize: '15px', fontWeight: 700, textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          ...fadeUp(heroReveal.visible, 0.3),
        }}>
          Search Flights <ArrowRight style={{ width: '16px', height: '16px' }} />
        </a>
      </div>

      {/* ─── The Story ─── */}
      <div ref={missionReveal.ref} style={{ maxWidth: '700px', margin: '0 auto', padding: '0 48px 80px', textAlign: 'center' }}>
        <p style={{ fontSize: '28px', fontWeight: 800, color: t.text, lineHeight: 1.4, letterSpacing: '-0.01em', ...fadeUp(missionReveal.visible, 0) }}>
          Why does this exist?
        </p>
        <div style={{ fontSize: '16px', color: t.textSec, lineHeight: 1.8, ...fadeUp(missionReveal.visible, 0.12) }}>
          <p style={{ margin: '16px 0' }}>
            I built Aviato after discovering semi-private aviation and realizing every airline had its own site, its own routes, its own booking system. Finding the best option meant opening a bunch of tabs and comparing everything manually.
          </p>
          <p style={{ margin: '16px 0' }}>
            That was annoying. So I built the thing I wished existed. One search, multiple carriers, book direct.
          </p>
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <div ref={howReveal.ref} style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(howReveal.visible, 0) }}>How Aviato Works</h2>
          <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 48px', textAlign: 'center', ...fadeUp(howReveal.visible, 0.08) }}>Three steps to your next flight</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {[
              { icon: <Search style={{ width: '26px', height: '26px' }} />, title: 'Search', desc: 'Enter your route and dates. We search every semi-private carrier at once.' },
              { icon: <Zap style={{ width: '26px', height: '26px' }} />, title: 'Compare', desc: 'See flights side by side. Prices, times, aircraft, and our wing ratings.' },
              { icon: <Plane style={{ width: '26px', height: '26px' }} />, title: 'Book Direct', desc: 'Click through to the airline\'s booking page. No middleman, no markup.' },
            ].map((step, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '36px 28px', borderRadius: '18px', backgroundColor: t.card, border: `1px solid ${t.cardBorder}`,
                ...fadeUp(howReveal.visible, 0.15 + i * 0.1),
              }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: t.accent }}>{step.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: t.accent, marginBottom: '8px', letterSpacing: '0.08em' }}>STEP {i + 1}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: t.textMuted, margin: 0, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Why Semi-Private ─── */}
      <div ref={whyReveal.ref} style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(whyReveal.visible, 0) }}>Why Fly Semi-Private?</h2>
        <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 48px', textAlign: 'center', ...fadeUp(whyReveal.visible, 0.08) }}>The best-kept secret in aviation</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: <Clock style={{ width: '24px', height: '24px' }} />, title: 'Skip the Terminal', desc: 'Arrive 15 minutes before departure. No TSA, no crowded gates. Just show up and fly.' },
            { icon: <DollarSign style={{ width: '24px', height: '24px' }} />, title: 'Affordable Luxury', desc: 'From $99/seat. Private jet experience at a fraction of charter costs.' },
            { icon: <Shield style={{ width: '24px', height: '24px' }} />, title: 'Premium Experience', desc: 'Leather seats, free drinks and snacks, 16–30 seat planes. Flying how it should be.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '32px 28px', borderRadius: '18px', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card,
              ...fadeUp(whyReveal.visible, 0.15 + i * 0.1),
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', color: t.accent }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text, margin: '0 0 10px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: t.textMuted, margin: 0, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Pricing Comparison (Interactive) ─── */}
      <PricingComparison dark={dark} pricingRef={pricingRef} pricingReveal={pricingReveal} />

      {/* ─── Airlines We Track ─── */}
      <div ref={airlinesReveal.ref} style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(airlinesReveal.visible, 0) }}>Airlines We Track</h2>
          <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 48px', textAlign: 'center', ...fadeUp(airlinesReveal.visible, 0.08) }}>Every major semi-private carrier, one search</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
            {[
              { name: 'JSX', desc: 'West Coast, Texas, Florida', style: AIRLINE_STYLE['JSX'] },
              { name: 'Aero', desc: 'LA, Aspen, Sun Valley, Cabo', style: AIRLINE_STYLE['Aero'] },
              { name: 'Tradewind', desc: 'Northeast & Bahamas', style: AIRLINE_STYLE['Tradewind'] },
              { name: 'Slate', desc: 'NY, FL, Nantucket', style: AIRLINE_STYLE['Slate'] },
              { name: 'BARK Air', desc: 'Dog-friendly luxury', style: AIRLINE_STYLE['BARK Air'] },
            ].map((airline, i) => {
              const rating = WING_RATINGS[airline.name];
              const wingColor = rating ? WING_COLORS[rating.wings] : t.textMuted;
              return (
                <div key={i} style={{
                  textAlign: 'center', padding: '32px 16px', borderRadius: '16px', backgroundColor: t.card, border: `1px solid ${t.cardBorder}`,
                  ...fadeUp(airlinesReveal.visible, 0.12 + i * 0.07),
                }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: airline.style?.bg || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: airline.style?.text || '#fff', fontSize: '13px', fontWeight: 900 }}>{airline.style?.label || '?'}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: t.text, margin: '0 0 4px' }}>{airline.name}</h3>
                  {rating && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                      {Array.from({ length: rating.wings }).map((_, j) => <WingIcon key={j} size={12} color={wingColor} />)}
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: t.textMuted, margin: 0 }}>{airline.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Where We're At ─── */}
      <div ref={statusReveal.ref} style={{ maxWidth: '700px', margin: '0 auto', padding: '72px 48px 0' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 20px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(statusReveal.visible, 0) }}>Where We&apos;re At</h2>
        <div style={{ fontSize: '16px', color: t.textSec, lineHeight: 1.8, textAlign: 'center', ...fadeUp(statusReveal.visible, 0.1) }}>
          <p style={{ margin: '0 0 16px' }}>
            We&apos;re young and growing fast. Right now we cover the most popular routes and we&apos;re adding more every day. If your dream flight isn&apos;t here yet, it&apos;s coming.
          </p>
          <p style={{ margin: '0 0 0', fontWeight: 600, color: t.text }}>
            Semi-private airline? We&apos;d love to feature you. <a href="mailto:aviatoair@gmail.com" style={{ color: t.accent, textDecoration: 'underline' }}>Drop us a line.</a>
          </p>
        </div>
      </div>

      {/* ─── FAQ (fixaplan-style accordion) ─── */}
      <div ref={faqReveal.ref} style={{ maxWidth: '700px', margin: '0 auto', padding: '72px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(faqReveal.visible, 0) }}>FAQ</h2>
        <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 40px', textAlign: 'center', ...fadeUp(faqReveal.visible, 0.08) }}>
          Questions? <a href="mailto:aviatoair@gmail.com" style={{ color: t.accent, textDecoration: 'underline' }}>Reach out</a> anytime.
        </p>
        <div style={{ ...fadeUp(faqReveal.visible, 0.15), borderTop: `1px solid ${t.cardBorder}` }}>
          {faqs.map((faq, i) => (
            <FAQ key={i} question={faq.q} answer={faq.a} dark={dark} />
          ))}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div ref={ctaReveal.ref} style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}` }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '72px 48px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: t.text, margin: '0 0 12px', letterSpacing: '-0.02em', ...fadeUp(ctaReveal.visible, 0) }}>Ready to fly different?</h2>
          <p style={{ fontSize: '15px', color: t.textSec, margin: '0 0 28px', lineHeight: 1.6, ...fadeUp(ctaReveal.visible, 0.1) }}>
            Browse semi-private flights across multiple airlines. Your next upgrade is one search away.
          </p>
          <a href="/desktop" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 36px', borderRadius: '12px',
            backgroundColor: dark ? C.pink : C.black, color: C.cream, fontSize: '15px', fontWeight: 700, textDecoration: 'none',
            ...fadeUp(ctaReveal.visible, 0.2),
          }}>
            Search Flights <ArrowRight style={{ width: '16px', height: '16px' }} />
          </a>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div style={{ background: dark ? '#0A0A0A' : C.black, padding: '40px 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '16px', height: '8px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
            <div style={{ width: '16px', height: '8px', backgroundColor: C.pink, borderRadius: '1px' }} />
            <div style={{ width: '16px', height: '8px', backgroundColor: C.cream, borderRadius: '1px' }} />
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>Aviato</div>
        <p style={{ fontSize: '13px', color: C.g400, margin: '0 0 16px' }}>Search and compare semi-private flights across every carrier.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <a href="/desktop/terms" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Terms</a>
          <a href="/desktop/privacy" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Privacy</a>
          <a href="mailto:aviatoair@gmail.com" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
