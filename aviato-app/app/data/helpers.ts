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
