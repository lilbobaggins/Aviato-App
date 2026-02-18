import { LOCATIONS, expandCode } from './locations';
import { FLIGHTS } from './flights';
import type { Location } from './types';

export const getReachableFrom = (fromCode: string): Set<string> => {
  const fromCodes = expandCode(fromCode);
  const dests = new Set<string>();
  fromCodes.forEach(fc => {
    Object.keys(FLIGHTS).forEach(key => {
      if (key.startsWith(fc + '-')) dests.add(key.split('-')[1]);
    });
  });
  return dests;
};

export const getReachableTo = (toCode: string): Set<string> => {
  const toCodes = expandCode(toCode);
  const origins = new Set<string>();
  toCodes.forEach(tc => {
    Object.keys(FLIGHTS).forEach(key => {
      if (key.endsWith('-' + tc)) origins.add(key.split('-')[0]);
    });
  });
  return origins;
};

export const getValidOrigins = (toCode: string): Location[] => {
  if (!toCode) return LOCATIONS;
  const reachable = getReachableTo(toCode);
  const toAirports = new Set(expandCode(toCode));
  return LOCATIONS.filter(loc => {
    const locAirports = loc.type === 'metro' ? loc.airports! : [loc.code];
    if (locAirports.some(a => toAirports.has(a))) return false;
    return locAirports.some(a => reachable.has(a));
  });
};

export const getValidDestinations = (fromCode: string): Location[] => {
  if (!fromCode) return LOCATIONS;
  const reachable = getReachableFrom(fromCode);
  const fromAirports = new Set(expandCode(fromCode));
  return LOCATIONS.filter(loc => {
    const locAirports = loc.type === 'metro' ? loc.airports! : [loc.code];
    if (locAirports.some(a => fromAirports.has(a))) return false;
    return locAirports.some(a => reachable.has(a));
  });
};
