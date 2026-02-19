'use client';

import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight,
  ArrowLeftRight, Plane, X, Check, Search, Clock,
  Globe, Sun, Moon
} from 'lucide-react';

import { C, AIRLINE_STYLE } from '../data/constants';
import { LOCATIONS, expandCode, findLoc } from '../data/locations';
import { getMetroAreaFlights, getRouteDates } from '../data/flights';
import { EVENTS, shiftDate } from '../data/events';
import { getValidDestinations, getValidOrigins } from '../data/helpers';

// Theme context
const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

// Theme colors
const T = (dark: boolean) => ({
  bg: dark ? '#161616' : '#FFFCF2',
  bgAlt: dark ? '#1E1E1E' : '#FFFFFF',
  card: dark ? '#1E1E1E' : '#FFFFFF',
  cardBorder: dark ? '#2D2D2D' : '#E5E5E0',
  accent: dark ? '#E8576D' : '#0A3D2E',
  text: dark ? '#F5F0E1' : '#1A1A1A',
  textSec: dark ? '#9B9B93' : '#6B6B63',
  textMuted: dark ? '#6B6B63' : '#9B9B93',
  searchBg: dark ? 'rgba(26,26,26,0.97)' : 'rgba(255,255,255,0.98)',
  divider: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
});

// Hero images
const HERO_IMAGES = [
  { src: '/images/hero-dinner.jpg' },
  { src: '/images/hero-ski.jpeg' },
  { src: '/images/hero-poolside.jpg' },
  { src: '/images/hero-plane.jpg' },
  { src: '/images/hero-diving2.jpg' },
  { src: '/images/hero-beachlounge2.jpg' },
  { src: '/images/hero-amphicar2.jpg' },
  { src: '/images/hero-skibar.jpeg' },
];

/* ────────────────────────────────────────────
   Animated Counter Hook
   ──────────────────────────────────────────── */
const useCountUp = (end: number, duration = 1800) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.unobserve(el); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return { count, ref, started };
};

/* ────────────────────────────────────────────
   Scroll Reveal Hook
   ──────────────────────────────────────────── */
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

const revealStyle = (isVisible: boolean, delay = 0): React.CSSProperties => ({
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
  transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
});

/* ────────────────────────────────────────────
   Airport Field — full-featured with typing,
   live dropdown, clear button
   ──────────────────────────────────────────── */
const AirportDropdown = ({ dark, t, filtered, onChange, setIsOpen, setQuery, pos }: {
  dark: boolean; t: ReturnType<typeof T>; filtered: typeof LOCATIONS; onChange: (code: string) => void;
  setIsOpen: (v: boolean) => void; setQuery: (v: string) => void; pos: { top: number; left: number };
}) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div data-airport-dropdown="true" style={{
      position: 'fixed', top: pos.top, left: pos.left, width: '340px', maxWidth: 'calc(100vw - 32px)',
      backgroundColor: dark ? '#1A1A1A' : '#fff',
      borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      zIndex: 99999, maxHeight: '360px', overflowY: 'auto',
      border: `1px solid ${dark ? '#2A2A2A' : '#E5E5E0'}`,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    }}>
      {filtered.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: '13px' }}>
          No matching locations
        </div>
      ) : filtered.map(loc => (
        <button key={loc.code} onMouseDown={(e) => { e.preventDefault(); onChange(loc.code); setIsOpen(false); setQuery(''); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
            border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '14px',
            borderBottom: `1px solid ${t.divider}`, transition: 'background-color 0.1s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = dark ? '#252525' : '#F7F7F5'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          {loc.type === 'metro' ? (
            <>
              <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${C.darkGreen}, ${C.black})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe style={{ width: '16px', height: '16px', color: C.cream }} />
              </div>
              <div><div style={{ fontWeight: 700, color: t.text }}>{loc.city}</div><div style={{ fontSize: '11px', color: t.textMuted, marginTop: '1px' }}>{loc.sub}</div></div>
            </>
          ) : (
            <>
              <div style={{ width: '36px', height: '36px', backgroundColor: dark ? '#252525' : C.cream, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: C.darkGreen, flexShrink: 0 }}>{loc.code}</div>
              <div><div style={{ fontWeight: 600, color: t.text }}>{loc.city}, {loc.state}</div><div style={{ fontSize: '11px', color: t.textMuted, marginTop: '1px' }}>{loc.name}{loc.metro ? ` · ${findLoc(loc.metro).city}` : ''}</div></div>
            </>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
};

const AirportField = ({ value, onChange, placeholder, excludeCode, filterByFrom, filterByTo, label }: {
  value: string; onChange: (code: string) => void; placeholder: string;
  excludeCode?: string; filterByFrom?: string; filterByTo?: string; label: string;
}) => {
  const { dark } = useTheme();
  const t = T(dark);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePos = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 12, left: rect.left - 16 });
    }
  }, []);

  // Close dropdown only on main page scroll, not dropdown internal scroll
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // Ignore scrolls inside the portal dropdown (zIndex 99999)
      if (target && target.closest && target.closest('[data-airport-dropdown]')) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const loc = LOCATIONS.find(l => l.code === value);
      if (loc) setDisplayValue(loc.type === 'metro' ? loc.city : `${loc.city} (${loc.code})`);
    } else { setDisplayValue(''); }
  }, [value]);

  const getFiltered = () => {
    const pool = filterByFrom ? getValidDestinations(filterByFrom) : filterByTo ? getValidOrigins(filterByTo) : LOCATIONS;
    return pool.filter(loc => {
      if (excludeCode) {
        if (loc.code === excludeCode) return false;
        if (loc.type === 'metro' && loc.airports && expandCode(excludeCode).some(c => loc.airports!.includes(c))) return false;
        if (loc.type === 'airport' && loc.metro && loc.metro === excludeCode) return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      const aliases: Record<string, string[]> = {
        'LA': ['la', 'los angeles', 'hollywood', 'burbank', 'van nuys', 'santa monica'],
        'NYC': ['nyc', 'new york', 'manhattan', 'white plains', 'teterboro'],
        'SFL': ['south florida', 'miami', 'fort lauderdale', 'palm beach', 'west palm'],
      };
      return loc.city.toLowerCase().includes(q) || loc.code.toLowerCase().includes(q) ||
        loc.name?.toLowerCase().includes(q) || loc.sub?.toLowerCase().includes(q) ||
        aliases[loc.code]?.some(a => a.includes(q));
    }).slice(0, 20);
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setDisplayValue('');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '2px', letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? query : displayValue}
          onFocus={() => { updatePos(); setIsOpen(true); setQuery(''); }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          style={{
            flex: 1, width: '100%', padding: 0, border: 'none', fontSize: '16px',
            fontFamily: 'inherit', outline: 'none', backgroundColor: 'transparent',
            color: displayValue && !isOpen ? t.text : t.textSec, fontWeight: 500,
          }}
        />
        {value && !isOpen && (
          <button onClick={clearValue} style={{
            width: '20px', height: '20px', borderRadius: '50%', border: 'none',
            backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, padding: 0,
          }}>
            <X style={{ width: '11px', height: '11px', color: t.textMuted }} />
          </button>
        )}
      </div>

      {isOpen && <AirportDropdown dark={dark} t={t} filtered={getFiltered()} onChange={onChange} setIsOpen={setIsOpen} setQuery={setQuery} pos={pos} />}
    </div>
  );
};

