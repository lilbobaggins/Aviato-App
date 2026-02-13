'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Plane, Clock, Wifi, Coffee, Wine, Heart, Shield,
  ExternalLink, X, Search, Users, Building2, Timer, Briefcase, Sparkles,
  ArrowRight, Sun, Moon
} from 'lucide-react';

import { C, AIRLINE_STYLE, AIRLINE_BOOKING, WING_RATINGS, BADGE_CONFIG, WING_COLORS } from '../../data/constants';
import { findLoc } from '../../data/locations';
import { getMetroAreaFlights } from '../../data/flights';
import { generateDeepLink, getDeepLinkNote } from '../../data/deeplinks';
import type { Flight } from '../../data/types';

// Theme colors (same as landing page)
const T = (dark: boolean) => ({
  bg: dark ? '#0D0D0D' : '#FAFAF7',
  bgAlt: dark ? '#1A1A1A' : '#FFFFFF',
  card: dark ? '#1A1A1A' : '#FFFFFF',
  cardBorder: dark ? '#2A2A2A' : '#E5E5E0',
  text: dark ? '#F5F0E1' : '#000000',
  textSec: dark ? '#9B9B93' : '#6B6B63',
  textMuted: dark ? '#6B6B63' : '#9B9B93',
  sectionBg: dark ? '#151515' : '#F5F0E1',
  panelBg: dark ? '#1A1A1A' : '#FFFFFF',
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

  const t = T(dark);
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '';

  const sortFlights = (flights: Flight[], f: string) => {
    if (f === 'cheapest') return [...flights].sort((a, b) => a.price - b.price);
    if (f === 'fastest') return [...flights].sort((a, b) => parseInt(a.dur) - parseInt(b.dur));
    return flights;
  };

  const isRT = tripType === 'roundtrip' && !!returnDate;
  const outFlights = sortFlights(getMetroAreaFlights(fromCode, toCode, departDate), filter);
  const retFlights = isRT ? sortFlights(getMetroAreaFlights(toCode, fromCode, returnDate), filter) : [];
  const flights = viewingReturn ? retFlights : outFlights;

  const currentDate = viewingReturn ? returnDate : departDate;

  const goBack = () => {
    const params = new URLSearchParams({ from: fromCode, to: toCode, theme: dark ? 'dark' : 'light' });
    router.push(`/desktop?${params.toString()}`);
  };

  // Detail panel
  const DetailPanel = ({ fl, onClose }: { fl: Flight; onClose: () => void }) => {
    const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
    const taxes = Math.round(fl.price * 0.12);
    const total = (fl.price + taxes) * passengers;
    const rating = WING_RATINGS[fl.airline];
    const deepLinkUrl = generateDeepLink(fl.airline, fl.dc, fl.ac, departDate, returnDate, passengers, tripType);
    const deepLinkNote = getDeepLinkNote(fl.airline, fl.dc, fl.ac, tripType);

    return (
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', backgroundColor: t.panelBg, boxShadow: `-8px 0 40px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`, zIndex: 100, overflowY: 'auto', transition: 'background-color 0.3s ease' }}>
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
            <div style={{ alignSelf: 'center', padding: '8px 12px', backgroundColor: dark ? '#1A3A2E' : C.cream, borderRadius: '10px', textAlign: 'center' }}>
              <Clock style={{ width: '13px', height: '13px', color: dark ? C.cream : C.darkGreen, margin: '0 auto 2px' }} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: dark ? C.cream : C.darkGreen }}>{fl.dur}</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ margin: '0 24px 14px', backgroundColor: t.panelSection, borderRadius: '14px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: '0 0 12px' }}>Price</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Base fare × {passengers}</span><span style={{ fontWeight: 600, color: t.text }}>${fl.price * passengers}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span style={{ color: t.textSec }}>Taxes & fees</span><span style={{ fontWeight: 600, color: t.text }}>${taxes * passengers}</span></div>
          <div style={{ borderTop: `2px solid ${t.cardBorder}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, color: t.text }}>Total</span><span style={{ fontWeight: 800, fontSize: '18px', color: dark ? C.cream : C.darkGreen }}>${total}</span>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: dark ? '#1A3A2E' : C.cream, borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: dark ? C.cream : C.darkGreen }}>
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
          <a href={deepLinkUrl} target="_blank" rel="noopener noreferrer"
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', color: C.cream, backgroundColor: dark ? C.darkGreen : C.black, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box',
            }}>
            <ExternalLink style={{ width: '15px', height: '15px' }} /> Book on {fl.airline}
          </a>
          {AIRLINE_BOOKING[fl.airline] && (
            <p style={{ textAlign: 'center', fontSize: '10px', color: t.textMuted, marginTop: '8px' }}>You&apos;ll complete your booking on {fl.airline}&apos;s website</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      {/* Top bar */}
      <div style={{ background: t.topBar, padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: C.white, fontSize: '14px', fontWeight: 700, padding: 0 }}>
          <ChevronLeft style={{ width: '18px', height: '18px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
              <div style={{ width: '12px', height: '5px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
              <div style={{ width: '12px', height: '5px', backgroundColor: C.pink, borderRadius: '1px' }} />
              <div style={{ width: '12px', height: '5px', backgroundColor: C.cream, borderRadius: '1px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900 }}>Aviato</span>
          </div>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: C.cream, fontSize: '13px' }}>
          <span style={{ fontWeight: 700 }}>{findLoc(fromCode).city}</span>
          <ArrowRight style={{ width: '14px', height: '14px', color: C.g400 }} />
          <span style={{ fontWeight: 700 }}>{findLoc(toCode).city}</span>
          <span style={{ color: C.g400 }}>·</span>
          <span>{fmtDate(departDate)}{isRT ? ` – ${fmtDate(returnDate)}` : ''}</span>
          <span style={{ color: C.g400 }}>·</span>
          <span>{passengers} pax</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setDark(!dark)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? <Sun style={{ width: '16px', height: '16px', color: C.cream }} /> : <Moon style={{ width: '16px', height: '16px', color: '#fff' }} />}
          </button>
          <button onClick={goBack} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', backgroundColor: 'transparent', color: C.cream, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search style={{ width: '13px', height: '13px' }} /> New Search
          </button>
        </div>
      </div>

      {/* RT tabs */}
      {isRT && (
        <div style={{ display: 'flex', backgroundColor: t.bgAlt, borderBottom: `1px solid ${t.cardBorder}`, maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setViewingReturn(false)} style={{ flex: 1, padding: '14px', border: 'none', borderBottom: !viewingReturn ? `3px solid ${C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: !viewingReturn ? (dark ? C.cream : C.darkGreen) : t.textMuted }}>
            Outbound · {fmtDate(departDate)}
          </button>
          <button onClick={() => setViewingReturn(true)} style={{ flex: 1, padding: '14px', border: 'none', borderBottom: viewingReturn ? `3px solid ${C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: viewingReturn ? (dark ? C.cream : C.darkGreen) : t.textMuted }}>
            Return · {fmtDate(returnDate)}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'cheapest', 'fastest'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', borderRadius: '100px', border: 'none', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', backgroundColor: filter === f ? t.filterActive : t.filterInactive, color: filter === f ? t.filterActiveText : t.filterInactiveText,
              transition: 'background-color 0.2s ease, color 0.2s ease',
            }}>
              {f === 'all' ? 'All Flights' : f === 'cheapest' ? 'Cheapest' : 'Fastest'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '13px', color: t.textMuted, fontWeight: 600 }}>{flights.length} flights found</span>
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: '800px', margin: '0 auto 8px', padding: '0 40px' }}>
        <div style={{ padding: '10px 14px', backgroundColor: t.disclaimerBg, borderRadius: '10px', border: `1px solid ${t.disclaimerBorder}`, fontSize: '11px', color: t.disclaimerText, lineHeight: 1.4 }}>
          Prices & schedules are estimates and may not reflect real-time availability. Always confirm details on the airline&apos;s website before booking.
        </div>
      </div>

      {/* Flight list */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8px 40px 60px' }}>
        {flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textMuted }}>
            <Plane style={{ width: '48px', height: '48px', color: t.cardBorder, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: '0 0 6px' }}>No flights for these dates</h3>
            <p style={{ fontSize: '14px', color: t.textMuted, margin: '0 0 24px' }}>Try different dates or explore nearby airports.</p>
            <button onClick={goBack} style={{ padding: '14px 32px', border: 'none', borderRadius: '12px', backgroundColor: dark ? C.darkGreen : C.black, color: C.cream, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Back to Search
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flights.map(fl => {
              const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
              const rating = WING_RATINGS[fl.airline];
              const wingColor = rating ? WING_COLORS[rating.wings] : t.textMuted;
              return (
                <button key={fl.id} onClick={() => setSelectedFlight(fl)}
                  style={{
                    width: '100%', backgroundColor: t.card, borderRadius: '14px', padding: '20px 24px',
                    border: `1px solid ${t.cardBorder}`, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '20px',
                    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${t.hoverShadow}`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  {/* Airline badge */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, fontSize: '12px', fontWeight: 900, flexShrink: 0 }}>{style.label}</div>

                  {/* Airline + rating */}
                  <div style={{ width: '100px', flexShrink: 0 }}>
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

                  {/* Times */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
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

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', width: '120px', flexShrink: 0 }}>
                    {rating && rating.badges.slice(0, 2).map(b => (
                      <span key={b} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '100px', backgroundColor: dark ? '#1A3A2E' : C.cream, color: dark ? C.cream : C.darkGreen, fontWeight: 600 }}>
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
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: t.text }}>${fl.price}</div>
                    <div style={{ fontSize: '10px', color: fl.seats <= 3 ? C.pink : t.textMuted, fontWeight: 600 }}>{fl.seats} seats left</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail slide-over */}
      {selectedFlight && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', zIndex: 99 }} onClick={() => setSelectedFlight(null)} />
          <DetailPanel fl={selectedFlight} onClose={() => setSelectedFlight(null)} />
        </>
      )}
    </div>
  );
}

export default function DesktopResultsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: '16px', color: '#9B9B93' }}>Loading flights...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
