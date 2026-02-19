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

export default function AboutPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = new URLSearchParams(window.location.search).get('theme');
    if (stored === 'dark') setDark(true);
  }, []);

  const t = T(dark);

  // Section reveals
  const heroReveal = useReveal(0.1);
  const missionReveal = useReveal(0.15);
  const howReveal = useReveal(0.1);
  const whyReveal = useReveal(0.1);
  const airlinesReveal = useReveal(0.1);
  const statusReveal = useReveal(0.15);
  const faqReveal = useReveal(0.1);
  const ctaReveal = useReveal(0.2);

  const faqs = [
    {
      q: 'What is Aviato?',
      a: 'Aviato is a flight search engine exclusively for semi-private airlines. We aggregate flights from carriers like JSX, Aero, Tradewind, Slate, and BARK Air into one easy search, so you can compare prices, times, and amenities across every option.',
    },
    {
      q: 'Is Aviato free to use?',
      a: 'Yes, Aviato is completely free. We help you find and compare semi-private flights, then link you directly to the airline to book. You always book at the same price as going directly to the airline.',
    },
    {
      q: 'Do I book through Aviato?',
      a: 'No — Aviato links you directly to the airline\'s booking page with your route pre-selected. You complete your purchase on their website. We never handle your payment or personal booking details.',
    },
    {
      q: 'What is semi-private flying?',
      a: 'Semi-private airlines operate small jets (16–30 seats) from private terminals. You skip TSA lines, arrive just 15 minutes before departure, and enjoy a premium experience — leather seats, complimentary food & drinks, and quiet cabins — at a fraction of charter costs, starting from $99/seat.',
    },
    {
      q: 'Are the prices on Aviato accurate?',
      a: 'We update our flight data regularly, but prices and schedules are estimates. We always recommend confirming final pricing and availability directly on the airline\'s website before booking.',
    },
    {
      q: 'Which airlines does Aviato track?',
      a: 'We currently track JSX, Aero, Tradewind Aviation, Slate, and BARK Air. We\'re always working to add more carriers as the semi-private market grows.',
    },
    {
      q: 'Can I book round-trip flights?',
      a: 'Absolutely. Search round-trip and Aviato will show you outbound and return options. Select both legs and we\'ll create a trip summary with booking links — even if your outbound and return are on different airlines.',
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
          Aviato is the first search engine for semi-private flights. We bring together every carrier, every route, and every fare so you can find the perfect flight in seconds.
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

      {/* ─── Mission statement ─── */}
      <div ref={missionReveal.ref} style={{ maxWidth: '700px', margin: '0 auto', padding: '0 48px 80px', textAlign: 'center' }}>
        <p style={{ fontSize: '28px', fontWeight: 800, color: t.text, lineHeight: 1.4, letterSpacing: '-0.01em', ...fadeUp(missionReveal.visible, 0) }}>
          Flying should feel special.
        </p>
        <p style={{ fontSize: '16px', color: t.textSec, lineHeight: 1.7, margin: '16px 0 0', ...fadeUp(missionReveal.visible, 0.12) }}>
          Commercial aviation turned a magical experience into a stressful one. Semi-private airlines are bringing it back — private terminals, small jets, and real hospitality. Aviato makes it easy to find them.
        </p>
      </div>

      {/* ─── How It Works ─── */}
      <div ref={howReveal.ref} style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(howReveal.visible, 0) }}>How Aviato Works</h2>
          <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 48px', textAlign: 'center', ...fadeUp(howReveal.visible, 0.08) }}>Three steps to your next flight</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {[
              { icon: <Search style={{ width: '26px', height: '26px' }} />, title: 'Search', desc: 'Enter your route and dates. We search across every semi-private carrier simultaneously so you never miss a flight.' },
              { icon: <Zap style={{ width: '26px', height: '26px' }} />, title: 'Compare', desc: 'See all available flights side by side — prices, times, aircraft, amenities, and our wing ratings. Filter and sort instantly.' },
              { icon: <Plane style={{ width: '26px', height: '26px' }} />, title: 'Book Direct', desc: 'Click through to book directly with the airline. We link you straight to the booking page with your route pre-selected.' },
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
            { icon: <Clock style={{ width: '24px', height: '24px' }} />, title: 'Skip the Terminal', desc: 'Walk in 15 minutes before departure. No TSA lines, no crowded gates, no overhead bin fights. Just show up and fly.' },
            { icon: <DollarSign style={{ width: '24px', height: '24px' }} />, title: 'Affordable Luxury', desc: 'Starting from $99 per seat. Semi-private gives you a private jet experience at a fraction of the cost of chartering.' },
            { icon: <Shield style={{ width: '24px', height: '24px' }} />, title: 'Premium Experience', desc: 'Leather seats, complimentary drinks, gourmet snacks, and planes with 16-30 seats max. Flying the way it should be.' },
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
            Aviato is still pretty young — think of us as the scrappy startup that really, really loves planes. Right now we&apos;re covering the most popular semi-private routes, the ones people actually want to fly. But we&apos;re adding new routes every single day, so if your dream flight isn&apos;t here yet, give us a minute. It&apos;s coming.
          </p>
          <p style={{ margin: '0 0 16px' }}>
            Same goes for airlines. We&apos;re actively bringing more carriers onto the platform. The semi-private world is growing fast and we want every option in one place for you.
          </p>
          <p style={{ margin: '0 0 0', fontWeight: 600, color: t.text }}>
            And hey — if you&apos;re a semi-private airline and you&apos;re reading this, we&apos;d love to feature you. Seriously. <a href="mailto:aviatoair@gmail.com" style={{ color: t.accent, textDecoration: 'underline' }}>Drop us a line</a> and let&apos;s make it happen.
          </p>
        </div>
      </div>

      {/* ─── FAQ (fixaplan-style accordion) ─── */}
      <div ref={faqReveal.ref} style={{ maxWidth: '700px', margin: '0 auto', padding: '72px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, color: t.text, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em', ...fadeUp(faqReveal.visible, 0) }}>FAQ</h2>
        <p style={{ fontSize: '16px', color: t.textMuted, margin: '0 0 40px', textAlign: 'center', ...fadeUp(faqReveal.visible, 0.08) }}>
          Got a question? We&apos;re here to help. Feel free to <a href="mailto:aviatoair@gmail.com" style={{ color: t.accent, textDecoration: 'underline' }}>reach out</a> anytime.
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
            Search thousands of semi-private flights across five airlines. Your next upgrade is one click away.
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
