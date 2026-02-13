'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Users, ChevronDown, ChevronLeft, ChevronRight,
  ArrowLeftRight, ArrowRight, Plane, X, Check, Search, Clock,
  Wifi, Coffee, Wine, Heart, Globe, ExternalLink, Sun, Moon
} from 'lucide-react';

import { C, AIRLINE_STYLE } from '../data/constants';
import { LOCATIONS, expandCode, findLoc } from '../data/locations';
import { getMetroAreaFlights, getRouteDates } from '../data/flights';
import { EVENTS, shiftDate } from '../data/events';
import { getValidDestinations } from '../data/helpers';

// Theme context
const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

// Theme colors
const T = (dark: boolean) => ({
  bg: dark ? '#0D0D0D' : '#FFFFFF',
  bgAlt: dark ? '#1A1A1A' : '#FAFAF7',
  card: dark ? '#1A1A1A' : '#FFFFFF',
  cardBorder: dark ? '#2A2A2A' : '#E5E5E0',
  text: dark ? '#F5F0E1' : '#000000',
  textSec: dark ? '#9B9B93' : '#6B6B63',
  textMuted: dark ? '#6B6B63' : '#9B9B93',
  inputBg: dark ? '#252525' : '#FFFFFF',
  inputBorder: dark ? '#333' : '#E5E5E0',
  searchBg: dark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.97)',
  heroBg: dark ? '#000' : '#000',
});

// Hero images (user should add these to public/images/)
const HERO_IMAGES = [
  { src: '/images/hero-beach.jpg', caption: 'The good life awaits', location: 'Palm Beach, FL' },
  { src: '/images/hero-boat.jpg', caption: 'Arrive in style', location: 'Mediterranean' },
  { src: '/images/hero-island.jpg', caption: 'Your island escape', location: 'Caribbean' },
  { src: '/images/hero-ski.jpg', caption: 'Mountain luxury', location: 'Aspen, CO' },
  { src: '/images/hero-villa.jpg', caption: 'Live beautifully', location: 'Lake Como' },
  { src: '/images/hero-jet.jpg', caption: 'Skip the terminal', location: 'Scottsdale, AZ' },
  { src: '/images/hero-coast.jpg', caption: 'Coastal elegance', location: 'Bahamas' },
  { src: '/images/hero-dining.jpg', caption: 'Taste the world', location: 'Capri, Italy' },
  { src: '/images/hero-apres.jpg', caption: 'After the slopes', location: 'Squaw Valley, CA' },
];

