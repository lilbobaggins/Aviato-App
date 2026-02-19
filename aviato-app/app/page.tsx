'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, MapPin, Calendar, Users, ChevronRight, ChevronDown, ChevronLeft,
  Clock, Plane, Check, Share2, Star, ArrowRight, ArrowLeftRight,
  Wifi, Coffee, Wine, X, Home, Compass, ExternalLink,
  TrendingDown, Globe, Building2, Timer, Briefcase, Sparkles, Heart, Shield
} from 'lucide-react';

import { C, AIRLINE_STYLE, AIRLINE_BOOKING, WING_RATINGS, BADGE_CONFIG, WING_COLORS } from './data/constants';
import { LOCATIONS, expandCode, findLoc } from './data/locations';
import { FLIGHTS, getMetroAreaFlights, getRouteDates } from './data/flights';
import { EVENTS, shiftDate } from './data/events';
import { getValidDestinations, getValidOrigins } from './data/helpers';
import { generateDeepLink, getDeepLinkNote } from './data/deeplinks';
import type { Flight, Location } from './data/types';

// Wing SVG icon
const WingIcon = ({ size = 14, color = '#0A3D2E' }: { size?: number; color?: string }) => (
  <svg width={size} height={Math.round(size * 0.8)} viewBox="0 0 24 19" fill={color}>
    <path d="M2 17C5 11 10 6 16 4c2.5-0.8 4.5-0.5 6 1s1.5 4-0.5 7c-3 4-8 5.5-12 5C6.5 16.5 4 15 2 17z" />
  </svg>
);

// Badge icon renderer
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

// Airport Input Component
const AirportInput = ({ label, value, onChange, placeholder, excludeCode, filterByFrom, filterByTo }: {
  label: string; value: string; onChange: (code: string) => void; placeholder: string;
  excludeCode?: string; filterByFrom?: string; filterByTo?: string;
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const loc = LOCATIONS.find(l => l.code === value);
      if (loc) setDisplayValue(loc.type === 'metro' ? loc.city : `${loc.city} (${loc.code})`);
    } else { setDisplayValue(''); }
  }, [value]);

  const getFilteredLocations = () => {
    const pool = filterByFrom ? getValidDestinations(filterByFrom) : filterByTo ? getValidOrigins(filterByTo) : LOCATIONS;
    return pool.filter(loc => {
      if (excludeCode) {
        if (loc.code === excludeCode) return false;
        if (loc.type === 'metro' && loc.airports && expandCode(excludeCode).some(c => loc.airports!.includes(c))) return false;
        if (loc.type === 'airport' && loc.metro && loc.metro === excludeCode) return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      const matchCity = loc.city.toLowerCase().includes(q);
      const matchCode = loc.code.toLowerCase().includes(q);
      const matchName = loc.name?.toLowerCase().includes(q);
      const matchSub = loc.sub?.toLowerCase().includes(q);
      const aliases: Record<string, string[]> = {
        'LA': ['la', 'los angeles', 'hollywood', 'burbank', 'van nuys', 'santa monica'],
        'NYC': ['nyc', 'new york', 'manhattan', 'white plains', 'teterboro'],
        'SFL': ['south florida', 'miami', 'fort lauderdale', 'palm beach', 'west palm'],
      };
      const matchAlias = aliases[loc.code]?.some(a => a.includes(q));
      return matchCity || matchCode || matchName || matchSub || matchAlias;
    }).slice(0, 30);
  };

  const filtered = getFilteredLocations();

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ color: C.g600, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <MapPin style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: C.g400 }} />
        <input
          type="text"
          placeholder={placeholder}
          value={isOpen ? query : displayValue}
          onFocus={() => { setIsOpen(true); setQuery(''); }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          style={{ width: '100%', paddingLeft: '42px', paddingRight: '16px', paddingTop: '13px', paddingBottom: '13px', border: `1.5px solid ${isOpen ? C.darkGreen : C.g200}`, borderRadius: '12px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', backgroundColor: C.white, color: C.black, boxSizing: 'border-box' }}
        />
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: C.white, border: `1px solid ${C.g200}`, borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 50, maxHeight: '340px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: C.g400, fontSize: '14px' }}>No routes available</div>
          ) : filtered.map(loc => (
            <button key={loc.code} onMouseDown={(e) => { e.preventDefault(); onChange(loc.code); setIsOpen(false); setQuery(''); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '14px', borderBottom: `1px solid ${C.g100}` }}>
              {loc.type === 'metro' ? (
                <>
                  <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${C.darkGreen}, ${C.black})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe style={{ width: '18px', height: '18px', color: C.cream }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.black }}>{loc.city}</div>
                    <div style={{ fontSize: '11px', color: C.g400 }}>{loc.sub}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: '40px', height: '40px', backgroundColor: C.cream, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: C.darkGreen, flexShrink: 0 }}>{loc.code}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: C.black }}>{loc.city}, {loc.state}</div>
                    <div style={{ fontSize: '11px', color: C.g400 }}>{loc.name}{loc.metro ? ` · ${findLoc(loc.metro).city}` : ''}</div>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Calendar Picker
