import type { AirlineStyle, WingRating, AirlineBooking, BadgeConfig } from './types';

export const C = {
  black: '#000000',
  darkGreen: '#0A3D2E',
  pink: '#E8576D',
  cream: '#F5F0E1',
  white: '#FFFFFF',
  offWhite: '#FAFAF7',
  g100: '#F3F3F0',
  g200: '#E5E5E0',
  g300: '#D0D0CA',
  g400: '#9B9B93',
  g600: '#6B6B63',
  g800: '#2D2D28',
};

export const AIRLINE_STYLE: Record<string, AirlineStyle> = {
  'JSX': { bg: '#1A1A2E', text: '#FFF', label: 'JSX', accent: '#E94560' },
  'Aero': { bg: '#0D0D0D', text: '#FFF', label: 'AE', accent: '#C9A96E' },
  'Slate': { bg: '#1B3A4B', text: '#FFF', label: 'SL', accent: '#7EC8E3' },
  'Tradewind': { bg: '#1A472A', text: '#FFF', label: 'TW', accent: '#87CEAB' },
  'Surf Air': { bg: '#003049', text: '#FFF', label: 'SA', accent: '#00B4D8' },
  'BARK Air': { bg: '#2C3E2D', text: '#FFF', label: 'BA', accent: '#8DB580' },
  'Boutique Air': { bg: '#1C3A50', text: '#FFF', label: 'BQ', accent: '#6BAED6' },
};

export const AIRLINE_BOOKING: Record<string, AirlineBooking> = {
  'JSX': { url: 'https://www.jsx.com/home/search', name: 'JSX', note: 'Select your route and dates on JSX.com' },
  'Aero': { url: 'https://aero.com', name: 'Aero', note: 'Book your Aero flight at aero.com' },
  'Slate': { url: 'https://flyslate.com', name: 'Slate', note: 'Book your Slate flight at flyslate.com' },
  'Tradewind': { url: 'https://www.flytradewind.com/scheduled/', name: 'Tradewind Aviation', note: 'Book scheduled flights at flytradewind.com' },
  'Surf Air': { url: 'https://fly.surfair.com/explore/scheduled', name: 'Surf Air', note: 'Operated by Southern Airways Express. Book at fly.surfair.com' },
  'BARK Air': { url: 'https://air.bark.co/collections/bookings', name: 'BARK Air', note: 'Each ticket includes 1 dog + 1 human. Book at air.bark.co' },
  'Boutique Air': { url: 'https://www.boutiqueair.com', name: 'Boutique Air', note: 'Fly private for the cost of commercial. Book at boutiqueair.com' },
};

export const WING_RATINGS: Record<string, WingRating> = {
  'Aero': { wings: 3, tier: 'Flagship Semi-Private', score: 6, badges: ['terminal','arrival','density','baggage','amenities','seating'], pets: true, petNote: 'Pets welcome onboard' },
  'JSX': { wings: 2, tier: 'Premium Semi-Private', score: 4, badges: ['terminal','arrival','baggage','amenities'], pets: true, petNote: 'Pets welcome onboard' },
  'Slate': { wings: 2, tier: 'Premium Semi-Private', score: 5, badges: ['terminal','density','baggage','amenities','seating'], pets: true, petNote: 'Under 25 lbs free · Over 25 lbs requires extra seat' },
  'Tradewind': { wings: 2, tier: 'Premium Semi-Private', score: 5, badges: ['terminal','arrival','density','baggage','amenities'], pets: true, petNote: 'Pets welcome onboard' },
  'Surf Air': { wings: 1, tier: 'Accessible Semi-Private', score: 3, badges: ['terminal','arrival','density'], pets: false },
  'BARK Air': { wings: 3, tier: 'Flagship Semi-Private', score: 6, badges: ['terminal','arrival','density','baggage','amenities','seating'], pets: true, petNote: '1 dog + 1 human per ticket' },
  'Boutique Air': { wings: 1, tier: 'Accessible Semi-Private', score: 3, badges: ['density','baggage','seating'], pets: true, petNote: 'Pets allowed in cabin' },
};

export const BADGE_CONFIG: Record<string, BadgeConfig> = {
  terminal: { label: 'Private Terminal', icon: 'building' },
  arrival: { label: 'Fast Arrival', icon: 'timer' },
  density: { label: 'Low Density', icon: 'users' },
  baggage: { label: 'Bags Included', icon: 'briefcase' },
  amenities: { label: 'Premium Amenities', icon: 'sparkles' },
  seating: { label: 'Spacious Seats', icon: 'star' },
  pets: { label: 'Pet Friendly', icon: 'heart' },
};

export const WING_COLORS: Record<number, string> = { 3: '#B8860B', 2: '#0A3D2E', 1: '#6B6B63' };
