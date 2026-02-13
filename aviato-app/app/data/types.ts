export interface Location {
  code: string;
  type: 'metro' | 'airport';
  city: string;
  state: string;
  name: string;
  sub?: string;
  airports?: string[];
  metro?: string;
}

export interface Flight {
  id: string;
  airline: string;
  dep: string;
  arr: string;
  dc: string;
  ac: string;
  dur: string;
  price: number;
  craft: string;
  seats: number;
  amen: string[];
  link: string;
  date?: string;  // ISO date string (e.g. '2026-02-13') for date-specific flights
}

export interface EventItem {
  id: number;
  title: string;
  city: string;
  state: string;
  date: string;
  start: string;
  end: string;
  dest: string;
  from?: string;
  price: number;
  img: string;
  photo?: string;
  cat: string;
  desc: string;
}

export interface AirlineStyle {
  bg: string;
  text: string;
  label: string;
  accent: string;
}

export interface WingRating {
  wings: number;
  tier: string;
  score: number;
  badges: string[];
  pets: boolean;
  petNote?: string;
}

export interface AirlineBooking {
  url: string;
  name: string;
  note: string;
}

export interface BadgeConfig {
  label: string;
  icon: string;
}
