'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Plane, Clock, Wifi, Coffee, Wine, Heart, Shield,
  ExternalLink, X, Search, Users, Building2, Timer, Briefcase, Sparkles,
  ArrowRight, Sun, Moon
} from 'lucide-react';

import { C, AIRLINE_STYLE, AIRLINE_BOOKING, WING_RATINGS, BADGE_CONFIG, WING_COLORS } from '../../data/constants';
import { findLoc } from '../../data/locations';
import { getMetroAreaFlights, getRouteDates } from '../../data/flights';
import { generateDeepLink, getDeepLinkNote } from '../../data/deeplinks';
import type { Flight } from '../../data/types';

// Theme colors (same as landing page)
const T = (dark: boolean) => ({
  bg: dark ? '#161616' : '#FFFCF2',
  bgAlt: dark ? '#1E1E1E' : '#FFFFFF',
  card: dark ? '#1E1E1E' : '#FFFFFF',
  cardBorder: dark ? '#2D2D2D' : '#E5E5E0',
  text: dark ? '#F5F0E1' : '#000000',
  textSec: dark ? '#9B9B93' : '#6B6B63',
  textMuted: dark ? '#6B6B63' : '#9B9B93',
  sectionBg: dark ? '#151515' : '#F5F0E1',
  panelBg: dark ? '#1E1E1E' : '#FFFFFF',
  panelSection: dark ? '#252525' : '#FAFAF7',
  filterActive: dark ? C.cream : C.black,
  filterActiveText: dark ? C.black : C.white,
  filterInactive: dark ? '#252525' : '#F3F3F0',
  filterInactiveText: dark ? '#9B9B93' : '#6B6B63',
  disclaimerBg: dark ? '#2A2200' : '#FFF8E1',
  disclaimerBorder: dark ? '#5C4D00' : '#FFE082',
  disclaimerText: dark ? '#FFD54F' : '#6D5D00',
  topBar: dark ? '#000000' : C.black,
  hoverShadow: dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
  accent: dark ? '#E8576D' : '#0A3D2E',
});

const WingIcon = ({ size = 14, color = '#0A3D2E' }: { size?: number; color?: string }) => (
  <svg width={size} height={Math.round(size * 0.8)} viewBox="0 0 24 19" fill={color}>
    <path d="M2 17C5 11 10 6 16 4c2.5-0.8 4.5-0.5 6 1s1.5 4-0.5 7c-3 4-8 5.5-12 5C6.5 16.5 4 15 2 17z" />
  </svg>
);