/* ────────────────────────────────────────────
   Desktop Calendar
   ──────────────────────────────────────────── */
const DesktopCalendar = ({ isOpen, onClose, tripType, departDate, returnDate, onSelectDepart, onSelectReturn, fromCode, toCode, selectingReturn, setSelectingReturn }: {
  isOpen: boolean; onClose: () => void; tripType: string; departDate: string; returnDate: string;
  onSelectDepart: (d: string) => void; onSelectReturn: (d: string) => void;
  fromCode: string; toCode: string; selectingReturn: boolean; setSelectingReturn: (v: boolean) => void;
}) => {
  const { dark } = useTheme();
  const t = T(dark);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [calMobile, setCalMobile] = useState(false);
  useEffect(() => {
    const check = () => setCalMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const routeFlights = (fromCode && toCode) ? getMetroAreaFlights(fromCode, toCode) : [];
  const routePrices = routeFlights.map(f => f.price);
  const minP = routePrices.length > 0 ? routePrices.reduce((a, b) => a < b ? a : b) : 0;
  const maxP = routePrices.length > 0 ? routePrices.reduce((a, b) => a > b ? a : b) : 0;
  const range = maxP - minP;
  const routeDates = (fromCode && toCode) ? getRouteDates(fromCode, toCode) : null;

  useEffect(() => {
    if (isOpen && routeDates && routeDates.length > 0) {
      const fd = new Date(routeDates[0] + 'T12:00:00');
      setViewMonth(fd.getMonth()); setViewYear(fd.getFullYear());
    }
  }, [isOpen, fromCode, toCode]);

  const getPriceForDate = (ds: string) => {
    if (!fromCode || !toCode) return null;
    if (routeDates && !routeDates.includes(ds)) return null;
    const df = getMetroAreaFlights(fromCode, toCode, ds);
    return df.length === 0 ? null : df.map(f => f.price).reduce((a, b) => a < b ? a : b);
  };
  const getPriceColor = (p: number | null) => {
    if (!p) return 'transparent';
    if (range === 0) return '#D4EDDA';
    const pct = (p - minP) / range;
    return pct < 0.35 ? '#D4EDDA' : pct < 0.7 ? '#FFF3CD' : '#F8D7DA';
  };

  const getDays = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirst = (m: number, y: number) => new Date(y, m, 1).getDay();
  const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const isPast = (ds: string) => { const d = new Date(ds + 'T12:00:00'); const n = new Date(); n.setHours(0,0,0,0); return d < n; };
  const isBefore = (ds: string) => selectingReturn && !!departDate && ds <= departDate;

  const handleDate = (ds: string) => {
    if (isPast(ds)) return;
    if (tripType === 'oneway') { onSelectDepart(ds); onClose(); return; }
    if (!selectingReturn) { onSelectDepart(ds); onSelectReturn(''); setSelectingReturn(true); }
    else { if (ds <= departDate) { onSelectDepart(ds); onSelectReturn(''); } else { onSelectReturn(ds); } }
  };

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  if (!isOpen) return null;

  const renderMonth = (m: number, y: number) => {
    const days = getDays(m, y); const first = getFirst(m, y);
    const cells: (number | null)[] = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
    return (
      <div style={{ flex: 1 }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px', color: t.text, marginBottom: '12px' }}>{mNames[m]} {y}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: t.textMuted, padding: '4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const past = isPast(ds); const dep = ds === departDate; const ret = ds === returnDate;
            const sel = dep || ret; const inR = departDate && returnDate && tripType === 'roundtrip' && ds > departDate && ds < returnDate;
            const price = !past ? getPriceForDate(ds) : null;
            const noFl = routeDates ? !routeDates.includes(ds) : false;
            const dis = past || isBefore(ds) || noFl;
            return (
              <button key={ds} onClick={() => !dis && handleDate(ds)} disabled={dis}
                style={{ padding: '3px 1px', border: 'none', borderRadius: dep ? '8px 0 0 8px' : ret ? '0 8px 8px 0' : inR ? '0' : '8px', backgroundColor: sel ? (dark ? C.pink : C.darkGreen) : inR ? (dark ? '#3D1520' : '#E0F2E1') : 'transparent', cursor: dis ? 'default' : 'pointer', opacity: dis ? 0.25 : 1, textAlign: 'center', minHeight: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: sel ? 800 : 600, color: sel ? '#fff' : t.text }}>{day}</span>
                {price && !dis && <span style={{ fontSize: '9px', fontWeight: 700, color: sel ? C.cream : (dark ? C.pink : C.darkGreen), backgroundColor: sel ? 'rgba(255,255,255,0.15)' : getPriceColor(price), borderRadius: '3px', padding: '1px 4px' }}>${price}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nM = viewMonth === 11 ? 0 : viewMonth + 1;
  const nY = viewMonth === 11 ? viewYear + 1 : viewYear;
  const tripDays = departDate && returnDate ? Math.round((new Date(returnDate + 'T12:00:00').getTime() - new Date(departDate + 'T12:00:00').getTime()) / 86400000) : 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) { setSelectingReturn(false); onClose(); } }}>
      <div style={{ backgroundColor: dark ? '#1A1A1A' : '#fff', borderRadius: calMobile ? '20px 20px 0 0' : '20px', padding: calMobile ? '20px 16px' : '28px', width: calMobile ? '100%' : '680px', maxHeight: calMobile ? '90vh' : '85vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', ...(calMobile ? { position: 'fixed' as const, bottom: 0, left: 0, right: 0 } : {}) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: t.text }}>{departDate && returnDate ? `${tripDays} night trip` : selectingReturn ? 'Select return date' : 'Select departure'}</h3>
            {tripType === 'roundtrip' && <p style={{ margin: '2px 0 0', fontSize: '12px', color: departDate && returnDate ? (dark ? C.pink : C.darkGreen) : t.textMuted }}>{departDate && returnDate ? 'Click Done when ready.' : selectingReturn ? 'Pick a date after departure' : 'Pick your departure date'}</p>}
          </div>
          <button onClick={() => { setSelectingReturn(false); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: t.bgAlt }}><X style={{ width: '18px', height: '18px', color: t.textSec }} /></button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', backgroundColor: departDate ? (dark ? '#1A3A2E' : C.cream) : t.bgAlt, border: `2px solid ${!selectingReturn ? (dark ? C.pink : C.darkGreen) : 'transparent'}` }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.08em', marginBottom: '2px' }}>DEPART</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: t.text }}>{departDate ? new Date(departDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '—'}</div>
          </div>
          {tripType === 'roundtrip' && (
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', backgroundColor: returnDate ? (dark ? '#1A3A2E' : C.cream) : t.bgAlt, border: `2px solid ${selectingReturn ? (dark ? C.pink : C.darkGreen) : 'transparent'}` }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.08em', marginBottom: '2px' }}>RETURN</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: t.text }}>{returnDate ? new Date(returnDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '—'}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: t.bgAlt }}><ChevronLeft style={{ width: '18px', height: '18px', color: t.textSec }} /></button>
          <div style={{ flex: 1 }} />
          <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: t.bgAlt }}><ChevronRight style={{ width: '18px', height: '18px', color: t.textSec }} /></button>
        </div>
        <div style={{ display: 'flex', gap: calMobile ? '0px' : '32px' }}>
          {renderMonth(viewMonth, viewYear)}
          {!calMobile && renderMonth(nM, nY)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${t.cardBorder}` }}>
          {[{ color: '#D4EDDA', label: 'Low' }, { color: '#FFF3CD', label: 'Mid' }, { color: '#F8D7DA', label: 'High' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: l.color }} /><span style={{ fontSize: '11px', color: t.textSec, fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
        {departDate && returnDate && tripType === 'roundtrip' && (
          <button onClick={() => { setSelectingReturn(false); onClose(); }} style={{ width: '100%', marginTop: '16px', padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: dark ? C.pink : C.darkGreen, cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Check style={{ width: '15px', height: '15px' }} /> Done</button>
        )}
      </div>
    </div>
  );
};


/* ════════════════════════════════════════════
   Main Desktop Page
   ════════════════════════════════════════════ */
export default function DesktopPage() {
  const router = useRouter();
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState('roundtrip');
  const [calOpen, setCalOpen] = useState(false);
  const [selectingReturn, setSelectingReturn] = useState(false);
  const [dark, setDark] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Parallax mouse tracking for hero
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const handleHeroMouse = useCallback((e: React.MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x, y });
  }, []);

  const eventsRef = useRef<HTMLDivElement>(null);
  const [eventCat, setEventCat] = useState('All');
  const [upcoming, setUpcoming] = useState(false);

  // Unique event categories
  const EVENT_CATS = ['All', ...Array.from(new Set(EVENTS.map(ev => ev.cat)))];

  // Filtered events: upcoming (next 6 months) + category
  const filteredEvents = (() => {
    let evs = EVENTS;

    if (upcoming) {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() + 6);
      evs = evs.filter(ev => {
        const start = new Date(ev.start + 'T12:00:00');
        return start >= now && start <= cutoff;
      });
      evs = [...evs].sort((a, b) => a.start.localeCompare(b.start));
    }

    if (eventCat !== 'All') evs = evs.filter(ev => ev.cat === eventCat);
    return evs;
  })();

  // Reset scroll when filters change
  useEffect(() => {
    if (eventsRef.current) eventsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
  }, [eventCat, upcoming]);

  // Detect mobile
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    const iv = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(iv);
  }, []);

  // Scroll reveal for sections
  const routesReveal = useScrollReveal(0.1);
  const eventsReveal = useScrollReveal(0.1);
  const footerReveal = useScrollReveal(0.2);
  const statsReveal = useScrollReveal(0.2);

  // Animated stat counters
  const statFlights = useCountUp(8000, 2000);
  const statAirlines = useCountUp(5, 1500);
  const statRoutes = useCountUp(84, 1800);
  const statAirports = useCountUp(30, 1800);

  const t = T(dark);
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  const handleSearch = () => {
    if (!fromCode || !toCode || !departDate) return;
    const params = new URLSearchParams({ from: fromCode, to: toCode, depart: departDate, pax: String(passengers), trip: tripType, theme: dark ? 'dark' : 'light' });
    if (returnDate) params.set('return', returnDate);
    router.push(`/desktop/results?${params.toString()}`);
  };

  const popularRoutes = [
    { from: 'LA', to: 'LAS', label: 'Los Angeles → Las Vegas', sub: 'JSX + Aero · 8+ daily flights', price: 139 },
    { from: 'NYC', to: 'SFL', label: 'New York → South Florida', sub: 'JSX + Slate · Multiple daily', price: 289 },
    { from: 'NYC', to: 'ACK', label: 'New York → Nantucket', sub: 'Tradewind direct', price: 545 },
    { from: 'LA', to: 'SJD', label: 'Los Angeles → Cabo', sub: 'JSX + Aero', price: 349 },
    { from: 'LA', to: 'ASE', label: 'Los Angeles → Aspen', sub: 'Aero direct', price: 1950 },
    { from: 'DAL', to: 'HOU', label: 'Dallas → Houston', sub: 'JSX · 3 daily', price: 99 },
  ];

  const scrollEvents = (dir: number) => {
    const el = eventsRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= maxScroll - 10) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (dir === -1 && el.scrollLeft <= 10) {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: dir * 380, behavior: 'smooth' });
    }
  };

  /* ════════════════════════════════════════════
     MOBILE LAYOUT — early return for screens < 768px
     ════════════════════════════════════════════ */
  if (mounted && isMobile) {
    return (
      <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
        <style>{`
          .aviato-mobile, .aviato-mobile *, .aviato-mobile *::before, .aviato-mobile *::after {
            transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease !important;
          }
          .aviato-mobile img { transition: none !important; }
          .aviato-mobile [data-hero-slide] { transition: opacity 1.8s ease-in-out !important; }
          .aviato-mobile ::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="aviato-mobile" style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg }}>

          {/* ── Mobile Hero ── */}
          <div style={{ position: 'relative', height: '55vh', overflow: 'hidden' }}>
            {/* Background images */}
            {HERO_IMAGES.map((img, i) => (
              <div key={i} data-hero-slide="true" style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${img.src})`, backgroundColor: '#111',
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: heroIndex === i ? 1 : 0,
              }} />
            ))}
            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)', zIndex: 1 }} />

            {/* Logo + toggle bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ width: '16px', height: '6px', backgroundColor: C.darkGreen, borderRadius: '1.5px' }} />
                  <div style={{ width: '16px', height: '6px', backgroundColor: C.pink, borderRadius: '1.5px' }} />
                  <div style={{ width: '16px', height: '6px', backgroundColor: C.cream, borderRadius: '1.5px' }} />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Aviato</span>
              </div>
              <button onClick={() => setDark(!dark)} style={{
                width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {dark ? <Sun style={{ width: '18px', height: '18px', color: '#fff' }} /> : <Moon style={{ width: '18px', height: '18px', color: '#fff' }} />}
              </button>
            </div>

            {/* Hero text — bottom of hero */}
            <div style={{ position: 'absolute', bottom: '40px', left: '20px', right: '20px', zIndex: 10 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Rediscover what flying is all about.
              </h1>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Compare semi-private flights across every carrier.
              </p>
            </div>

            {/* Dots — bottom right */}
            <div style={{ position: 'absolute', bottom: '12px', right: '20px', zIndex: 10, display: 'flex', gap: '5px' }}>
              {HERO_IMAGES.map((_, i) => (
                <div key={i} style={{ width: i === heroIndex ? '14px' : '5px', height: '5px', borderRadius: '3px', backgroundColor: i === heroIndex ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease' }} />
              ))}
            </div>
          </div>

          {/* ── Mobile Search Card ── */}
          <div style={{ padding: '0 16px', marginTop: '-24px', position: 'relative', zIndex: 30 }}>
            <div style={{
              backgroundColor: t.card, borderRadius: '16px', padding: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${t.cardBorder}`,
            }}>
              {/* Trip type toggle */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', backgroundColor: dark ? '#252525' : '#F5F3ED', borderRadius: '10px', padding: '3px' }}>
                {[{ key: 'roundtrip', label: 'Round trip' }, { key: 'oneway', label: 'One way' }].map(opt => (
                  <button key={opt.key} onClick={() => { setTripType(opt.key); if (opt.key === 'oneway') setReturnDate(''); }}
                    style={{
                      flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      backgroundColor: tripType === opt.key ? (dark ? '#333' : '#fff') : 'transparent',
                      color: tripType === opt.key ? t.text : t.textMuted,
                      boxShadow: tripType === opt.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >{opt.label}</button>
                ))}
              </div>

              {/* From field */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.divider}` }}>
                <AirportField label="Where from" value={fromCode} onChange={setFromCode} placeholder="City or airport" excludeCode={toCode} filterByTo={toCode} />
              </div>

              {/* Swap button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-14px 14px -14px 0', position: 'relative', zIndex: 5 }}>
                <button onClick={() => { const tmp = fromCode; setFromCode(toCode); setToCode(tmp); }}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1.5px solid ${t.divider}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftRight style={{ width: '11px', height: '11px', color: t.textMuted }} />
                </button>
              </div>

              {/* To field */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.divider}` }}>
                <AirportField label="Where to" value={toCode} onChange={setToCode} placeholder="Search destination" excludeCode={fromCode} filterByFrom={fromCode} />
              </div>

              {/* Dates + Guests row */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${t.divider}` }}>
                <div style={{ flex: 1, padding: '12px 14px', cursor: 'pointer', borderRight: `1px solid ${t.divider}` }}
                  onClick={() => { setSelectingReturn(!!departDate && !returnDate && tripType === 'roundtrip'); setCalOpen(true); }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '2px' }}>Dates</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: departDate ? t.text : t.textSec }}>
                    {departDate ? `${fmtDate(departDate)}${tripType === 'roundtrip' && returnDate ? ` – ${fmtDate(returnDate)}` : ''}` : 'Add dates'}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', minWidth: '100px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '2px' }}>Guests</div>
                  <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                    style={{ border: 'none', fontSize: '16px', fontWeight: 500, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: t.text, padding: 0 }}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <button onClick={handleSearch} disabled={!fromCode || !toCode || !departDate}
                style={{
                  width: '100%', marginTop: '14px', padding: '14px', border: 'none', borderRadius: '12px',
                  backgroundColor: !fromCode || !toCode || !departDate ? (dark ? '#333' : '#ccc') : (dark ? C.pink : C.darkGreen),
                  cursor: !fromCode || !toCode || !departDate ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '15px', fontWeight: 700, color: '#fff',
                }}>
                <Search style={{ width: '17px', height: '17px' }} /> Search Flights
              </button>
            </div>
          </div>

          {/* ── Mobile Popular Routes ── */}
          <div style={{ padding: '28px 16px 24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 4px' }}>Popular Routes</h2>
            <p style={{ fontSize: '13px', color: t.textMuted, margin: '0 0 16px' }}>The most-booked semi-private flights</p>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {popularRoutes.map((r, i) => (
                <button key={i} onClick={() => { setFromCode(r.from); setToCode(r.to); setDepartDate(''); setReturnDate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setCalOpen(true), 400); }}
                  style={{
                    minWidth: '240px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    border: `1px solid ${t.cardBorder}`, borderRadius: '12px', backgroundColor: t.card, cursor: 'pointer',
                    textAlign: 'left', flexShrink: 0, scrollSnapAlign: 'start',
                  }}>
                  <div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: '13px' }}>{r.label}</div>
                    <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>{r.sub}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: dark ? C.pink : C.darkGreen, fontSize: '15px', marginLeft: '12px', flexShrink: 0 }}>${r.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Mobile Events ── */}
          <div style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
            <div style={{ padding: '28px 16px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 4px' }}>Upcoming Events</h2>
                  <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>Events worth flying for</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => scrollEvents(-1)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft style={{ width: '16px', height: '16px', color: t.textSec }} />
                  </button>
                  <button onClick={() => scrollEvents(1)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight style={{ width: '16px', height: '16px', color: t.textSec }} />
                  </button>
                </div>
              </div>

              {/* Filter pills — single row: Upcoming + categories */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                <button onClick={() => setUpcoming(!upcoming)} style={{
                  padding: '6px 12px', borderRadius: '16px', flexShrink: 0,
                  border: `1.5px solid ${upcoming ? (dark ? C.pink : C.darkGreen) : t.cardBorder}`,
                  backgroundColor: upcoming ? (dark ? 'rgba(232,87,109,0.12)' : 'rgba(10,61,46,0.08)') : 'transparent',
                  color: upcoming ? (dark ? C.pink : C.darkGreen) : t.textSec,
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                }}>Upcoming</button>
                <div style={{ width: '1px', backgroundColor: t.cardBorder, margin: '4px 2px', flexShrink: 0 }} />
                {EVENT_CATS.map(cat => (
                  <button key={cat} onClick={() => setEventCat(cat)} style={{
                    padding: '6px 12px', borderRadius: '16px', flexShrink: 0,
                    border: `1.5px solid ${eventCat === cat ? (dark ? C.pink : C.darkGreen) : t.cardBorder}`,
                    backgroundColor: eventCat === cat ? (dark ? C.pink : C.darkGreen) : 'transparent',
                    color: eventCat === cat ? '#fff' : t.textSec,
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}>{cat}</button>
                ))}
              </div>

              {/* Event cards — horizontal scroll */}
              {filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: t.textMuted }}>
                  <Clock style={{ width: '28px', height: '28px', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: t.textSec }}>No events found</p>
                  <p style={{ fontSize: '12px', margin: 0 }}>Try different filters.</p>
                </div>
              ) : (
                <div ref={eventsRef} style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {filteredEvents.map(ev => (
                    <div key={ev.id} style={{
                      minWidth: '260px', maxWidth: '260px', borderRadius: '14px', overflow: 'hidden',
                      border: `1px solid ${t.cardBorder}`, backgroundColor: t.card,
                      scrollSnapAlign: 'start', flexShrink: 0, cursor: 'pointer',
                    }}
                      onClick={() => {
                        if (ev.from) setFromCode(ev.from);
                        setToCode(ev.dest); setTripType('roundtrip');
                        setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {/* Photo */}
                      <div style={{
                        height: '140px', position: 'relative',
                        backgroundImage: ev.photo ? `url(${ev.photo})` : `linear-gradient(135deg, ${C.black} 0%, ${C.darkGreen} 100%)`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                      }}>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', fontSize: '10px', fontWeight: 700, color: '#fff' }}>{ev.cat}</div>
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', fontSize: '12px', fontWeight: 800, color: '#fff' }}>From ${ev.price}</div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: t.text, marginBottom: '3px', lineHeight: 1.3 }}>{ev.title}</div>
                        <div style={{ fontSize: '11px', color: dark ? C.pink : C.darkGreen, fontWeight: 600, marginBottom: '6px' }}>
                          {ev.city}, {ev.state} · {ev.date}
                        </div>
                        <p style={{ fontSize: '12px', color: t.textSec, margin: '0 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.desc}</p>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          if (ev.from) setFromCode(ev.from);
                          setToCode(ev.dest); setTripType('roundtrip');
                          setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} style={{
                          width: '100%', padding: '9px', border: 'none', borderRadius: '8px',
                          backgroundColor: dark ? C.pink : C.black, color: '#fff',
                          fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        }}>
                          <Plane style={{ width: '12px', height: '12px' }} /> Search Flights
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile Footer ── */}
          <div style={{ background: dark ? '#0A0A0A' : C.black, padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ width: '14px', height: '6px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
                <div style={{ width: '14px', height: '6px', backgroundColor: C.pink, borderRadius: '1px' }} />
                <div style={{ width: '14px', height: '6px', backgroundColor: C.cream, borderRadius: '1px' }} />
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>Aviato</div>
            <p style={{ fontSize: '11px', color: C.g400, margin: '0 0 4px' }}>Compare semi-private flights across every carrier.</p>
            <p style={{ fontSize: '10px', color: C.g600, margin: 0 }}>Prices & schedules are estimates.</p>
          </div>

          {/* Mobile Calendar — single month, full-screen */}
          <DesktopCalendar isOpen={calOpen} onClose={() => setCalOpen(false)} tripType={tripType} departDate={departDate} returnDate={returnDate} onSelectDepart={setDepartDate} onSelectReturn={setReturnDate} fromCode={fromCode} toCode={toCode} selectingReturn={selectingReturn} setSelectingReturn={setSelectingReturn} />
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      {/* Global smooth theme transition — applied to root so EVERYTHING transitions together */}
      <style>{`
        .aviato-desktop {
          transition: background-color 0.5s ease, color 0.5s ease !important;
        }
        .aviato-desktop [data-hero-slide] {
          will-change: transform, opacity;
        }
      `}</style>
      <div className="aviato-desktop" style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg, scrollBehavior: 'smooth' }}>

        {/* ========== HERO — inset rounded card like Hopper ========== */}
        <div style={{ padding: '16px 16px 0 16px' }}>
          <div ref={heroRef} onMouseMove={handleHeroMouse} onMouseLeave={() => setParallax({ x: 0, y: 0 })} style={{ position: 'relative', height: 'calc(100vh - 32px)', borderRadius: '20px', overflow: 'hidden' }}>

            {/* ── Logo — inside hero frame, top-left (Hopper-sized) ── */}
            <div style={{
              position: 'absolute', top: '36px', left: '40px', zIndex: 20,
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ width: '22px', height: '9px', backgroundColor: C.darkGreen, borderRadius: '2px' }} />
                <div style={{ width: '22px', height: '9px', backgroundColor: C.pink, borderRadius: '2px' }} />
                <div style={{ width: '22px', height: '9px', backgroundColor: C.cream, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Aviato</span>
            </div>

            {/* ── Theme toggle — inside hero frame, top-right (Hopper-sized) ── */}
            <button onClick={() => setDark(!dark)} style={{
              position: 'absolute', top: '36px', right: '40px', zIndex: 20,
              width: '48px', height: '48px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? <Sun style={{ width: '22px', height: '22px', color: '#fff' }} /> : <Moon style={{ width: '22px', height: '22px', color: '#fff' }} />}
            </button>

            {/* Rotating background images with parallax */}
            {HERO_IMAGES.map((img, i) => (
              <div key={i} data-hero-slide="true" style={{
                position: 'absolute', inset: '-20px',
                backgroundImage: `url(${img.src})`,
                backgroundColor: '#111',
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: heroIndex === i ? 1 : 0,
                transform: `translate(${parallax.x * -12}px, ${parallax.y * -8}px) scale(1.04)`,
                transition: `opacity 1.8s ease-in-out, transform 0.4s ease-out`,
                willChange: 'transform, opacity',
              }} />
            ))}

            {/* Full-hero soft vignette — darkest at center where text sits, eases out to edges */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 100% at 50% 55%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 70%, transparent 100%)', zIndex: 1 }} />

            {/* ─── Hero content: tagline + search ─── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '40px' }}>

              {/* Tagline text with soft radial backdrop */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{
                  fontSize: '48px', fontWeight: 800, color: '#fff', margin: '0 0 16px',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                  Rediscover what flying is all about
                </h1>
                <p style={{
                  fontSize: '21px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: 0,
                  letterSpacing: '0.02em',
                }}>
                  Compare semi-private flights across every carrier.
                </p>
              </div>

              {/* Trip type toggle — Round Trip / One Way */}
              <div style={{
                display: 'flex', gap: '4px', marginBottom: '12px',
                backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '3px',
                backdropFilter: 'blur(12px)',
              }}>
                {[{ key: 'roundtrip', label: 'Round trip' }, { key: 'oneway', label: 'One way' }].map(opt => (
                  <button key={opt.key}
                    onClick={() => { setTripType(opt.key); if (opt.key === 'oneway') setReturnDate(''); }}
                    style={{
                      padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '13px',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                      backgroundColor: tripType === opt.key ? 'rgba(255,255,255,0.95)' : 'transparent',
                      color: tripType === opt.key ? '#1A1A1A' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div style={{
                backgroundColor: t.searchBg,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                width: '860px',
                maxWidth: '90vw',
                minHeight: '76px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(24px)',
                overflow: 'visible',
                position: 'relative',
              }}>

                {/* Where from */}
                <div style={{ flex: 1.2, padding: '14px 24px', borderRight: `1px solid ${t.divider}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                  <AirportField label="Where from" value={fromCode} onChange={setFromCode} placeholder="City or airport" excludeCode={toCode} filterByTo={toCode} />
                </div>

                {/* Swap button */}
                <div style={{ margin: '0 -14px', zIndex: 5, display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => { const tmp = fromCode; setFromCode(toCode); setToCode(tmp); }}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', border: `1.5px solid ${t.divider}`, backgroundColor: t.searchBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'rotate(180deg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)'; }}
                  >
                    <ArrowLeftRight style={{ width: '12px', height: '12px', color: t.textMuted }} />
                  </button>
                </div>

                {/* Where to */}
                <div style={{ flex: 1.2, padding: '14px 24px', borderRight: `1px solid ${t.divider}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                  <AirportField label="Where to" value={toCode} onChange={setToCode} placeholder="Search destination" excludeCode={fromCode} filterByFrom={fromCode} />
                </div>

                {/* Dates */}
                <div style={{ padding: '14px 20px', borderRight: `1px solid ${t.divider}`, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '150px' }}
                  onClick={() => { setSelectingReturn(!!departDate && !returnDate && tripType === 'roundtrip'); setCalOpen(true); }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '2px', letterSpacing: '0.02em' }}>Dates</div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: departDate ? t.text : t.textSec }}>
                    {departDate ? `${fmtDate(departDate)}${tripType === 'roundtrip' && returnDate ? ` – ${fmtDate(returnDate)}` : ''}` : 'Add dates'}
                  </div>
                </div>

                {/* Guests */}
                <div style={{ padding: '14px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '110px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '2px', letterSpacing: '0.02em' }}>Guests</div>
                  <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                    style={{ border: 'none', fontSize: '15px', fontWeight: 500, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: t.text, padding: 0 }}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                {/* Search button */}
                <div style={{ padding: '0 12px 0 0', display: 'flex', alignItems: 'center' }}>
                  <button onClick={handleSearch} disabled={!fromCode || !toCode || !departDate}
                    style={{
                      width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                      backgroundColor: !fromCode || !toCode || !departDate ? 'rgba(150,150,150,0.4)' : (dark ? C.pink : C.darkGreen),
                      cursor: !fromCode || !toCode || !departDate ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: fromCode && toCode && departDate ? '0 4px 16px rgba(10,61,46,0.35)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (fromCode && toCode && departDate) (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  >
                    <Search style={{ width: '20px', height: '20px', color: '#fff' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dots indicator — bottom right */}
            <div style={{ position: 'absolute', bottom: '24px', right: '32px', zIndex: 10, display: 'flex', gap: '6px', alignItems: 'center' }}>
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroIndex(i)} style={{ width: i === heroIndex ? '18px' : '6px', height: '6px', borderRadius: '3px', border: 'none', backgroundColor: i === heroIndex ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
              ))}
            </div>
          </div>
        </div>

        {/* ========== Stats Counter ========== */}
        <div ref={statsReveal.ref} style={{
          maxWidth: '900px', margin: '0 auto', padding: '48px 48px 16px',
          display: 'flex', justifyContent: 'center', gap: '64px',
          ...revealStyle(statsReveal.isVisible, 0),
        }}>
          {[
            { counter: statFlights, suffix: '+', label: 'Flights Tracked', ref: statFlights.ref },
            { counter: statAirlines, suffix: '', label: 'Partner Airlines', ref: statAirlines.ref },
            { counter: statRoutes, suffix: '+', label: 'Routes Covered', ref: statRoutes.ref },
            { counter: statAirports, suffix: '+', label: 'Airports', ref: statAirports.ref },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', ...revealStyle(statsReveal.isVisible, 0.1 + i * 0.12) }}>
              <span ref={stat.ref} style={{
                fontSize: '42px', fontWeight: 900, letterSpacing: '-0.03em',
                color: dark ? C.pink : C.darkGreen,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stat.counter.count}{stat.suffix}
              </span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: t.textMuted, marginTop: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ========== Popular Routes ========== */}
        <div ref={routesReveal.ref} style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 48px 40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: t.text, margin: '0 0 6px', ...revealStyle(routesReveal.isVisible, 0) }}>Popular Routes</h2>
          <p style={{ fontSize: '14px', color: t.textMuted, margin: '0 0 28px', ...revealStyle(routesReveal.isVisible, 0.1) }}>The most-booked semi-private flights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {popularRoutes.map((r, i) => (
              <button key={i} onClick={() => { setFromCode(r.from); setToCode(r.to); setDepartDate(''); setReturnDate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setCalOpen(true), 400); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px',
                  border: `1px solid ${t.cardBorder}`, borderRadius: '14px', backgroundColor: t.card, cursor: 'pointer',
                  textAlign: 'left', transition: 'box-shadow 0.2s ease, transform 0.2s ease, opacity 0.6s ease',
                  ...revealStyle(routesReveal.isVisible, 0.15 + i * 0.06),
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`;  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: t.text, fontSize: '14px' }}>{r.label}</div>
                  <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '3px' }}>{r.sub}</div>
                </div>
                <div style={{ fontWeight: 800, color: dark ? C.pink : C.darkGreen, fontSize: '17px' }}>${r.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ========== Events Slider ========== */}
        <div ref={eventsReveal.ref} style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 48px 52px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', ...revealStyle(eventsReveal.isVisible, 0) }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: t.text, margin: '0 0 6px' }}>Upcoming Events</h2>
                <p style={{ fontSize: '14px', color: t.textMuted, margin: 0 }}>Events worth flying semi-private for</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => scrollEvents(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft style={{ width: '18px', height: '18px', color: t.textSec }} />
                </button>
                <button onClick={() => scrollEvents(1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight style={{ width: '18px', height: '18px', color: t.textSec }} />
                </button>
              </div>
            </div>

            {/* Filter pills — single row: Upcoming + categories */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', ...revealStyle(eventsReveal.isVisible, 0.15) }}>
              <button onClick={() => setUpcoming(!upcoming)} style={{
                padding: '7px 16px', borderRadius: '20px',
                border: `1.5px solid ${upcoming ? (dark ? C.pink : C.darkGreen) : t.cardBorder}`,
                backgroundColor: upcoming ? (dark ? 'rgba(232,87,109,0.12)' : 'rgba(10,61,46,0.08)') : 'transparent',
                color: upcoming ? (dark ? C.pink : C.darkGreen) : t.textSec,
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
              }}>Upcoming</button>
              <div style={{ width: '1px', height: '20px', backgroundColor: t.cardBorder, flexShrink: 0 }} />
              {EVENT_CATS.map(cat => (
                <button key={cat} onClick={() => setEventCat(cat)} style={{
                  padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${eventCat === cat ? (dark ? C.pink : C.darkGreen) : t.cardBorder}`,
                  backgroundColor: eventCat === cat ? (dark ? C.pink : C.darkGreen) : 'transparent',
                  color: eventCat === cat ? '#fff' : t.textSec,
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: t.textMuted }}>
                <Clock style={{ width: '36px', height: '36px', marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: t.textSec }}>No events found</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your date or category filters.</p>
              </div>
            ) : null}
            <div ref={eventsRef} style={{ display: filteredEvents.length === 0 ? 'none' : 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '8px', scrollbarWidth: 'none', ...revealStyle(eventsReveal.isVisible, 0.25) }}
              onMouseDown={(e) => {
                const el = e.currentTarget; let startX = e.pageX; let scrollL = el.scrollLeft;
                const move = (ev: MouseEvent) => { el.scrollLeft = scrollL - (ev.pageX - startX); };
                const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
              }}>
              {filteredEvents.map(ev => (
                <div key={ev.id} style={{
                  minWidth: '320px', maxWidth: '320px', borderRadius: '16px', overflow: 'hidden',
                  border: `1px solid ${t.cardBorder}`, backgroundColor: t.card,
                  scrollSnapAlign: 'start', flexShrink: 0, cursor: 'pointer',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}` ; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  onClick={() => {
                    if (ev.from) setFromCode(ev.from);
                    setToCode(ev.dest); setTripType('roundtrip');
                    setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {/* Photo */}
                  <div style={{
                    height: '180px', position: 'relative',
                    backgroundImage: ev.photo ? `url(${ev.photo})` : `linear-gradient(135deg, ${C.black} 0%, ${C.darkGreen} 100%)`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    {/* Category badge */}
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px',
                      padding: '4px 10px', borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                      fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
                    }}>
                      {ev.cat}
                    </div>
                    {/* Price badge */}
                    <div style={{
                      position: 'absolute', bottom: '12px', right: '12px',
                      padding: '4px 10px', borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                      fontSize: '13px', fontWeight: 800, color: '#fff',
                    }}>
                      From ${ev.price}
                    </div>
                    {!ev.photo && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '48px' }}>{ev.img}</div>}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: t.text, marginBottom: '4px', lineHeight: 1.3 }}>{ev.title}</div>
                    <div style={{ fontSize: '12px', color: dark ? C.pink : C.darkGreen, fontWeight: 600, marginBottom: '8px' }}>
                      {ev.city}, {ev.state} · {ev.date}
                    </div>
                    <p style={{ fontSize: '13px', color: t.textSec, margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        if (ev.from) setFromCode(ev.from);
                        setToCode(ev.dest); setTripType('roundtrip');
                        setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        backgroundColor: dark ? C.pink : C.black, color: '#fff',
                        fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}>
                        <Plane style={{ width: '13px', height: '13px' }} /> Search Flights
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== Footer ========== */}
        <div ref={footerReveal.ref} style={{ background: dark ? '#0A0A0A' : C.black, padding: '40px 48px', textAlign: 'center', ...revealStyle(footerReveal.isVisible, 0) }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ width: '16px', height: '8px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
              <div style={{ width: '16px', height: '8px', backgroundColor: C.pink, borderRadius: '1px' }} />
              <div style={{ width: '16px', height: '8px', backgroundColor: C.cream, borderRadius: '1px' }} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>Aviato</div>
          <p style={{ fontSize: '13px', color: C.g400, margin: '0 0 6px' }}>Search and compare semi-private flights across every carrier.</p>
          <p style={{ fontSize: '11px', color: C.g600, margin: '0 0 16px' }}>Prices & schedules are estimates. Always confirm on the airline&apos;s website.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <a href="/desktop/terms" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.g400; }}
            >Terms of Service</a>
            <a href="/desktop/privacy" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.g400; }}
            >Privacy Policy</a>
            <a href="mailto:aviatoair@gmail.com" style={{ fontSize: '12px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.g400; }}
            >Contact Us</a>
          </div>
        </div>

        <DesktopCalendar isOpen={calOpen} onClose={() => setCalOpen(false)} tripType={tripType} departDate={departDate} returnDate={returnDate} onSelectDepart={setDepartDate} onSelectReturn={setReturnDate} fromCode={fromCode} toCode={toCode} selectingReturn={selectingReturn} setSelectingReturn={setSelectingReturn} />
      </div>
    </ThemeContext.Provider>
  );
}