// Airport Input (Hopper-style clean)
const DesktopAirportInput = ({ value, onChange, placeholder, excludeCode, filterByFrom, label }: {
  value: string; onChange: (code: string) => void; placeholder: string;
  excludeCode?: string; filterByFrom?: string; label: string;
}) => {
  const { dark } = useTheme();
  const t = T(dark);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const loc = LOCATIONS.find(l => l.code === value);
      if (loc) setDisplayValue(loc.type === 'metro' ? loc.city : `${loc.city} (${loc.code})`);
    } else { setDisplayValue(''); }
  }, [value]);

  const getFiltered = () => {
    const pool = filterByFrom ? getValidDestinations(filterByFrom) : LOCATIONS;
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

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, display: 'block', marginBottom: '6px' }}>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={isOpen ? query : displayValue}
        onFocus={() => { setIsOpen(true); setQuery(''); }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          width: '100%', padding: '14px 16px', border: 'none', borderRadius: 0, fontSize: '15px',
          fontFamily: 'inherit', outline: 'none', backgroundColor: 'transparent', color: t.text, boxSizing: 'border-box',
          fontWeight: 600,
        }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: -1, right: -1, marginTop: '2px', backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`, borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          zIndex: 50, maxHeight: '320px', overflowY: 'auto',
        }}>
          {getFiltered().length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: t.textMuted, fontSize: '13px' }}>No routes available</div>
          ) : getFiltered().map(loc => (
            <button key={loc.code} onMouseDown={(e) => { e.preventDefault(); onChange(loc.code); setIsOpen(false); setQuery(''); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '14px',
                borderBottom: `1px solid ${t.cardBorder}`,
              }}>
              {loc.type === 'metro' ? (
                <>
                  <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${C.darkGreen}, ${C.black})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe style={{ width: '16px', height: '16px', color: C.cream }} />
                  </div>
                  <div><div style={{ fontWeight: 700, color: t.text }}>{loc.city}</div><div style={{ fontSize: '11px', color: t.textMuted }}>{loc.sub}</div></div>
                </>
              ) : (
                <>
                  <div style={{ width: '36px', height: '36px', backgroundColor: dark ? '#252525' : C.cream, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: C.darkGreen, flexShrink: 0 }}>{loc.code}</div>
                  <div><div style={{ fontWeight: 600, color: t.text }}>{loc.city}, {loc.state}</div><div style={{ fontSize: '11px', color: t.textMuted }}>{loc.name}{loc.metro ? ` · ${findLoc(loc.metro).city}` : ''}</div></div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Desktop Calendar (same logic, themed)
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

  const routeFlights = (fromCode && toCode) ? getMetroAreaFlights(fromCode, toCode) : [];
  const routePrices = routeFlights.map(f => f.price);
  const minP = routePrices.length > 0 ? Math.min(...routePrices) : 0;
  const maxP = routePrices.length > 0 ? Math.max(...routePrices) : 0;
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
    return df.length === 0 ? null : Math.min(...df.map(f => f.price));
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
                style={{ padding: '3px 1px', border: 'none', borderRadius: dep ? '8px 0 0 8px' : ret ? '0 8px 8px 0' : inR ? '0' : '8px', backgroundColor: sel ? C.darkGreen : inR ? (dark ? '#1A3A2E' : '#E0F2E1') : 'transparent', cursor: dis ? 'default' : 'pointer', opacity: dis ? 0.25 : 1, textAlign: 'center', minHeight: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: sel ? 800 : 600, color: sel ? '#fff' : t.text }}>{day}</span>
                {price && !dis && <span style={{ fontSize: '9px', fontWeight: 700, color: sel ? C.cream : C.darkGreen, backgroundColor: sel ? 'rgba(255,255,255,0.15)' : getPriceColor(price), borderRadius: '3px', padding: '1px 4px' }}>${price}</span>}
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
      <div style={{ backgroundColor: t.card, borderRadius: '20px', padding: '28px', width: '680px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: t.text }}>{departDate && returnDate ? `${tripDays} night trip` : selectingReturn ? 'Select return date' : 'Select departure'}</h3>
            {tripType === 'roundtrip' && <p style={{ margin: '2px 0 0', fontSize: '12px', color: departDate && returnDate ? C.darkGreen : t.textMuted }}>{departDate && returnDate ? 'Click Done when ready.' : selectingReturn ? 'Pick a date after departure' : 'Pick your departure date'}</p>}
          </div>
          <button onClick={() => { setSelectingReturn(false); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: t.bgAlt }}><X style={{ width: '18px', height: '18px', color: t.textSec }} /></button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', backgroundColor: departDate ? (dark ? '#1A3A2E' : C.cream) : t.bgAlt, border: `2px solid ${!selectingReturn ? C.darkGreen : 'transparent'}` }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: t.textMuted, letterSpacing: '0.08em', marginBottom: '2px' }}>DEPART</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: t.text }}>{departDate ? new Date(departDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '—'}</div>
          </div>
          {tripType === 'roundtrip' && (
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', backgroundColor: returnDate ? (dark ? '#1A3A2E' : C.cream) : t.bgAlt, border: `2px solid ${selectingReturn ? C.darkGreen : 'transparent'}` }}>
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
        <div style={{ display: 'flex', gap: '32px' }}>{renderMonth(viewMonth, viewYear)}{renderMonth(nM, nY)}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${t.cardBorder}` }}>
          {[{ color: '#D4EDDA', label: 'Low' }, { color: '#FFF3CD', label: 'Mid' }, { color: '#F8D7DA', label: 'High' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: l.color }} /><span style={{ fontSize: '11px', color: t.textSec, fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
        {departDate && returnDate && tripType === 'roundtrip' && (
          <button onClick={() => { setSelectingReturn(false); onClose(); }} style={{ width: '100%', marginTop: '16px', padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: C.darkGreen, cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Check style={{ width: '15px', height: '15px' }} /> Done</button>
        )}
      </div>
    </div>
  );
};


// Main Desktop Page
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
  const [heroLoaded, setHeroLoaded] = useState<Record<number, boolean>>({});
  const eventsRef = useRef<HTMLDivElement>(null);

  // Auto-rotate hero
  useEffect(() => {
    const iv = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(iv);
  }, []);

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
    if (eventsRef.current) eventsRef.current.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      <div style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: t.bg, transition: 'background-color 0.3s ease, color 0.3s ease' }}>

        {/* Nav bar */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
              <div style={{ width: '16px', height: '7px', backgroundColor: C.darkGreen, borderRadius: '1.5px' }} />
              <div style={{ width: '16px', height: '7px', backgroundColor: C.pink, borderRadius: '1.5px' }} />
              <div style={{ width: '16px', height: '7px', backgroundColor: C.cream, borderRadius: '1.5px' }} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Aviato</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setDark(!dark)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              {dark ? <Sun style={{ width: '18px', height: '18px', color: C.cream }} /> : <Moon style={{ width: '18px', height: '18px', color: '#fff' }} />}
            </button>
          </div>
        </nav>

        {/* Hero with rotating images */}
        <div style={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
          {/* Image layers */}
          {HERO_IMAGES.map((img, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              backgroundImage: heroLoaded[i] ? `url(${img.src})` : undefined,
              backgroundColor: '#1a1a1a',
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: heroIndex === i ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
            }}>
              {/* Preload images */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" style={{ display: 'none' }} onLoad={() => setHeroLoaded(prev => ({ ...prev, [i]: true }))} />
            </div>
          ))}
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%)' }} />

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              Rediscover what flying is all about.
            </h1>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', margin: '0 0 36px', fontWeight: 500 }}>
              Compare semi-private flights across every carrier.
            </p>

            {/* Hopper-style search bar */}
            <div style={{
              backgroundColor: t.searchBg, borderRadius: '16px', display: 'flex', alignItems: 'stretch',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)', width: '100%', maxWidth: '900px',
              backdropFilter: 'blur(20px)', overflow: 'visible', position: 'relative',
            }}>
              {/* Trip type pills */}
              <div style={{ position: 'absolute', top: '-44px', left: '0', display: 'flex', gap: '4px' }}>
                {['roundtrip', 'oneway'].map(tp => (
                  <button key={tp} onClick={() => { setTripType(tp); if (tp === 'oneway') setReturnDate(''); }}
                    style={{ padding: '8px 18px', border: 'none', borderRadius: '10px 10px 0 0', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: tripType === tp ? t.searchBg : 'rgba(255,255,255,0.1)', color: tripType === tp ? t.text : 'rgba(255,255,255,0.7)', backdropFilter: tripType === tp ? 'blur(20px)' : 'none' }}>
                    {tp === 'roundtrip' ? 'Round Trip' : 'One Way'}
                  </button>
                ))}
              </div>

              {/* From */}
              <div style={{ flex: 1, padding: '12px 0 12px 20px', borderRight: `1px solid ${t.cardBorder}`, position: 'relative' }}>
                <DesktopAirportInput label="Where from" value={fromCode} onChange={(c) => { setFromCode(c); setToCode(''); }} placeholder="City or airport" excludeCode={toCode} />
              </div>

              {/* Swap button */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '0 -16px', zIndex: 5 }}>
                <button onClick={() => { const tmp = fromCode; setFromCode(toCode); setToCode(tmp); }}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${t.cardBorder}`, backgroundColor: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftRight style={{ width: '13px', height: '13px', color: t.textSec }} />
                </button>
              </div>

              {/* To */}
              <div style={{ flex: 1, padding: '12px 0 12px 20px', borderRight: `1px solid ${t.cardBorder}`, position: 'relative' }}>
                <DesktopAirportInput label="Where to" value={toCode} onChange={setToCode} placeholder="Search destination" excludeCode={fromCode} filterByFrom={fromCode} />
              </div>

              {/* Dates */}
              <div style={{ width: '200px', padding: '12px 0 12px 20px', borderRight: `1px solid ${t.cardBorder}`, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => { setSelectingReturn(!!departDate && !returnDate && tripType === 'roundtrip'); setCalOpen(true); }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, display: 'block', marginBottom: '6px' }}>Dates</label>
                <div style={{ fontSize: '15px', fontWeight: 600, color: departDate ? t.text : t.textMuted, padding: '14px 0' }}>
                  {departDate ? `${fmtDate(departDate)}${tripType === 'roundtrip' && returnDate ? ` – ${fmtDate(returnDate)}` : ''}` : 'Add dates'}
                </div>
              </div>

              {/* Guests */}
              <div style={{ width: '120px', padding: '12px 20px', flexShrink: 0 }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, display: 'block', marginBottom: '6px' }}>Guests</label>
                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                  style={{ width: '100%', padding: '14px 0', border: 'none', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: t.text }}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>

              {/* Search button */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 12px 0' }}>
                <button onClick={handleSearch} disabled={!fromCode || !toCode || !departDate}
                  style={{
                    width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                    backgroundColor: !fromCode || !toCode || !departDate ? C.g300 : C.darkGreen,
                    cursor: !fromCode || !toCode || !departDate ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                  }}>
                  <Search style={{ width: '20px', height: '20px', color: '#fff' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Image dots */}
          <div style={{ position: 'absolute', bottom: '20px', right: '48px', zIndex: 10, display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginRight: '6px' }}>{HERO_IMAGES[heroIndex].location}</span>
            {HERO_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setHeroIndex(i)} style={{ width: i === heroIndex ? '20px' : '6px', height: '6px', borderRadius: '3px', border: 'none', backgroundColor: i === heroIndex ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 48px 40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: t.text, margin: '0 0 6px' }}>Popular Routes</h2>
          <p style={{ fontSize: '14px', color: t.textMuted, margin: '0 0 28px' }}>The most-booked semi-private flights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {popularRoutes.map((r, i) => (
              <button key={i} onClick={() => { setFromCode(r.from); setToCode(r.to); setDepartDate(''); setReturnDate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setCalOpen(true), 400); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px',
                  border: `1px solid ${t.cardBorder}`, borderRadius: '14px', backgroundColor: t.card, cursor: 'pointer',
                  textAlign: 'left', transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`;  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: t.text, fontSize: '14px' }}>{r.label}</div>
                  <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '3px' }}>{r.sub}</div>
                </div>
                <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: '17px' }}>${r.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Events - Horizontal Slider */}
        <div style={{ backgroundColor: t.bgAlt, borderTop: `1px solid ${t.cardBorder}`, borderBottom: `1px solid ${t.cardBorder}` }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 48px 52px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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

            <div ref={eventsRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '8px', scrollbarWidth: 'none' }}
              onMouseDown={(e) => {
                const el = e.currentTarget; let startX = e.pageX; let scrollL = el.scrollLeft;
                const move = (ev: MouseEvent) => { el.scrollLeft = scrollL - (ev.pageX - startX); };
                const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
              }}>
              {EVENTS.map(ev => (
                <div key={ev.id} style={{ minWidth: '340px', maxWidth: '340px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.cardBorder}`, backgroundColor: t.card, scrollSnapAlign: 'start', flexShrink: 0, transition: 'box-shadow 0.2s' }}>
                  <div style={{ background: `linear-gradient(135deg, ${C.black} 0%, ${C.darkGreen} 100%)`, padding: '24px', display: 'flex', alignItems: 'center', gap: '14px', minHeight: '90px' }}>
                    <div style={{ fontSize: '40px' }}>{ev.img}</div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{ev.title}</div>
                      <div style={{ fontSize: '12px', color: C.cream, opacity: 0.8, marginTop: '3px' }}>{ev.city}, {ev.state} · {ev.date}</div>
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <p style={{ fontSize: '13px', color: t.textSec, margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: t.textMuted, fontWeight: 600 }}>FLIGHTS FROM</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: C.darkGreen }}>${ev.price}</div>
                      </div>
                      <button onClick={() => {
                        if (ev.from) setFromCode(ev.from);
                        setToCode(ev.dest); setTripType('roundtrip');
                        setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} style={{ padding: '10px 18px', border: 'none', borderRadius: '10px', backgroundColor: dark ? C.darkGreen : C.black, color: C.cream, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plane style={{ width: '13px', height: '13px' }} /> Search Flights
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: dark ? '#0A0A0A' : C.black, padding: '40px 48px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ width: '16px', height: '8px', backgroundColor: C.darkGreen, borderRadius: '1px' }} />
              <div style={{ width: '16px', height: '8px', backgroundColor: C.pink, borderRadius: '1px' }} />
              <div style={{ width: '16px', height: '8px', backgroundColor: C.cream, borderRadius: '1px' }} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>Aviato</div>
          <p style={{ fontSize: '13px', color: C.g400, margin: '0 0 6px' }}>Compare semi-private flights across every carrier.</p>
          <p style={{ fontSize: '11px', color: C.g600, margin: 0 }}>Prices & schedules are estimates. Always confirm on the airline&apos;s website.</p>
        </div>

        <DesktopCalendar isOpen={calOpen} onClose={() => setCalOpen(false)} tripType={tripType} departDate={departDate} returnDate={returnDate} onSelectDepart={setDepartDate} onSelectReturn={setReturnDate} fromCode={fromCode} toCode={toCode} selectingReturn={selectingReturn} setSelectingReturn={setSelectingReturn} />
      </div>
    </ThemeContext.Provider>
  );
}