const BadgeIcon = ({ type, size = 12 }: { type: string; size?: number }) => {
  const s = { width: `${size}px`, height: `${size}px` };
  switch (type) {
    case 'building': return <Building2 style={s} />;
    case 'timer': return <Timer style={s} />;
    case 'users': return <Users style={s} />;
    case 'briefcase': return <Briefcase style={s} />;
    case 'sparkles': return <Sparkles style={s} />;
    case 'star': return <Shield style={s} />;
    case 'heart': return <Heart style={s} />;
    default: return null;
  }
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromCode = searchParams.get('from') || '';
  const toCode = searchParams.get('to') || '';
  const departDate = searchParams.get('depart') || '';
  const returnDate = searchParams.get('return') || '';
  const passengers = Number(searchParams.get('pax') || '1');
  const tripType = searchParams.get('trip') || 'roundtrip';
  const initialTheme = searchParams.get('theme') || 'light';

  const [dark, setDark] = useState(initialTheme === 'dark');
  const [filter, setFilter] = useState('all');
  const [viewingReturn, setViewingReturn] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [bookingConfirm, setBookingConfirm] = useState<{ url: string; airline: string; note: string } | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => { const d = departDate ? new Date(departDate + 'T12:00:00') : new Date(); return d.getMonth(); });
  const [pickerYear, setPickerYear] = useState(() => { const d = departDate ? new Date(departDate + 'T12:00:00') : new Date(); return d.getFullYear(); });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const t = T(dark);
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '';

  const [airlineFilter, setAirlineFilter] = useState<string | null>(null);

  const sortFlights = (flights: Flight[], f: string) => {
    if (f === 'cheapest') return [...flights].sort((a, b) => a.price - b.price);
    if (f === 'fastest') return [...flights].sort((a, b) => parseInt(a.dur) - parseInt(b.dur));
    if (f === 'rated') return [...flights].sort((a, b) => (WING_RATINGS[b.airline]?.wings || 0) - (WING_RATINGS[a.airline]?.wings || 0));
    return flights;
  };

  const isRT = tripType === 'roundtrip' && !!returnDate;
  const rawOutFlights = getMetroAreaFlights(fromCode, toCode, departDate);
  const rawRetFlights = isRT ? getMetroAreaFlights(toCode, fromCode, returnDate) : [];
  const outFiltered = airlineFilter ? rawOutFlights.filter(f => f.airline === airlineFilter) : rawOutFlights;
  const retFiltered = airlineFilter ? rawRetFlights.filter(f => f.airline === airlineFilter) : rawRetFlights;
  const outFlights = sortFlights(outFiltered, filter);
  const retFlights = sortFlights(retFiltered, filter);
  const flights = viewingReturn ? retFlights : outFlights;
  const rawFlights = viewingReturn ? rawRetFlights : rawOutFlights;
  const availableAirlines = [...new Set(rawFlights.map(f => f.airline))].sort();

  const currentDate = viewingReturn ? returnDate : departDate;

  const goBack = () => {
    const params = new URLSearchParams({ from: fromCode, to: toCode, theme: dark ? 'dark' : 'light' });
    router.push(`/desktop?${params.toString()}`);
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const currentDateParam = viewingReturn ? 'return' : 'depart';
    const params = new URLSearchParams({
      from: fromCode,
      to: toCode,
      depart: viewingReturn ? departDate : dateStr,
      ...(returnDate && { return: viewingReturn ? dateStr : returnDate }),
      pax: passengers.toString(),
      trip: tripType,
      theme: dark ? 'dark' : 'light',
    });
    router.push(`/desktop/results?${params.toString()}`);
    setDatePickerOpen(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getCheapestForDate = (dateStr: string): number | null => {
    const fc = viewingReturn ? toCode : fromCode;
    const tc = viewingReturn ? fromCode : toCode;
    const flights = getMetroAreaFlights(fc, tc, dateStr);
    if (flights.length === 0) return null;
    return Math.round(Math.min(...flights.map(f => f.price)));
  };

  const getAvailableDates = (): Set<string> | null => {
    try {
      const dates = getRouteDates(viewingReturn ? toCode : fromCode, viewingReturn ? fromCode : toCode);
      if (dates === null) return null; // null means daily route — all dates available
      return new Set(dates);
    } catch {
      return null; // on error, allow all dates
    }
  };

  // Detail panel
  const DetailPanel = ({ fl, onClose }: { fl: Flight; onClose: () => void }) => {
    const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
    const basePrice = Math.round(fl.price);
    const taxes = Math.round(basePrice * 0.12);
    const total = (basePrice + taxes) * passengers;
    const rating = WING_RATINGS[fl.airline];
    const deepLinkUrl = generateDeepLink(fl.airline, fl.dc, fl.ac, departDate, returnDate, passengers, tripType);
    const deepLinkNote = getDeepLinkNote(fl.airline, fl.dc, fl.ac, tripType);

    return (
      <div style={{ position: 'fixed', top: isMobile ? 0 : 0, right: isMobile ? 0 : 0, bottom: isMobile ? 0 : 0, left: isMobile ? 0 : 'auto', width: isMobile ? '100%' : '480px', backgroundColor: t.panelBg, boxShadow: isMobile ? 'none' : `-8px 0 40px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`, zIndex: 100, overflowY: 'auto', transition: 'background-color 0.3s ease' }}>
        {/* Header */}
        <div style={{ background: style.bg || C.black, padding: '20px 24px', color: C.white }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: '4px 0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <X style={{ width: '16px', height: '16px' }} /> Close
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900 }}>{style.label}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{fl.airline}</h2>
              <p style={{ opacity: 0.7, margin: '2px 0 0', fontSize: '12px' }}>{fl.craft}</p>
            </div>
            {rating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                  {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={14} color={C.cream} />)}
                </div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: C.cream, opacity: 0.8, marginTop: '2px' }}>
                  {rating.wings === 3 ? 'FLAGSHIP' : rating.wings === 2 ? 'PREMIUM' : 'ACCESSIBLE'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flight timeline */}
        <div style={{ margin: '16px 24px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: '0 0 14px' }}>Flight · {fmtDate(currentDate)}</h3>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: C.darkGreen }} />
              <div style={{ width: '2px', flex: 1, backgroundColor: t.cardBorder, margin: '4px 0' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: C.pink }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.06em' }}>DEPARTURE</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{fl.dep}</div>
                <div style={{ fontSize: '12px', color: t.textSec }}>{findLoc(fl.dc).name || findLoc(fl.dc).city} ({fl.dc})</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.06em' }}>ARRIVAL</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{fl.arr}</div>
                <div style={{ fontSize: '12px', color: t.textSec }}>{findLoc(fl.ac).name || findLoc(fl.ac).city} ({fl.ac})</div>
              </div>
            </div>
            <div style={{ alignSelf: 'center', padding: '8px 12px', backgroundColor: dark ? '#3D1520' : C.cream, borderRadius: '10px', textAlign: 'center' }}>
              <Clock style={{ width: '13px', height: '13px', color: dark ? C.pink : C.darkGreen, margin: '0 auto 2px' }} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: dark ? C.pink : C.darkGreen }}>{fl.dur}</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ margin: '0 24px 14px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: '0 0 12px' }}>Price</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Base fare × {passengers}</span><span style={{ fontWeight: 600, color: t.text }}>${basePrice * passengers}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Taxes & fees</span><span style={{ fontWeight: 600, color: t.text }}>${taxes * passengers}</span></div>
          <div style={{ borderTop: `2px solid ${t.cardBorder}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, color: t.text }}>Total</span><span style={{ fontWeight: 800, fontSize: '18px', color: dark ? C.pink : C.darkGreen }}>${total}</span>
          </div>
        </div>

        {/* Rating */}
        {rating && (() => {
          const wc = WING_COLORS[rating.wings];
          const allCriteria = ['terminal','arrival','density','baggage','amenities','seating'];
          return (
            <div style={{ margin: '0 24px 14px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0 }}>Aviato Rating</h3>
                    <span style={{ fontSize: '8px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', backgroundColor: dark ? (rating.wings === 3 ? '#3D3000' : rating.wings === 2 ? '#1A3A2E' : '#252525') : (rating.wings === 3 ? '#FDF6E3' : rating.wings === 2 ? '#E8F5E9' : C.g100), color: wc }}>{rating.tier}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: t.textMuted }}>{rating.score}/6 criteria met</div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={18} color={wc} />)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {allCriteria.map(c => {
                  const has = rating.badges.includes(c);
                  const cfg = BADGE_CONFIG[c];
                  if (!cfg) return null;
                  return (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: '8px', backgroundColor: has ? (dark ? '#1A3A2E' : C.cream) : (dark ? '#1F1F1F' : C.g100), opacity: has ? 1 : 0.5 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: has ? C.darkGreen : (dark ? '#333' : C.g300), display: 'flex', alignItems: 'center', justifyContent: 'center', color: has ? C.cream : C.white, flexShrink: 0 }}>
                        <BadgeIcon type={cfg.icon} size={11} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: has ? t.text : t.textMuted }}>{cfg.label}</div>
                        <div style={{ fontSize: '8px', color: has ? (dark ? C.cream : C.darkGreen) : t.textMuted, fontWeight: 600 }}>{has ? '✓ Yes' : '✗ No'}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: '8px', backgroundColor: rating.pets ? (dark ? '#3D1520' : '#FDE8EC') : (dark ? '#1F1F1F' : C.g100), opacity: rating.pets ? 1 : 0.5, gridColumn: '1 / -1' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: rating.pets ? C.pink : (dark ? '#333' : C.g300), display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, flexShrink: 0 }}>
                    <Heart style={{ width: '11px', height: '11px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: rating.pets ? t.text : t.textMuted }}>Pet Friendly</div>
                    <div style={{ fontSize: '8px', color: rating.pets ? C.pink : t.textMuted, fontWeight: 600 }}>{rating.pets ? `✓ ${rating.petNote || 'Pets welcome'}` : '✗ Not available'}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Amenities */}
        <div style={{ margin: '0 24px 14px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: '0 0 10px' }}>Included Amenities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {fl.amen.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: dark ? '#3D1520' : C.cream, borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: dark ? C.pink : C.darkGreen }}>
                {a.includes('WiFi') && <Wifi style={{ width: '12px', height: '12px' }} />}
                {(a.includes('Snack') || a.includes('Catering')) && <Coffee style={{ width: '12px', height: '12px' }} />}
                {(a.includes('Champagne') || a.includes('Cocktail') || a.includes('Wine')) && <Wine style={{ width: '12px', height: '12px' }} />}
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Booking info */}
        <div style={{ margin: '0 24px 14px', padding: '14px 16px', backgroundColor: t.panelSection, borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: t.textSec, lineHeight: 1.5 }}>{deepLinkNote}</div>
        </div>

        {/* Book button */}
        <div style={{ padding: '0 24px 24px' }}>
          <button onClick={() => setBookingConfirm({ url: deepLinkUrl, airline: fl.airline, note: deepLinkNote })}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', color: C.cream, backgroundColor: dark ? C.pink : C.black, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box',
            }}>
            <ExternalLink style={{ width: '15px', height: '15px' }} /> Book on {fl.airline}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Global smooth theme transition */}
      <style>{`
        .aviato-results, .aviato-results *, .aviato-results *::before, .aviato-results *::after {
          transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease !important;
        }
        .aviato-results img {
          transition: none !important;
        }
      `}</style>
      <div className="aviato-results" style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg }}>
      {/* Top bar */}
      <div style={{ background: t.topBar, padding: isMobile ? '16px 16px' : '16px 40px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
        {/* First row: Logo/back button and dark mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto', gap: '20px' }}>
          <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: C.white, fontSize: '14px', fontWeight: 700, padding: 0 }}>
            <ChevronLeft style={{ width: '18px', height: '18px' }} />
            <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                <div style={{ width: '12px', height: '5px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '5px', backgroundColor: C.pink, borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '5px', backgroundColor: C.cream, borderRadius: '1px' }} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900 }}>Aviato</span>
            </div>
          </button>
          {!isMobile && <div style={{ flex: 1 }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setDark(!dark)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? <Sun style={{ width: '16px', height: '16px', color: C.cream }} /> : <Moon style={{ width: '16px', height: '16px', color: '#fff' }} />}
            </button>
            {isMobile && (
              <button onClick={goBack} style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', backgroundColor: 'transparent', color: C.cream, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search style={{ width: '13px', height: '13px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Second row (mobile only): Route info */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.cream, fontSize: '11px', width: '100%', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{findLoc(fromCode).city}</span>
            <ArrowRight style={{ width: '12px', height: '12px', color: C.g400 }} />
            <span style={{ fontWeight: 700 }}>{findLoc(toCode).city}</span>
            <span style={{ color: C.g400 }}>·</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span onClick={() => setDatePickerOpen(!datePickerOpen)} style={{ cursor: 'pointer', borderBottom: `2px solid ${dark ? C.pink : C.darkGreen}`, paddingBottom: '1px', fontSize: '11px' }}>{fmtDate(viewingReturn ? returnDate : departDate)}</span>
              {datePickerOpen && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 48 }} onClick={() => setDatePickerOpen(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', backgroundColor: dark ? '#1E1E1E' : '#fff', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', padding: '16px', width: 'calc(100vw - 64px)', maxWidth: '280px', zIndex: 50 }} onClick={(e) => e.stopPropagation()}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <button onClick={() => {
                        setPickerMonth(pickerMonth === 0 ? 11 : pickerMonth - 1);
                        setPickerYear(pickerMonth === 0 ? pickerYear - 1 : pickerYear);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft style={{ width: '18px', height: '18px', color: dark ? C.cream : C.black }} />
                      </button>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: dark ? C.cream : C.black }}>
                        {new Date(pickerYear, pickerMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <button onClick={() => {
                        setPickerMonth(pickerMonth === 11 ? 0 : pickerMonth + 1);
                        setPickerYear(pickerMonth === 11 ? pickerYear + 1 : pickerYear);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight style={{ width: '18px', height: '18px', color: dark ? C.cream : C.black }} />
                      </button>
                    </div>
                    {/* Day grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: dark ? '#9B9B93' : '#6B6B63', padding: '4px 0' }}>
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const daysInMonth = getDaysInMonth(pickerMonth, pickerYear);
                        const firstDay = getFirstDayOfMonth(pickerMonth, pickerYear);
                        const availableDates = getAvailableDates();
                        const days = [];
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} style={{ padding: '4px' }} />);
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isAvailable = availableDates === null ? true : availableDates.has(dateStr);
                          const isSelected = dateStr === (viewingReturn ? returnDate : departDate);
                          const cheapest = isAvailable ? getCheapestForDate(dateStr) : null;
                          days.push(
                            <button
                              key={day}
                              onClick={() => handleDateSelect(day)}
                              disabled={!isAvailable}
                              style={{
                                padding: '4px 2px',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: isSelected ? (dark ? C.pink : C.darkGreen) : isAvailable ? 'transparent' : (dark ? '#252525' : C.g100),
                                color: isSelected ? C.white : (isAvailable ? (dark ? C.cream : C.black) : (dark ? '#6B6B63' : '#9B9B93')),
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                fontSize: '12px',
                                fontWeight: 600,
                                opacity: isAvailable ? 1 : 0.5,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                              }}
                            >
                              <span>{day}</span>
                              {cheapest && <span style={{ fontSize: '8px', fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.8)' : (dark ? '#87CEAB' : '#0A3D2E'), lineHeight: 1 }}>${cheapest}</span>}
                            </button>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span style={{ color: C.g400 }}>·</span>
            <span style={{ fontSize: '11px' }}>{passengers} pax</span>
          </div>
        )}

        {/* Desktop route info row */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: C.cream, fontSize: '13px' }}>
            <span style={{ fontWeight: 700 }}>{findLoc(fromCode).city}</span>
            <ArrowRight style={{ width: '14px', height: '14px', color: C.g400 }} />
            <span style={{ fontWeight: 700 }}>{findLoc(toCode).city}</span>
            <span style={{ color: C.g400 }}>·</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span onClick={() => setDatePickerOpen(!datePickerOpen)} style={{ cursor: 'pointer', borderBottom: `2px solid ${dark ? C.pink : C.darkGreen}`, paddingBottom: '2px' }}>{fmtDate(viewingReturn ? returnDate : departDate)}{isRT ? ` – ${fmtDate(viewingReturn ? departDate : returnDate)}` : ''}</span>
              {datePickerOpen && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 48 }} onClick={() => setDatePickerOpen(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', backgroundColor: dark ? '#1E1E1E' : '#fff', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', padding: '16px', width: '280px', zIndex: 50 }} onClick={(e) => e.stopPropagation()}>
                    {/* Month navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <button onClick={() => {
                        setPickerMonth(pickerMonth === 0 ? 11 : pickerMonth - 1);
                        setPickerYear(pickerMonth === 0 ? pickerYear - 1 : pickerYear);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft style={{ width: '18px', height: '18px', color: dark ? C.cream : C.black }} />
                      </button>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: dark ? C.cream : C.black }}>
                        {new Date(pickerYear, pickerMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <button onClick={() => {
                        setPickerMonth(pickerMonth === 11 ? 0 : pickerMonth + 1);
                        setPickerYear(pickerMonth === 11 ? pickerYear + 1 : pickerYear);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight style={{ width: '18px', height: '18px', color: dark ? C.cream : C.black }} />
                      </button>
                    </div>
                    {/* Day grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: dark ? '#9B9B93' : '#6B6B63', padding: '4px 0' }}>
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const daysInMonth = getDaysInMonth(pickerMonth, pickerYear);
                        const firstDay = getFirstDayOfMonth(pickerMonth, pickerYear);
                        const availableDates = getAvailableDates();
                        const days = [];
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} style={{ padding: '4px' }} />);
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isAvailable = availableDates === null ? true : availableDates.has(dateStr);
                          const isSelected = dateStr === (viewingReturn ? returnDate : departDate);
                          const cheapest = isAvailable ? getCheapestForDate(dateStr) : null;
                          days.push(
                            <button
                              key={day}
                              onClick={() => handleDateSelect(day)}
                              disabled={!isAvailable}
                              style={{
                                padding: '4px 2px',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: isSelected ? (dark ? C.pink : C.darkGreen) : isAvailable ? 'transparent' : (dark ? '#252525' : C.g100),
                                color: isSelected ? C.white : (isAvailable ? (dark ? C.cream : C.black) : (dark ? '#6B6B63' : '#9B9B93')),
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                fontSize: '12px',
                                fontWeight: 600,
                                opacity: isAvailable ? 1 : 0.5,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                              }}
                            >
                              <span>{day}</span>
                              {cheapest && <span style={{ fontSize: '8px', fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.8)' : (dark ? '#87CEAB' : '#0A3D2E'), lineHeight: 1 }}>${cheapest}</span>}
                            </button>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span style={{ color: C.g400 }}>·</span>
            <span>{passengers} pax</span>
          </div>
        )}

        {/* Desktop New Search button */}
        {!isMobile && (
          <button onClick={goBack} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', backgroundColor: 'transparent', color: C.cream, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search style={{ width: '13px', height: '13px' }} /> New Search
          </button>
        )}
      </div>

      {/* RT tabs */}
      {isRT && (
        <div style={{ display: 'flex', backgroundColor: t.bgAlt, borderBottom: `1px solid ${t.cardBorder}`, maxWidth: '960px', margin: '0 auto' }}>
          <button onClick={() => setViewingReturn(false)} style={{ flex: 1, padding: '14px', border: 'none', borderBottom: !viewingReturn ? `3px solid ${dark ? C.pink : C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: !viewingReturn ? (dark ? C.pink : C.darkGreen) : t.textMuted }}>
            {selectedOutbound ? '✓ ' : ''}Outbound · {fmtDate(departDate)}
          </button>
          <button onClick={() => setViewingReturn(true)} style={{ flex: 1, padding: '14px', border: 'none', borderBottom: viewingReturn ? `3px solid ${dark ? C.pink : C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: viewingReturn ? (dark ? C.pink : C.darkGreen) : t.textMuted }}>
            {selectedReturn ? '✓ ' : ''}Return · {fmtDate(returnDate)}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '16px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'cheapest', 'fastest', 'rated'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', borderRadius: '100px', border: 'none', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', backgroundColor: filter === f ? t.filterActive : t.filterInactive, color: filter === f ? t.filterActiveText : t.filterInactiveText,
              transition: 'background-color 0.2s ease, color 0.2s ease',
            }}>
              {f === 'all' ? 'All Flights' : f === 'cheapest' ? 'Cheapest' : f === 'fastest' ? 'Fastest' : 'Highest Rated'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '13px', color: t.textMuted, fontWeight: 600 }}>{flights.length} flights found</span>
      </div>

      {availableAirlines.length > 1 && (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '4px 16px 8px' : '4px 40px 8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setAirlineFilter(null)} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: airlineFilter === null ? `2px solid ${t.filterActive}` : `1.5px solid ${dark ? '#555' : '#ccc'}`, backgroundColor: airlineFilter === null ? t.filterActive : 'transparent', color: airlineFilter === null ? t.filterActiveText : t.filterInactiveText, transition: 'all 0.2s ease' }}>
              All Airlines
            </button>
            {availableAirlines.map(a => {
              const style = AIRLINE_STYLE[a];
              const isActive = airlineFilter === a;
              return (
                <button key={a} onClick={() => setAirlineFilter(isActive ? null : a)} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: isActive ? `2px solid ${style?.bg || t.filterActive}` : `1.5px solid ${dark ? '#555' : (style?.bg || '#ccc')}`, backgroundColor: isActive ? (style?.bg || t.filterActive) : 'transparent', color: isActive ? (style?.text || t.filterActiveText) : (dark ? style?.accent || t.filterInactiveText : style?.bg || t.filterInactiveText), transition: 'all 0.2s ease' }}>
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ maxWidth: '960px', margin: '4px auto 8px', padding: isMobile ? '0 16px' : '0 40px' }}>
        <div style={{ padding: '10px 14px', backgroundColor: t.disclaimerBg, borderRadius: '10px', border: `1px solid ${t.disclaimerBorder}`, fontSize: '11px', color: t.disclaimerText, lineHeight: 1.4 }}>
          Prices & schedules are estimates and may not reflect real-time availability. Always confirm details on the airline&apos;s website before booking.
        </div>
      </div>

      {/* Flight list */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '8px 16px 60px' : `8px 40px ${isRT && (selectedOutbound || selectedReturn) ? '120px' : '60px'}` }}>
        {flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textMuted }}>
            <Plane style={{ width: '48px', height: '48px', color: t.cardBorder, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: '0 0 6px' }}>No flights for these dates</h3>
            <p style={{ fontSize: '14px', color: t.textMuted, margin: '0 0 24px' }}>Try different dates or explore nearby airports.</p>
            <button onClick={goBack} style={{ padding: '14px 32px', border: 'none', borderRadius: '12px', backgroundColor: dark ? C.pink : C.black, color: C.cream, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Back to Search
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {flights.map(fl => {
              const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
              const rating = WING_RATINGS[fl.airline];
              const wingColor = rating ? WING_COLORS[rating.wings] : t.textMuted;
              return (
                <button key={fl.id} onClick={() => {
                    if (isRT) {
                      if (!viewingReturn) {
                        setSelectedOutbound(fl);
                        setViewingReturn(true);
                      } else {
                        setSelectedReturn(fl);
                        setShowTripSummary(true);
                      }
                    } else {
                      setSelectedFlight(fl);
                    }
                  }}
                  style={{
                    width: '100%', backgroundColor: t.card, borderRadius: '14px', padding: isMobile ? '14px 16px' : '22px 28px',
                    border: `1px solid ${selectedOutbound?.id === fl.id && !viewingReturn ? (dark ? C.pink : C.darkGreen) : selectedReturn?.id === fl.id && viewingReturn ? (dark ? C.pink : C.darkGreen) : t.cardBorder}`,
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '24px',
                    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!isMobile) { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${t.hoverShadow}`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!isMobile) { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; } }}
                >
                  {/* Airline badge */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, fontSize: '12px', fontWeight: 900, flexShrink: 0 }}>{style.label}</div>

                  {/* Airline + rating container */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '0', flex: isMobile ? 1 : 'auto', width: isMobile ? '100%' : 'auto' }}>
                  {/* Airline + rating */}
                  <div style={{ width: isMobile ? 'auto' : '110px', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: '14px' }}>{fl.airline}</div>
                    {rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={10} color={wingColor} />)}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: t.textMuted, marginTop: '2px' }}>{fl.craft}</div>
                  </div>

                  </div>

                  {/* Times */}
                  <div style={{ flex: isMobile ? '1' : '1', display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>{fl.dep}</div>
                      <div style={{ fontSize: '11px', color: t.textMuted }}>{fl.dc}</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ fontSize: '10px', color: t.textSec, fontWeight: 600 }}>{fl.dur}</div>
                      <div style={{ width: '100%', height: '1px', backgroundColor: t.cardBorder, position: 'relative' }}>
                        <Plane style={{ width: '11px', height: '11px', color: dark ? C.cream : C.darkGreen, position: 'absolute', top: '-5px', left: '50%', marginLeft: '-5px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>{fl.arr}</div>
                      <div style={{ fontSize: '11px', color: t.textMuted }}>{fl.ac}</div>
                    </div>
                  </div>

                  {/* Badges - hidden on mobile */}
                  <div style={{ display: isMobile ? 'none' : 'flex', gap: '5px', flexWrap: 'wrap', width: '140px', flexShrink: 0 }}>
                    {rating && rating.badges.slice(0, 2).map(b => (
                      <span key={b} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '100px', backgroundColor: dark ? '#3D1520' : C.cream, color: dark ? C.pink : C.darkGreen, fontWeight: 600 }}>
                        {BADGE_CONFIG[b]?.label}
                      </span>
                    ))}
                    {rating?.pets && (
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '100px', backgroundColor: dark ? '#3D1520' : '#FDE8EC', color: C.pink, fontWeight: 600 }}>
                        Pet Friendly
                      </span>
                    )}
                  </div>

                  {/* Price + seats */}
                  <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: t.text }}>${Math.round(fl.price)}</div>
                    <div style={{ fontSize: '10px', color: fl.seats <= 3 ? C.pink : t.textMuted, fontWeight: 600 }}>{fl.seats} seats left</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail slide-over (one-way only) */}
      {selectedFlight && !isRT && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', zIndex: 99 }} onClick={() => setSelectedFlight(null)} />
          <DetailPanel fl={selectedFlight} onClose={() => setSelectedFlight(null)} />
        </>
      )}

      {/* Round-trip sticky bottom bar */}
      {isRT && (selectedOutbound || selectedReturn) && !showTripSummary && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
          backgroundColor: dark ? '#1A1A1A' : '#FFFFFF',
          borderTop: `1px solid ${t.cardBorder}`,
          boxShadow: `0 -4px 24px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
          padding: '14px 40px',
        }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Outbound summary */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.06em', width: '60px' }}>OUTBOUND</div>
              {selectedOutbound ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: (AIRLINE_STYLE[selectedOutbound.airline] || { bg: '#333' }).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (AIRLINE_STYLE[selectedOutbound.airline] || { text: '#fff' }).text, fontSize: '9px', fontWeight: 900, flexShrink: 0 }}>{(AIRLINE_STYLE[selectedOutbound.airline] || { label: '?' }).label}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>{selectedOutbound.dep} → {selectedOutbound.arr}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedOutbound.airline} · {selectedOutbound.dur} · ${Math.round(selectedOutbound.price)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedOutbound(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMuted }}>
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: t.textMuted, fontStyle: 'italic' }}>Select an outbound flight</div>
              )}
            </div>

            <div style={{ width: '1px', height: '36px', backgroundColor: t.cardBorder }} />

            {/* Return summary */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.06em', width: '60px' }}>RETURN</div>
              {selectedReturn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: (AIRLINE_STYLE[selectedReturn.airline] || { bg: '#333' }).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (AIRLINE_STYLE[selectedReturn.airline] || { text: '#fff' }).text, fontSize: '9px', fontWeight: 900, flexShrink: 0 }}>{(AIRLINE_STYLE[selectedReturn.airline] || { label: '?' }).label}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>{selectedReturn.dep} → {selectedReturn.arr}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedReturn.airline} · {selectedReturn.dur} · ${Math.round(selectedReturn.price)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedReturn(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMuted }}>
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: t.textMuted, fontStyle: 'italic' }}>Select a return flight</div>
              )}
            </div>

            {/* Review button */}
            {selectedOutbound && selectedReturn && (
              <button onClick={() => setShowTripSummary(true)} style={{
                padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', color: C.cream, backgroundColor: dark ? C.pink : C.black,
                display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap',
              }}>
                Review Trip · ${Math.round(selectedOutbound.price + selectedReturn.price)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Round-trip summary overlay */}
      {isRT && showTripSummary && selectedOutbound && selectedReturn && (() => {
        const sameAirline = selectedOutbound.airline === selectedReturn.airline;
        const outStyle = AIRLINE_STYLE[selectedOutbound.airline] || { bg: '#333', text: '#fff', label: '?' };
        const retStyle = AIRLINE_STYLE[selectedReturn.airline] || { bg: '#333', text: '#fff', label: '?' };
        const outRating = WING_RATINGS[selectedOutbound.airline];
        const retRating = WING_RATINGS[selectedReturn.airline];
        const outBasePrice = Math.round(selectedOutbound.price);
        const retBasePrice = Math.round(selectedReturn.price);
        const totalBase = (outBasePrice + retBasePrice) * passengers;
        const totalTaxes = Math.round(totalBase * 0.12);
        const grandTotal = totalBase + totalTaxes;

        const outDeepLink = generateDeepLink(selectedOutbound.airline, selectedOutbound.dc, selectedOutbound.ac, departDate, returnDate, passengers, sameAirline ? 'roundtrip' : 'oneway');
        const retDeepLink = !sameAirline ? generateDeepLink(selectedReturn.airline, selectedReturn.dc, selectedReturn.ac, returnDate, '', passengers, 'oneway') : '';

        return (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', zIndex: 99 }} onClick={() => setShowTripSummary(false)} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : '520px', backgroundColor: t.panelBg, boxShadow: `-8px 0 40px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`, zIndex: 100, overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ background: dark ? '#1A1A1A' : C.black, padding: '20px 24px', color: C.white }}>
                <button onClick={() => setShowTripSummary(false)} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: '4px 0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <X style={{ width: '16px', height: '16px' }} /> Close
                </button>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Your Round Trip</h2>
                <p style={{ opacity: 0.7, margin: '4px 0 0', fontSize: '13px' }}>{findLoc(fromCode).city} ↔ {findLoc(toCode).city}</p>
              </div>

              {/* Outbound flight card */}
              <div style={{ margin: '16px 24px 0', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: outStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: outStyle.text, fontSize: '10px', fontWeight: 900 }}>{outStyle.label}</div>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: dark ? C.pink : C.darkGreen, letterSpacing: '0.06em' }}>OUTBOUND · {fmtDate(departDate)}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>{selectedOutbound.airline}</div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedOutbound(null); setShowTripSummary(false); setViewingReturn(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMuted, fontSize: '11px', fontWeight: 600 }}>Change</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{selectedOutbound.dep}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedOutbound.dc}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ fontSize: '10px', color: t.textSec, fontWeight: 600 }}>{selectedOutbound.dur}</div>
                    <div style={{ width: '100%', height: '1px', backgroundColor: t.cardBorder, position: 'relative' }}>
                      <Plane style={{ width: '11px', height: '11px', color: dark ? C.cream : C.darkGreen, position: 'absolute', top: '-5px', left: '50%', marginLeft: '-5px' }} />
                    </div>
                    <div style={{ fontSize: '9px', color: t.textMuted }}>{selectedOutbound.craft}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{selectedOutbound.arr}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedOutbound.ac}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: t.text, flexShrink: 0 }}>${outBasePrice}</div>
                </div>
              </div>

              {/* Connection line */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <div style={{ width: '2px', height: '20px', backgroundColor: t.cardBorder }} />
              </div>

              {/* Return flight card */}
              <div style={{ margin: '0 24px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: retStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: retStyle.text, fontSize: '10px', fontWeight: 900 }}>{retStyle.label}</div>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: dark ? C.pink : C.darkGreen, letterSpacing: '0.06em' }}>RETURN · {fmtDate(returnDate)}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>{selectedReturn.airline}</div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedReturn(null); setShowTripSummary(false); setViewingReturn(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMuted, fontSize: '11px', fontWeight: 600 }}>Change</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{selectedReturn.dep}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedReturn.dc}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ fontSize: '10px', color: t.textSec, fontWeight: 600 }}>{selectedReturn.dur}</div>
                    <div style={{ width: '100%', height: '1px', backgroundColor: t.cardBorder, position: 'relative' }}>
                      <Plane style={{ width: '11px', height: '11px', color: dark ? C.cream : C.darkGreen, position: 'absolute', top: '-5px', left: '50%', marginLeft: '-5px' }} />
                    </div>
                    <div style={{ fontSize: '9px', color: t.textMuted }}>{selectedReturn.craft}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: t.text }}>{selectedReturn.arr}</div>
                    <div style={{ fontSize: '11px', color: t.textSec }}>{selectedReturn.ac}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: t.text, flexShrink: 0 }}>${retBasePrice}</div>
                </div>
              </div>

              {/* Price breakdown */}
              <div style={{ margin: '16px 24px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: '0 0 12px' }}>Trip Total</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Outbound ({selectedOutbound.airline})</span><span style={{ fontWeight: 600, color: t.text }}>${outBasePrice * passengers}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Return ({selectedReturn.airline})</span><span style={{ fontWeight: 600, color: t.text }}>${retBasePrice * passengers}</span></div>
                {passengers > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: t.textMuted }}>× {passengers} passengers</span><span /></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Taxes & fees (est.)</span><span style={{ fontWeight: 600, color: t.text }}>${totalTaxes}</span></div>
                <div style={{ borderTop: `2px solid ${t.cardBorder}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: t.text }}>Estimated Total</span><span style={{ fontWeight: 800, fontSize: '20px', color: dark ? C.pink : C.darkGreen }}>${grandTotal}</span>
                </div>
              </div>

              {/* Booking buttons */}
              <div style={{ padding: '0 24px 24px' }}>
                {sameAirline ? (
                  <button onClick={() => setBookingConfirm({ url: outDeepLink, airline: selectedOutbound.airline, note: getDeepLinkNote(selectedOutbound.airline, selectedOutbound.dc, selectedOutbound.ac, 'roundtrip') })}
                    style={{
                      width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', color: C.cream, backgroundColor: dark ? C.pink : C.black, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box',
                    }}>
                    <ExternalLink style={{ width: '15px', height: '15px' }} /> Book Round Trip on {selectedOutbound.airline}
                  </button>
                ) : (
                  <>
                    <div style={{ fontSize: '12px', color: t.textSec, marginBottom: '12px', textAlign: 'center', lineHeight: 1.5 }}>
                      Your flights are on different airlines, so you&apos;ll book each leg separately.
                    </div>
                    <button onClick={() => setBookingConfirm({ url: outDeepLink, airline: selectedOutbound.airline, note: getDeepLinkNote(selectedOutbound.airline, selectedOutbound.dc, selectedOutbound.ac, 'oneway') })}
                      style={{
                        width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', color: outStyle.text || C.cream, backgroundColor: outStyle.bg || C.black, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box', marginBottom: '10px',
                      }}>
                      <ExternalLink style={{ width: '15px', height: '15px' }} /> Book Outbound on {selectedOutbound.airline}
                    </button>
                    <button onClick={() => setBookingConfirm({ url: retDeepLink, airline: selectedReturn.airline, note: getDeepLinkNote(selectedReturn.airline, selectedReturn.dc, selectedReturn.ac, 'oneway') })}
                      style={{
                        width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', color: retStyle.text || C.cream, backgroundColor: retStyle.bg || C.black, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box',
                      }}>
                      <ExternalLink style={{ width: '15px', height: '15px' }} /> Book Return on {selectedReturn.airline}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '10px', color: t.textMuted, marginTop: '10px' }}>
                      Each airline will be opened in a new tab
                    </p>
                  </>
                )}
              </div>

              {/* Disclaimer */}
              <div style={{ margin: '0 24px 24px', padding: '12px 16px', backgroundColor: t.disclaimerBg, borderRadius: '10px', border: `1px solid ${t.disclaimerBorder}`, fontSize: '11px', color: t.disclaimerText, lineHeight: 1.4 }}>
                Prices shown are estimates. Final pricing will be confirmed on the airline&apos;s booking page. Taxes and fees may vary.
              </div>
            </div>
          </>
        );
      })()}

      {/* Booking confirmation popup */}
      {bookingConfirm && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setBookingConfirm(null)}>
            <div style={{ backgroundColor: t.panelBg, borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: `0 24px 64px ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: dark ? '#3D1520' : C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ExternalLink style={{ width: '24px', height: '24px', color: dark ? C.pink : C.darkGreen }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text, margin: '0 0 8px' }}>You&apos;re heading to {bookingConfirm.airline}</h3>
              <p style={{ fontSize: '13px', color: t.textSec, lineHeight: 1.6, margin: '0 0 8px' }}>
                We&apos;ll take you to {bookingConfirm.airline}&apos;s website with your route pre-filled. You&apos;ll just need to select your preferred flight time and complete checkout there.
              </p>
              <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.5, margin: '0 0 24px' }}>
                {bookingConfirm.note}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setBookingConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${t.cardBorder}`, backgroundColor: 'transparent', color: t.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Go Back
                </button>
                <a href={bookingConfirm.url} target="_blank" rel="noopener noreferrer" onClick={() => setBookingConfirm(null)}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: dark ? C.pink : C.black, color: C.cream, fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                  Continue to {bookingConfirm.airline} <ArrowRight style={{ width: '14px', height: '14px' }} />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}

export default function DesktopResultsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: '16px', color: '#9B9B93' }}>Loading flights...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