const CalendarPicker = ({ isOpen, onClose, tripType, departDate, returnDate, onSelectDepart, onSelectReturn, fromCode, toCode, selectingReturn, setSelectingReturn }: {
  isOpen: boolean; onClose: () => void; tripType: string; departDate: string; returnDate: string;
  onSelectDepart: (d: string) => void; onSelectReturn: (d: string) => void;
  fromCode: string; toCode: string; selectingReturn: boolean; setSelectingReturn: (v: boolean) => void;
}) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Compute route-specific price range from actual flight data
  const routeFlights = (fromCode && toCode) ? getMetroAreaFlights(fromCode, toCode) : [];
  const routePrices = routeFlights.map(f => f.price);
  const minRoutePrice = routePrices.length > 0 ? routePrices.reduce((a, b) => a < b ? a : b) : 0;
  const maxRoutePrice = routePrices.length > 0 ? routePrices.reduce((a, b) => a > b ? a : b) : 0;
  const priceRange = maxRoutePrice - minRoutePrice;

  // Check if this route only operates on specific dates (seasonal/event flights)
  const routeDates = (fromCode && toCode) ? getRouteDates(fromCode, toCode) : null;

  // Auto-navigate to the month of the first available date for seasonal routes
  useEffect(() => {
    if (isOpen && routeDates && routeDates.length > 0) {
      const firstDate = new Date(routeDates[0] + 'T12:00:00');
      setViewMonth(firstDate.getMonth());
      setViewYear(firstDate.getFullYear());
    }
  }, [isOpen, fromCode, toCode]);

  const getPriceForDate = (dateStr: string) => {
    if (!fromCode || !toCode) return null;
    // If route is seasonal, only show prices on operating dates
    if (routeDates && !routeDates.includes(dateStr)) return null;
    // Get flights that actually operate on this specific date
    const dateFlights = getMetroAreaFlights(fromCode, toCode, dateStr);
    if (dateFlights.length === 0) return null;
    // Show the cheapest available flight for this date
    return dateFlights.map(f => f.price).reduce((a, b) => a < b ? a : b);
  };

  const getPriceColor = (price: number | null) => {
    if (!price) return 'transparent';
    if (priceRange === 0) return '#D4EDDA';
    const pct = (price - minRoutePrice) / priceRange;
    if (pct < 0.35) return '#D4EDDA';
    if (pct < 0.7) return '#FFF3CD';
    return '#F8D7DA';
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();
  const formatMonthYear = (m: number, y: number) => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[m]} ${y}`;
  };

  const isDepart = (dateStr: string) => dateStr === departDate;
  const isReturn = (dateStr: string) => dateStr === returnDate;
  const isInRange = (dateStr: string) => {
    if (!departDate || !returnDate || tripType === 'oneway') return false;
    return dateStr > departDate && dateStr < returnDate;
  };
  const isPast = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };
  const isBeforeDepart = (dateStr: string) => selectingReturn && !!departDate && dateStr <= departDate;

  const handleDateClick = (dateStr: string) => {
    if (isPast(dateStr)) return;
    if (tripType === 'oneway') { onSelectDepart(dateStr); onClose(); return; }
    if (!selectingReturn) {
      onSelectDepart(dateStr); onSelectReturn(''); setSelectingReturn(true);
    } else {
      if (dateStr <= departDate) { onSelectDepart(dateStr); onSelectReturn(''); }
      else { onSelectReturn(dateStr); }
    }
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  if (!isOpen) return null;

  const days = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDay(viewMonth, viewYear);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const tripDays = departDate && returnDate ? Math.round((new Date(returnDate + 'T12:00:00').getTime() - new Date(departDate + 'T12:00:00').getTime()) / 86400000) : 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '430px', backgroundColor: C.white, borderRadius: '28px 28px 0 0', padding: '24px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.black }}>
              {departDate && returnDate ? `${tripDays} night trip` : selectingReturn ? 'Select return date' : 'Select departure date'}
            </h3>
            {tripType === 'roundtrip' && (
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: departDate && returnDate ? C.darkGreen : C.g400 }}>
                {departDate && returnDate ? 'Looks great! Tap Done when ready.' : selectingReturn ? 'Tap a date after your departure' : 'Tap your departure date first'}
              </p>
            )}
          </div>
          <button onClick={() => { setSelectingReturn(false); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: C.g100 }}>
            <X style={{ width: '18px', height: '18px', color: C.g600 }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <div style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', backgroundColor: departDate ? C.cream : C.g100, border: `2.5px solid ${!selectingReturn ? C.darkGreen : 'transparent'}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.08em', marginBottom: '2px' }}>DEPART</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: C.black }}>{departDate ? new Date(departDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '—'}</div>
          </div>
          {tripType === 'roundtrip' && (
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', backgroundColor: returnDate ? C.cream : C.g100, border: `2.5px solid ${selectingReturn ? C.darkGreen : 'transparent'}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.08em', marginBottom: '2px' }}>RETURN</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: C.black }}>{returnDate ? new Date(returnDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '—'}</div>
            </div>
          )}
        </div>

        {tripDays > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '100px', backgroundColor: C.cream, fontSize: '12px', fontWeight: 700, color: C.darkGreen }}>{tripDays} night{tripDays !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '50%', backgroundColor: C.g100 }}><ChevronLeft style={{ width: '20px', height: '20px', color: C.g600 }} /></button>
          <span style={{ fontWeight: 800, fontSize: '17px', color: C.black }}>{formatMonthYear(viewMonth, viewYear)}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '50%', backgroundColor: C.g100 }}><ChevronRight style={{ width: '20px', height: '20px', color: C.g600 }} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: C.g400, padding: '6px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const past = isPast(dateStr);
            const dep = isDepart(dateStr);
            const ret = isReturn(dateStr);
            const selected = dep || ret;
            const inRange = isInRange(dateStr);
            const price = !past ? getPriceForDate(dateStr) : null;
            const noFlights = routeDates ? !routeDates.includes(dateStr) : false;
            const disabled = past || isBeforeDepart(dateStr) || noFlights;

            return (
              <button key={dateStr} onClick={() => !disabled && handleDateClick(dateStr)} disabled={disabled}
                style={{ padding: '4px 2px', border: 'none', borderRadius: dep ? '12px 0 0 12px' : ret ? '0 12px 12px 0' : inRange ? '0' : '12px', backgroundColor: selected ? C.darkGreen : inRange ? '#E0F2E1' : 'transparent', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.25 : 1, textAlign: 'center', minHeight: '62px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <span style={{ fontSize: '16px', fontWeight: selected ? 800 : 600, color: selected ? C.white : C.black }}>{day}</span>
                {price && !disabled && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: selected ? C.cream : C.darkGreen, backgroundColor: selected ? 'rgba(255,255,255,0.15)' : getPriceColor(price), borderRadius: '4px', padding: '2px 5px', lineHeight: 1 }}>
                    ${price}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.g100}` }}>
          {[{ color: '#D4EDDA', label: 'Low' }, { color: '#FFF3CD', label: 'Mid' }, { color: '#F8D7DA', label: 'High' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: l.color }} />
              <span style={{ fontSize: '11px', color: C.g600, fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {departDate && returnDate && tripType === 'roundtrip' && (
          <button onClick={() => { setSelectingReturn(false); onClose(); }}
            style={{ width: '100%', marginTop: '16px', padding: '16px', border: 'none', borderRadius: '14px', backgroundColor: C.black, cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check style={{ width: '16px', height: '16px' }} /> Done
          </button>
        )}

        {(departDate || returnDate) && (
          <button onClick={() => { onSelectDepart(''); onSelectReturn(''); setSelectingReturn(false); }}
            style={{ width: '100%', marginTop: '10px', padding: '14px', border: `1.5px solid ${C.g200}`, borderRadius: '14px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: C.pink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <X style={{ width: '15px', height: '15px' }} /> Reset dates
          </button>
        )}
      </div>
    </div>
  );
};

// Main App
export default function AviatoApp() {
  const [screen, setScreen] = useState('home');
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState('roundtrip');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [airlineFilter, setAirlineFilter] = useState<string | null>(null);
  const [viewingReturn, setViewingReturn] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectingReturn, setSelectingReturn] = useState(false);
  const [redirectAirline, setRedirectAirline] = useState<string | null>(null);
  const [redirectFlight, setRedirectFlight] = useState<Flight | null>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);
  const phoneContentRef = useRef<HTMLDivElement>(null);

  const sortFlights = (flights: Flight[], f: string) => {
    if (f === 'cheapest') return [...flights].sort((a, b) => a.price - b.price);
    if (f === 'fastest') return [...flights].sort((a, b) => parseInt(a.dur) - parseInt(b.dur));
    if (f === 'rated') return [...flights].sort((a, b) => (WING_RATINGS[b.airline]?.wings || 0) - (WING_RATINGS[a.airline]?.wings || 0));
    return flights;
  };

  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  const popularRoutes = [
    { from: 'LA', to: 'LAS', label: 'Los Angeles → Las Vegas', sub: 'JSX + Aero · 8+ daily flights · from $139', price: 139 },
    { from: 'NYC', to: 'SFL', label: 'New York → South Florida', sub: 'JSX + Slate · from $289', price: 289 },
    { from: 'NYC', to: 'ACK', label: 'New York → Nantucket', sub: 'Tradewind direct · from $545', price: 545 },
    { from: 'LA', to: 'SJD', label: 'Los Angeles → Cabo', sub: 'JSX + Aero · from $349', price: 349 },
    { from: 'LA', to: 'ASE', label: 'Los Angeles → Aspen', sub: 'Aero direct · from $1,950', price: 1950 },
    { from: 'DAL', to: 'HOU', label: 'Dallas → Houston', sub: 'JSX · 3 daily · from $99', price: 99 },
    { from: 'LA', to: 'SCF', label: 'Los Angeles → Scottsdale', sub: 'JSX daily · from $179', price: 179 },
    { from: 'SJU', to: 'SBH', label: 'San Juan → St. Barths', sub: 'Tradewind · 50 min · from $335', price: 335 },
  ];

  // HOME SCREEN
  const HomeScreen = () => (
    <div style={{ width: '100%', minHeight: '100%', backgroundColor: C.offWhite, paddingBottom: '80px' }}>
      <div style={{ background: `linear-gradient(180deg, ${C.black} 0%, ${C.darkGreen} 100%)`, padding: '28px 24px 36px', color: C.white }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ width: '22px', height: '12px', backgroundColor: C.darkGreen, borderRadius: '2px' }} />
              <div style={{ width: '22px', height: '12px', backgroundColor: C.pink, borderRadius: '2px' }} />
              <div style={{ width: '22px', height: '12px', backgroundColor: C.cream, borderRadius: '2px' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Aviato</h1>
          <p style={{ color: C.cream, fontSize: '13px', marginTop: '4px', opacity: 0.85, fontWeight: 700 }}>Rediscover what flying is all about.</p>
          <p style={{ color: C.pink, fontSize: '14px', fontWeight: 600, marginTop: '10px', letterSpacing: '0.01em', lineHeight: 1.3 }}>Compare semi-private flights<br />across every carrier.</p>
        </div>

        <div ref={searchCardRef} style={{ backgroundColor: C.white, borderRadius: '20px', padding: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '18px', backgroundColor: C.g100, borderRadius: '10px', padding: '3px' }}>
            {['roundtrip', 'oneway'].map(t => (
              <button key={t} onClick={() => { setTripType(t); if (t === 'oneway') setReturnDate(''); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: tripType === t ? C.black : 'transparent', color: tripType === t ? C.white : C.g600 }}>
                {t === 'roundtrip' ? 'Round Trip' : 'One Way'}
              </button>
            ))}
          </div>

          <AirportInput label="FROM" value={fromCode} onChange={setFromCode} placeholder="City or airport" excludeCode={toCode} filterByTo={toCode} />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 2px' }}>
            <button onClick={() => { const t = fromCode; setFromCode(toCode); setToCode(t); }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1.5px solid ${C.g200}`, backgroundColor: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <ArrowLeftRight style={{ width: '14px', height: '14px', color: C.g600, transform: 'rotate(90deg)' }} />
            </button>
          </div>

          <AirportInput label="TO" value={toCode} onChange={setToCode} placeholder="Where to?" excludeCode={fromCode} filterByFrom={fromCode} />

          <div style={{ marginTop: '16px' }}>
            <label style={{ color: C.g600, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              {tripType === 'roundtrip' ? 'DATES' : 'DATE'}
            </label>
            <button onClick={() => { setSelectingReturn(!!departDate && !returnDate && tripType === 'roundtrip'); setCalOpen(true); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 14px', border: `1.5px solid ${C.g200}`, borderRadius: '12px', backgroundColor: C.white, cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: departDate ? C.black : C.g400, fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <Calendar style={{ width: '16px', height: '16px', color: C.g400, flexShrink: 0 }} />
              {departDate ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtDate(departDate)}</span>
                  {tripType === 'roundtrip' && (
                    <>
                      <ArrowRight style={{ width: '14px', height: '14px', color: C.g400, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, whiteSpace: 'nowrap', color: returnDate ? C.black : C.pink }}>
                        {returnDate ? fmtDate(returnDate) : 'Return?'}
                      </span>
                    </>
                  )}
                </div>
              ) : <span style={{ flex: 1 }}>Select dates</span>}
            </button>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ color: C.g600, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>PASSENGERS</label>
            <div style={{ position: 'relative' }}>
              <Users style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: C.g400 }} />
              <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                style={{ width: '100%', paddingLeft: '42px', paddingRight: '40px', paddingTop: '13px', paddingBottom: '13px', border: `1.5px solid ${C.g200}`, borderRadius: '12px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', backgroundColor: C.white, color: C.black, boxSizing: 'border-box' }}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>)}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '14px', top: '13px', width: '16px', height: '16px', color: C.g400, pointerEvents: 'none' }} />
            </div>
          </div>

          <button
            onClick={() => { if (fromCode && toCode && departDate) { setSelectedFlight(null); setViewingReturn(false); setSelectedReturn(null); setRedirectFlight(null); setAirlineFilter(null); setFilter('all'); setScreen('results'); setActiveTab('home'); } }}
            disabled={!fromCode || !toCode || !departDate}
            style={{ width: '100%', marginTop: '18px', padding: '16px', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: !fromCode || !toCode || !departDate ? 'not-allowed' : 'pointer', color: C.cream, backgroundColor: C.black, opacity: !fromCode || !toCode || !departDate ? 0.4 : 1 }}>
            Search Flights
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.black, margin: '0 0 14px' }}>Popular Routes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {popularRoutes.map((r, i) => (
            <button key={i} onClick={() => { setFromCode(r.from); setToCode(r.to); setDepartDate(''); setReturnDate(''); setSelectingReturn(false); setTimeout(() => { searchCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => setCalOpen(true), 400); }, 50); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${C.g200}`, borderRadius: '14px', backgroundColor: C.white, cursor: 'pointer', textAlign: 'left' }}>
              <div>
                <div style={{ fontWeight: 700, color: C.black, fontSize: '14px' }}>{r.label}</div>
                <div style={{ fontSize: '11px', color: C.g400, marginTop: '2px' }}>{r.sub}</div>
              </div>
              <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: '15px' }}>${r.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '24px 24px 32px' }}>
        <a href="/desktop/terms" style={{ fontSize: '11px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Terms</a>
        <a href="/desktop/privacy" style={{ fontSize: '11px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Privacy</a>
        <a href="mailto:aviatoair@gmail.com" style={{ fontSize: '11px', color: C.g400, textDecoration: 'none', fontWeight: 500 }}>Contact</a>
      </div>
    </div>
  );

  // RESULTS SCREEN
  const ResultsScreen = () => {
    const rawOutFlights = getMetroAreaFlights(fromCode, toCode, departDate);
    const rawRetFlights = getMetroAreaFlights(toCode, fromCode, returnDate);
    const outFiltered = airlineFilter ? rawOutFlights.filter(f => f.airline === airlineFilter) : rawOutFlights;
    const retFiltered = airlineFilter ? rawRetFlights.filter(f => f.airline === airlineFilter) : rawRetFlights;
    const outFlights = sortFlights(outFiltered, filter);
    const retFlights = sortFlights(retFiltered, filter);
    const isRT = tripType === 'roundtrip' && !!returnDate;
    const flights = viewingReturn ? retFlights : outFlights;
    const rawFlights = viewingReturn ? rawRetFlights : rawOutFlights;
    const availableAirlines = [...new Set(rawFlights.map(f => f.airline))].sort();

    return (
      <div style={{ width: '100%', minHeight: '100%', backgroundColor: C.offWhite, paddingBottom: '80px' }}>
        <div style={{ background: C.black, padding: '16px 24px 20px', color: C.white }}>
          <button onClick={() => { if (viewingReturn) setViewingReturn(false); else setScreen('home'); }}
            style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: '4px 0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <ChevronLeft style={{ width: '18px', height: '18px' }} /> Back
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
            {findLoc(viewingReturn ? toCode : fromCode).city} → {findLoc(viewingReturn ? fromCode : toCode).city}
          </h1>
          <p style={{ color: C.cream, fontSize: '12px', margin: '2px 0 0', opacity: 0.8 }}>{fmtDate(viewingReturn ? returnDate : departDate)} · {passengers} pax · {flights.length} flights found</p>
        </div>

        {isRT && (
          <div style={{ display: 'flex', backgroundColor: C.white, borderBottom: `1px solid ${C.g200}` }}>
            <button onClick={() => setViewingReturn(false)} style={{ flex: 1, padding: '12px', border: 'none', borderBottom: !viewingReturn ? `3px solid ${C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '12px', color: !viewingReturn ? C.darkGreen : C.g400 }}>
              Outbound {selectedFlight && <span style={{ color: C.pink }}> ✓</span>}
            </button>
            <button onClick={() => { if (selectedFlight) setViewingReturn(true); }} style={{ flex: 1, padding: '12px', border: 'none', borderBottom: viewingReturn ? `3px solid ${C.darkGreen}` : '3px solid transparent', backgroundColor: 'transparent', cursor: selectedFlight ? 'pointer' : 'default', fontWeight: 700, fontSize: '12px', color: viewingReturn ? C.darkGreen : C.g400, opacity: selectedFlight ? 1 : 0.5 }}>
              Return {selectedReturn && <span style={{ color: C.pink }}> ✓</span>}
            </button>
          </div>
        )}

        <div style={{ backgroundColor: C.white, padding: '10px 24px', display: 'flex', gap: '6px', borderBottom: availableAirlines.length > 1 ? 'none' : `1px solid ${C.g200}`, overflowX: 'auto' }}>
          {['all', 'cheapest', 'fastest', 'rated'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '100px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: filter === f ? C.black : C.g100, color: filter === f ? C.white : C.g600 }}>
              {f === 'all' ? 'All' : f === 'cheapest' ? 'Cheapest' : f === 'fastest' ? 'Fastest' : 'Highest Rated'}
            </button>
          ))}
        </div>

        {availableAirlines.length > 1 && (
          <div style={{ backgroundColor: C.white, padding: '6px 24px 10px', display: 'flex', gap: '6px', borderBottom: `1px solid ${C.g200}`, overflowX: 'auto' }}>
            <button onClick={() => setAirlineFilter(null)} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: airlineFilter === null ? '2px solid ' + C.black : '1.5px solid ' + C.g300, backgroundColor: airlineFilter === null ? C.black : 'transparent', color: airlineFilter === null ? C.white : C.g600 }}>
              All Airlines
            </button>
            {availableAirlines.map(a => {
              const style = AIRLINE_STYLE[a];
              const isActive = airlineFilter === a;
              return (
                <button key={a} onClick={() => setAirlineFilter(isActive ? null : a)} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: isActive ? `2px solid ${style?.bg || C.black}` : `1.5px solid ${style?.bg || C.g300}`, backgroundColor: isActive ? (style?.bg || C.black) : 'transparent', color: isActive ? (style?.text || C.white) : (style?.bg || C.g600) }}>
                  {a}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ margin: '10px 24px 0', padding: '10px 14px', backgroundColor: '#FFF8E1', borderRadius: '10px', border: '1px solid #FFE082', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px', lineHeight: '18px', flexShrink: 0 }}>*</span>
          <span style={{ fontSize: '11px', color: '#6D5D00', lineHeight: 1.4 }}>Prices & schedules are estimates and may not reflect real-time availability. Always confirm details on the airline&apos;s website before booking.</span>
        </div>

        <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {flights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.g400 }}>
              <Plane style={{ width: '48px', height: '48px', color: C.g300, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.black, margin: '0 0 6px' }}>No flights for these dates</h3>
              <p style={{ fontSize: '14px', color: C.g400, margin: '0 0 20px', lineHeight: 1.5 }}>Try different dates or explore nearby airports.</p>
              <button onClick={() => { setScreen('home'); setTimeout(() => setCalOpen(true), 300); }}
                style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '14px', backgroundColor: C.black, color: C.cream, fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Calendar style={{ width: '16px', height: '16px' }} /> Try Different Dates
              </button>
            </div>
          ) : flights.map(fl => {
            const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
            const rating = WING_RATINGS[fl.airline];
            const wingColor = rating ? WING_COLORS[rating.wings] : C.g400;
            return (
              <button key={fl.id} onClick={() => {
                if (viewingReturn) { setSelectedReturn(fl); setScreen('detail'); }
                else { setSelectedFlight(fl); if (isRT && !selectedReturn) setViewingReturn(true); else setScreen('detail'); }
              }} style={{ width: '100%', backgroundColor: C.white, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.g200}`, cursor: 'pointer', textAlign: 'left' }}>
                {/* Row 1: Airline badge + name + wings + craft | Price */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, fontSize: '10px', fontWeight: 900, flexShrink: 0 }}>{style.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: C.black, fontSize: '14px' }}>{fl.airline}</span>
                      {rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ display: 'flex', gap: '1px' }}>
                            {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={10} color={wingColor} />)}
                          </div>
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: C.g400, fontWeight: 500 }}>{fl.craft}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: C.black }}>${Math.round(fl.price)}</div>
                  </div>
                </div>
                {/* Row 2: Times */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: C.black }}>{fl.dep}</div>
                    <div style={{ fontSize: '10px', color: C.g400 }}>{fl.dc}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0 12px' }}>
                    <div style={{ fontSize: '9px', color: C.g600, fontWeight: 600 }}>{fl.dur}</div>
                    <div style={{ width: '100%', height: '1px', backgroundColor: C.g200, position: 'relative' }}>
                      <Plane style={{ width: '10px', height: '10px', color: C.darkGreen, position: 'absolute', top: '-5px', left: '50%', marginLeft: '-5px' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: C.black }}>{fl.arr}</div>
                    <div style={{ fontSize: '10px', color: C.g400 }}>{fl.ac}</div>
                  </div>
                </div>
                {/* Row 3: Badges + seats */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {rating && rating.badges.slice(0, 2).map(b => (
                      <span key={b} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', backgroundColor: C.cream, color: C.darkGreen, fontWeight: 600 }}>
                        {BADGE_CONFIG[b]?.label}
                      </span>
                    ))}
                    {rating?.pets && (
                      <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', backgroundColor: '#FDE8EC', color: C.pink, fontWeight: 600 }}>
                        Pet Friendly
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: fl.seats <= 3 ? C.pink : C.g600, fontWeight: 700 }}>{fl.seats} left</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // DETAIL SCREEN
  const DetailScreen = () => {
    const fl = viewingReturn ? selectedReturn : selectedFlight;
    if (!fl) return null;
    const style = AIRLINE_STYLE[fl.airline] || { bg: '#333', text: '#fff', label: '?', accent: '#999' };
    const basePrice = Math.round(fl.price);
    const taxes = Math.round(basePrice * 0.12);
    const total = (basePrice + taxes) * passengers;
    const isRT = tripType === 'roundtrip' && !!returnDate;
    const rating = WING_RATINGS[fl.airline];

    return (
      <div style={{ width: '100%', minHeight: '100%', backgroundColor: C.offWhite, paddingBottom: '100px' }}>
        <div style={{ background: style.bg || C.black, padding: '16px 24px 28px', color: C.white }}>
          <button onClick={() => setScreen('results')} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: '4px 0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <ChevronLeft style={{ width: '18px', height: '18px' }} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900 }}>{style.label}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>{fl.airline}</h1>
              <p style={{ opacity: 0.7, margin: '2px 0 0', fontSize: '13px' }}>{fl.craft}</p>
            </div>
            {rating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                  {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={16} color={C.cream} />)}
                </div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: C.cream, opacity: 0.8, marginTop: '2px', letterSpacing: '0.06em' }}>
                  {rating.wings === 3 ? 'FLAGSHIP' : rating.wings === 2 ? 'PREMIUM' : 'ACCESSIBLE'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flight timeline */}
        <div style={{ margin: '16px 24px', backgroundColor: C.white, borderRadius: '16px', padding: '20px', border: `1px solid ${C.g200}` }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.black, margin: '0 0 16px' }}>Flight · {fmtDate(viewingReturn ? returnDate : departDate)}</h3>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: C.darkGreen }} />
              <div style={{ width: '2px', flex: 1, backgroundColor: C.g200, margin: '4px 0' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: C.pink }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em' }}>DEPARTURE</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: C.black }}>{fl.dep}</div>
                <div style={{ fontSize: '13px', color: C.g600 }}>{findLoc(fl.dc).name || findLoc(fl.dc).city} ({fl.dc})</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em' }}>ARRIVAL</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: C.black }}>{fl.arr}</div>
                <div style={{ fontSize: '13px', color: C.g600 }}>{findLoc(fl.ac).name || findLoc(fl.ac).city} ({fl.ac})</div>
              </div>
            </div>
            <div style={{ alignSelf: 'center', padding: '8px 12px', backgroundColor: C.cream, borderRadius: '10px', textAlign: 'center' }}>
              <Clock style={{ width: '14px', height: '14px', color: C.darkGreen, margin: '0 auto 2px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.darkGreen }}>{fl.dur}</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ margin: '0 24px 14px', backgroundColor: C.white, borderRadius: '16px', padding: '20px', border: `1px solid ${C.g200}` }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.black, margin: '0 0 14px' }}>Price</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{ color: C.g600 }}>Base fare × {passengers}</span><span style={{ fontWeight: 600 }}>${basePrice * passengers}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{ color: C.g600 }}>Taxes & fees</span><span style={{ fontWeight: 600 }}>${taxes * passengers}</span></div>
          <div style={{ borderTop: `2px solid ${C.g100}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800 }}>Total</span><span style={{ fontWeight: 800, fontSize: '20px', color: C.darkGreen }}>${total}</span>
          </div>
        </div>

        {/* Aviato Wing Rating */}
        {rating && (() => {
          const wc = WING_COLORS[rating.wings];
          const allCriteria = ['terminal','arrival','density','baggage','amenities','seating'];
          return (
            <div style={{ margin: '0 24px 14px', backgroundColor: C.white, borderRadius: '16px', padding: '20px', border: `1px solid ${C.g200}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.black, margin: 0 }}>Aviato Rating</h3>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', backgroundColor: rating.wings === 3 ? '#FDF6E3' : rating.wings === 2 ? '#E8F5E9' : C.g100, color: wc }}>{rating.tier}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: C.g400 }}>{rating.score}/6 criteria met</div>
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: rating.wings }).map((_, i) => <WingIcon key={i} size={20} color={wc} />)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {allCriteria.map(c => {
                  const has = rating.badges.includes(c);
                  const cfg = BADGE_CONFIG[c];
                  if (!cfg) return null;
                  return (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', backgroundColor: has ? C.cream : C.g100, opacity: has ? 1 : 0.5 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: has ? C.darkGreen : C.g300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: has ? C.cream : C.white, flexShrink: 0 }}>
                        <BadgeIcon type={cfg.icon} size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: has ? C.black : C.g400 }}>{cfg.label}</div>
                        <div style={{ fontSize: '9px', color: has ? C.darkGreen : C.g400, fontWeight: 600 }}>{has ? '✓ Yes' : '✗ No'}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', backgroundColor: rating.pets ? '#FDE8EC' : C.g100, opacity: rating.pets ? 1 : 0.5, gridColumn: '1 / -1' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: rating.pets ? C.pink : C.g300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, flexShrink: 0 }}>
                    <Heart style={{ width: '13px', height: '13px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: rating.pets ? C.black : C.g400 }}>Pet Friendly</div>
                    <div style={{ fontSize: '9px', color: rating.pets ? C.pink : C.g400, fontWeight: 600 }}>{rating.pets ? `✓ ${rating.petNote || 'Pets welcome'}` : '✗ Not available'}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Amenities */}
        <div style={{ margin: '0 24px 14px', backgroundColor: C.white, borderRadius: '16px', padding: '20px', border: `1px solid ${C.g200}` }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.black, margin: '0 0 12px' }}>Included Amenities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {fl.amen.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: C.cream, borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: C.darkGreen }}>
                {a.includes('WiFi') && <Wifi style={{ width: '13px', height: '13px' }} />}
                {(a.includes('Snack') || a.includes('Catering')) && <Coffee style={{ width: '13px', height: '13px' }} />}
                {(a.includes('Champagne') || a.includes('Cocktail') || a.includes('Wine')) && <Wine style={{ width: '13px', height: '13px' }} />}
                {a}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <button onClick={() => {
            if (isRT && !viewingReturn && !selectedReturn) { setViewingReturn(true); setScreen('results'); }
            else { setRedirectAirline(fl.airline); setRedirectFlight(fl); setScreen('redirect'); }
          }} style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: C.cream, backgroundColor: C.black }}>
            {isRT && !viewingReturn && !selectedReturn ? 'Select Return Flight' : `Book on ${fl.airline}`}
          </button>
          {AIRLINE_BOOKING[fl.airline] && (
            <p style={{ textAlign: 'center', fontSize: '11px', color: C.g400, marginTop: '8px' }}>You&apos;ll complete your booking on {fl.airline}&apos;s website</p>
          )}
        </div>
      </div>
    );
  };

  // REDIRECT SCREEN
  const RedirectScreen = () => {
    const airline = redirectAirline || '';
    const style = AIRLINE_STYLE[airline] || { bg: C.black, text: '#fff', label: '?', accent: '#999' };
    const fl = redirectFlight || selectedFlight;
    const flRet = selectedReturn;
    const isRT = tripType === 'roundtrip' && !!returnDate;

    // Generate dynamic deep link URL based on airline, route, and trip details
    const deepLinkUrl = fl
      ? generateDeepLink(airline, fl.dc, fl.ac, departDate, returnDate, passengers, tripType)
      : '#';
    const deepLinkNote = fl
      ? getDeepLinkNote(airline, fl.dc, fl.ac, tripType)
      : `Complete your booking on ${airline}'s website.`;

    // Check if this airline supports full deep linking (pre-filled route)
    const hasFullDeepLink = airline === 'Aero' || airline === 'JSX' || airline === 'Tradewind' || airline === 'BARK Air' || (airline === 'Slate' && fl && deepLinkUrl.includes('search/points/'));

    return (
      <div style={{ width: '100%', minHeight: '100%', background: `linear-gradient(180deg, ${style.bg || C.black} 0%, ${C.offWhite} 45%)`, paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', padding: '44px 24px 28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ExternalLink style={{ width: '28px', height: '28px', color: C.cream }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: C.white, margin: '0 0 6px' }}>
            {hasFullDeepLink ? `Book on ${airline}` : `Complete on ${airline}`}
          </h1>
          <p style={{ fontSize: '13px', color: C.cream, opacity: 0.8, margin: 0 }}>
            {hasFullDeepLink
              ? 'Your route and passengers are pre-filled!'
              : `You'll finish booking on ${airline}'s website`}
          </p>
        </div>

        {fl && (
          <div style={{ margin: '0 24px 10px', backgroundColor: C.white, borderRadius: '16px', padding: '18px', border: `1px solid ${C.g200}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em', marginBottom: '10px' }}>YOUR FLIGHT</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.g100, borderRadius: '10px', padding: '12px', marginBottom: isRT && flRet ? '10px' : '0' }}>
              <div><div style={{ fontSize: '16px', fontWeight: 800 }}>{fl.dep}</div><div style={{ fontSize: '11px', color: C.g400 }}>{findLoc(fl.dc).city} ({fl.dc})</div></div>
              <div style={{ textAlign: 'center' }}>
                <Plane style={{ width: '14px', height: '14px', color: C.darkGreen }} />
                <div style={{ fontSize: '10px', color: C.g400 }}>{fmtDate(departDate)}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '16px', fontWeight: 800 }}>{fl.arr}</div><div style={{ fontSize: '11px', color: C.g400 }}>{findLoc(fl.ac).city} ({fl.ac})</div></div>
            </div>
            {isRT && flRet && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.g100, borderRadius: '10px', padding: '12px' }}>
                <div><div style={{ fontSize: '16px', fontWeight: 800 }}>{flRet.dep}</div><div style={{ fontSize: '11px', color: C.g400 }}>{findLoc(flRet.dc).city} ({flRet.dc})</div></div>
                <div style={{ textAlign: 'center' }}>
                  <Plane style={{ width: '14px', height: '14px', color: C.darkGreen, transform: 'scaleX(-1)' }} />
                  <div style={{ fontSize: '10px', color: C.g400 }}>{fmtDate(returnDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '16px', fontWeight: 800 }}>{flRet.arr}</div><div style={{ fontSize: '11px', color: C.g400 }}>{findLoc(flRet.ac).city} ({flRet.ac})</div></div>
              </div>
            )}
          </div>
        )}

        <div style={{ margin: '0 24px 14px', backgroundColor: C.white, borderRadius: '16px', padding: '18px', border: `1px solid ${C.g200}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em', marginBottom: '10px' }}>
            {hasFullDeepLink ? 'PRE-FILLED FOR YOU' : `SEARCH ON ${airline.toUpperCase()}`}
          </div>

          {hasFullDeepLink && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#D4EDDA', borderRadius: '10px', marginBottom: '12px' }}>
              <Check style={{ width: '16px', height: '16px', color: C.darkGreen, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: C.darkGreen, fontWeight: 600 }}>Route & passengers will be pre-selected on {airline}&apos;s site</span>
            </div>
          )}

          <div style={{ fontSize: '13px', color: C.g600, lineHeight: 1.5, marginBottom: '14px' }}>
            {deepLinkNote}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: hasFullDeepLink ? '#D4EDDA' : C.cream, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: C.g600, fontWeight: 600 }}>Route</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasFullDeepLink && <Check style={{ width: '12px', height: '12px', color: C.darkGreen }} />}
                <span style={{ fontSize: '12px', color: C.black, fontWeight: 800 }}>{fl ? `${fl.dc} → ${fl.ac}` : ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: C.cream, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: C.g600, fontWeight: 600 }}>Date{isRT ? 's' : ''}</span>
              <span style={{ fontSize: '12px', color: C.black, fontWeight: 800 }}>{fmtDate(departDate)}{isRT ? ` – ${fmtDate(returnDate)}` : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: hasFullDeepLink ? '#D4EDDA' : C.cream, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: C.g600, fontWeight: 600 }}>Passengers</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasFullDeepLink && <Check style={{ width: '12px', height: '12px', color: C.darkGreen }} />}
                <span style={{ fontSize: '12px', color: C.black, fontWeight: 800 }}>{passengers}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: hasFullDeepLink ? '#D4EDDA' : C.cream, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: C.g600, fontWeight: 600 }}>Trip Type</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasFullDeepLink && <Check style={{ width: '12px', height: '12px', color: C.darkGreen }} />}
                <span style={{ fontSize: '12px', color: C.black, fontWeight: 800 }}>{tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <a href={deepLinkUrl} target="_blank" rel="noopener noreferrer"
            style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: C.cream, backgroundColor: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box' }}>
            <ExternalLink style={{ width: '16px', height: '16px' }} /> {hasFullDeepLink ? `Book on ${airline}` : `Go to ${airline}`}
          </a>
          <button onClick={() => { setScreen('home'); setFromCode(''); setToCode(''); setDepartDate(''); setReturnDate(''); setSelectedFlight(null); setSelectedReturn(null); setRedirectFlight(null); setViewingReturn(false); setActiveTab('home'); }}
            style={{ width: '100%', marginTop: '10px', padding: '14px', border: `1.5px solid ${C.g200}`, borderRadius: '14px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: C.g600 }}>
            Back to Search
          </button>
        </div>
      </div>
    );
  };

  // EXPLORE SCREEN
  const ExploreScreen = () => {
    const [selectedCat, setSelectedCat] = useState('all');
    const [sortBy, setSortBy] = useState<'featured' | 'date'>('featured');
    const cats = ['all', 'Sports', 'Music', 'Art & Culture', 'Food & Wine', 'Ski & Snow', 'Luxury', 'Tech', 'Film', 'Culture'];
    const filtered = selectedCat === 'all' ? EVENTS : EVENTS.filter(e => e.cat === selectedCat);
    const sorted = sortBy === 'date'
      ? [...filtered].sort((a, b) => a.start.localeCompare(b.start))
      : filtered;

    return (
      <div style={{ width: '100%', minHeight: '100%', backgroundColor: C.offWhite, paddingBottom: '80px' }}>
        <div style={{ background: C.black, padding: '16px 24px 20px', color: C.white }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>Explore</h1>
          <p style={{ fontSize: '13px', color: C.cream, opacity: 0.7, margin: 0 }}>Events worth flying semi-private for</p>
        </div>

        <div style={{ backgroundColor: C.white, padding: '10px 24px', display: 'flex', gap: '6px', borderBottom: `1px solid ${C.g200}`, overflowX: 'auto' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setSelectedCat(c)} style={{ padding: '7px 14px', borderRadius: '100px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: selectedCat === c ? C.black : C.g100, color: selectedCat === c ? C.white : C.g600 }}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: C.g400, fontWeight: 600 }}>{sorted.length} events</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['featured', 'date'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${sortBy === s ? C.darkGreen : C.g200}`, fontSize: '11px', fontWeight: 600, cursor: 'pointer', backgroundColor: sortBy === s ? C.cream : C.white, color: sortBy === s ? C.darkGreen : C.g400 }}>
                {s === 'featured' ? 'Featured' : 'By Date ↑'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sorted.map(ev => (
            <div key={ev.id} style={{ backgroundColor: C.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.g200}` }}>
              <div style={{ background: `linear-gradient(135deg, ${C.black} 0%, ${C.darkGreen} 100%)`, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '36px' }}>{ev.img}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: C.white }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: C.cream, opacity: 0.8, marginTop: '2px' }}>{ev.city}, {ev.state} · {ev.date}</div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '13px', color: C.g600, margin: '0 0 14px', lineHeight: 1.5 }}>{ev.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: C.g400, fontWeight: 600 }}>FLIGHTS FROM</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: C.darkGreen }}>${ev.price}</div>
                  </div>
                  <button onClick={() => {
                    if (ev.from) setFromCode(ev.from);
                    setToCode(ev.dest); setTripType('roundtrip');
                    setDepartDate(shiftDate(ev.start, -1)); setReturnDate(shiftDate(ev.end, 1));
                    setActiveTab('home'); setScreen('home');
                    setTimeout(() => { if (phoneContentRef.current) phoneContentRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, 50);
                  }} style={{ padding: '12px 20px', border: 'none', borderRadius: '12px', backgroundColor: C.black, color: C.cream, fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plane style={{ width: '14px', height: '14px' }} /> Book with Aviato
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // BOTTOM NAV - Pill-shaped floating nav with sliding indicator
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Compass, label: 'Trips' },
  ];
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const BottomNav = () => (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
      <div style={{
        display: 'flex', alignItems: 'center', backgroundColor: C.black, borderRadius: '40px',
        padding: '6px', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        width: '220px',
      }}>
        {/* Sliding pill indicator */}
        <div style={{
          position: 'absolute', top: '6px', left: '6px', width: 'calc(50% - 6px)', height: 'calc(100% - 12px)',
          backgroundColor: C.darkGreen, borderRadius: '34px',
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        {tabs.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setScreen(item.id); setTimeout(() => { if (phoneContentRef.current) phoneContentRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, 50); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
                position: 'relative', zIndex: 1,
                color: isActive ? C.cream : C.g400,
                transition: 'color 0.3s ease',
              }}>
              <Icon style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen />;
      case 'results': return <ResultsScreen />;
      case 'detail': return <DetailScreen />;
      case 'redirect': return <RedirectScreen />;
      case 'explore': return <ExploreScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#E5E5E0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 0', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div className="phone-frame" style={{ width: '100%', maxWidth: '430px', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', border: '8px solid #1a1a1a', backgroundColor: C.offWhite, position: 'relative' }}>
        <div style={{ backgroundColor: (screen === 'redirect') ? (AIRLINE_STYLE[redirectAirline || '']?.bg || C.darkGreen) : C.black, height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', color: C.white, fontSize: '12px', fontWeight: 600 }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '14px', height: '10px', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1px', left: '1px', right: '3px', bottom: '1px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
            </div>
          </div>
        </div>
        <div style={{ height: '812px', position: 'relative', overflow: 'hidden' }}>
          <div ref={phoneContentRef} style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {renderScreen()}
          </div>
          {screen !== 'redirect' && <BottomNav />}
        </div>
      </div>
      <CalendarPicker isOpen={calOpen} onClose={() => setCalOpen(false)} tripType={tripType} departDate={departDate} returnDate={returnDate} onSelectDepart={setDepartDate} onSelectReturn={setReturnDate} fromCode={fromCode} toCode={toCode} selectingReturn={selectingReturn} setSelectingReturn={setSelectingReturn} />
    </div>
  );
}
