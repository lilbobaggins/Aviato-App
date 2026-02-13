import type { Location } from './types';

export const LOCATIONS: Location[] = [
  // METRO AREAS
  { code: 'LA', type: 'metro', city: 'Los Angeles', state: 'CA', name: 'All Los Angeles Airports', sub: 'LAX · BUR · VNY · SMO · SNA', airports: ['LAX','BUR','VNY','SMO','SNA'] },
  { code: 'NYC', type: 'metro', city: 'New York', state: 'NY', name: 'All New York Airports', sub: 'HPN · TEB · FRG · MMU', airports: ['HPN','TEB','FRG','MMU'] },
  { code: 'SFL', type: 'metro', city: 'South Florida', state: 'FL', name: 'All South Florida Airports', sub: 'MIA · OPF · FLL · PBI · BCT · FXE', airports: ['MIA','OPF','FLL','PBI','BCT','FXE'] },
  // POPULAR STANDALONE
  { code: 'LAS', type: 'airport', city: 'Las Vegas', state: 'NV', name: 'Harry Reid Intl' },
  { code: 'ASE', type: 'airport', city: 'Aspen', state: 'CO', name: 'Aspen-Pitkin County' },
  { code: 'ACK', type: 'airport', city: 'Nantucket', state: 'MA', name: 'Nantucket Memorial' },
  { code: 'DAL', type: 'airport', city: 'Dallas', state: 'TX', name: 'Dallas Love Field' },
  { code: 'NAS', type: 'airport', city: 'Nassau', state: 'BS', name: 'Lynden Pindling Intl' },
  { code: 'SCF', type: 'airport', city: 'Scottsdale', state: 'AZ', name: 'Scottsdale Airport' },
  { code: 'SUN', type: 'airport', city: 'Sun Valley', state: 'ID', name: 'Friedman Memorial' },
  { code: 'DSI', type: 'airport', city: 'Destin', state: 'FL', name: 'Destin Executive' },
  { code: 'MVY', type: 'airport', city: "Martha's Vineyard", state: 'MA', name: "Martha's Vineyard Airport" },
  { code: 'APC', type: 'airport', city: 'Napa', state: 'CA', name: 'Napa County Airport' },
  { code: 'CCR', type: 'airport', city: 'Concord', state: 'CA', name: 'Buchanan Field' },
  // NEW STANDALONE
  { code: 'OAK', type: 'airport', city: 'Oakland', state: 'CA', name: 'Oakland International' },
  { code: 'SJC', type: 'airport', city: 'San Jose', state: 'CA', name: 'San Jose Mineta International' },
  { code: 'FXE', type: 'airport', city: 'Fort Lauderdale', state: 'FL', name: 'Fort Lauderdale Executive', metro: 'SFL' },
  { code: 'SJD', type: 'airport', city: 'Cabo San Lucas', state: 'MX', name: 'Los Cabos International' },
  { code: 'BJC', type: 'airport', city: 'Denver', state: 'CO', name: 'Rocky Mountain Metropolitan' },
  { code: 'APA', type: 'airport', city: 'Denver', state: 'CO', name: 'Centennial Airport' },
  { code: 'RNO', type: 'airport', city: 'Reno', state: 'NV', name: 'Reno-Tahoe International' },
  { code: 'SLC', type: 'airport', city: 'Salt Lake City', state: 'UT', name: 'Salt Lake City International' },
  { code: 'MRY', type: 'airport', city: 'Monterey', state: 'CA', name: 'Monterey Regional' },
  { code: 'CLD', type: 'airport', city: 'Carlsbad', state: 'CA', name: 'McClellan-Palomar Airport' },
  { code: 'HOU', type: 'airport', city: 'Houston', state: 'TX', name: 'William P. Hobby Airport' },
  { code: 'EDC', type: 'airport', city: 'Austin', state: 'TX', name: 'Austin Executive Airport' },
  { code: 'TRM', type: 'airport', city: 'Coachella Valley', state: 'CA', name: 'Jacqueline Cochran Regional (Thermal)' },
  { code: 'OGG', type: 'airport', city: 'Maui', state: 'HI', name: 'Kahului Airport' },
  { code: 'KOA', type: 'airport', city: 'Kailua-Kona', state: 'HI', name: 'Ellison Onizuka Kona International' },
  { code: 'IPL', type: 'airport', city: 'Imperial', state: 'CA', name: 'Imperial County Airport' },
  { code: 'PHX', type: 'airport', city: 'Phoenix', state: 'AZ', name: 'Phoenix Sky Harbor International' },
  { code: 'APF', type: 'airport', city: 'Naples', state: 'FL', name: 'Naples Municipal Airport' },
  // CARIBBEAN
  { code: 'SJU', type: 'airport', city: 'San Juan', state: 'PR', name: 'Luis Muñoz Marín International' },
  { code: 'SBH', type: 'airport', city: 'St. Barths', state: 'BL', name: 'Rémy de Haenen Airport' },
  { code: 'AXA', type: 'airport', city: 'Anguilla', state: 'AI', name: 'Clayton J. Lloyd International' },
  { code: 'VIJ', type: 'airport', city: 'Virgin Gorda', state: 'VG', name: 'Virgin Gorda Airport' },
  { code: 'EIS', type: 'airport', city: 'Tortola', state: 'VG', name: 'Terrance B. Lettsome International' },
  { code: 'MHH', type: 'airport', city: 'Marsh Harbour', state: 'BS', name: 'Leonard M. Thompson International' },
  { code: 'ELH', type: 'airport', city: 'North Eleuthera', state: 'BS', name: 'North Eleuthera Airport' },
  // LA airports
  { code: 'LAX', type: 'airport', city: 'Los Angeles', state: 'CA', name: 'Los Angeles International', metro: 'LA' },
  { code: 'BUR', type: 'airport', city: 'Burbank', state: 'CA', name: 'Hollywood Burbank', metro: 'LA' },
  { code: 'VNY', type: 'airport', city: 'Van Nuys', state: 'CA', name: 'Van Nuys Airport', metro: 'LA' },
  { code: 'SMO', type: 'airport', city: 'Santa Monica', state: 'CA', name: 'Santa Monica Airport', metro: 'LA' },
  { code: 'SNA', type: 'airport', city: 'Orange County', state: 'CA', name: 'John Wayne Airport', metro: 'LA' },
  // NYC airports
  { code: 'HPN', type: 'airport', city: 'White Plains', state: 'NY', name: 'Westchester County', metro: 'NYC' },
  { code: 'TEB', type: 'airport', city: 'Teterboro', state: 'NJ', name: 'Teterboro Airport', metro: 'NYC' },
  { code: 'FRG', type: 'airport', city: 'Farmingdale', state: 'NY', name: 'Republic Airport', metro: 'NYC' },
  { code: 'MMU', type: 'airport', city: 'Morristown', state: 'NJ', name: 'Morristown Municipal', metro: 'NYC' },
  // SFL airports
  { code: 'MIA', type: 'airport', city: 'Miami', state: 'FL', name: 'Miami International', metro: 'SFL' },
  { code: 'OPF', type: 'airport', city: 'Miami', state: 'FL', name: 'Opa-Locka Executive', metro: 'SFL' },
  { code: 'FLL', type: 'airport', city: 'Fort Lauderdale', state: 'FL', name: 'Fort Lauderdale-Hollywood', metro: 'SFL' },
  { code: 'PBI', type: 'airport', city: 'West Palm Beach', state: 'FL', name: 'Palm Beach Intl', metro: 'SFL' },
  { code: 'BCT', type: 'airport', city: 'Boca Raton', state: 'FL', name: 'Boca Raton Airport', metro: 'SFL' },
];

export const AIRPORTS = LOCATIONS.filter(l => l.type === 'airport');

export const expandCode = (code: string): string[] => {
  const loc = LOCATIONS.find(l => l.code === code);
  if (!loc) return [code];
  return loc.type === 'metro' ? loc.airports! : [code];
};

export const findLoc = (code: string): Location => {
  return LOCATIONS.find(l => l.code === code) || { city: code, code, type: 'airport', state: '', name: '' };
};
