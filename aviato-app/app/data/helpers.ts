import { LOCATIONS, expandCode } from './locations';
import { FLIGHTS } from './flights';
import type { Location } from './types';

// All known route pairs across all airlines (JSX, Aero, Tradewind, BARK Air)
// This ensures the search dropdown shows valid destinations even before
// the scrapers have populated flights.ts with data for a given route.
const KNOWN_ROUTES = new Set([
  // JSX — LA area to Las Vegas
  'BUR-LAS','LAS-BUR','SMO-LAS','LAS-SMO','SNA-LAS','LAS-SNA','LAX-LAS','LAS-LAX',
  // JSX — LA area to Scottsdale
  'SMO-SCF','SCF-SMO','SNA-SCF','SCF-SNA','BUR-SCF','SCF-BUR',
  // JSX — LA area to Bay Area
  'BUR-CCR','CCR-BUR','BUR-OAK','OAK-BUR','SNA-OAK','OAK-SNA',
  // JSX — LA area to Reno / SLC
  'BUR-RNO','RNO-BUR','SNA-RNO','RNO-SNA','BUR-SLC','SLC-BUR','SNA-SLC','SLC-SNA',
  // JSX — LA area to Monterey / Napa / Taos / Denver
  'BUR-MRY','MRY-BUR','BUR-APC','APC-BUR','BUR-TSM','TSM-BUR','BUR-APA','APA-BUR',
  // JSX — SNA to Napa / Denver
  'SNA-APC','APC-SNA','SNA-APA','APA-SNA',
  // JSX — LA area to Carlsbad
  'BUR-CLD','CLD-BUR',
  // JSX — LA / Dallas to Cabo
  'LAX-CSW','CSW-LAX','DAL-CSW','CSW-DAL',
  // JSX — LA area misc
  'SMO-TRM','TRM-SMO',
  // JSX — Las Vegas to other destinations
  'LAS-SCF','SCF-LAS','LAS-OAK','OAK-LAS','LAS-CLD','CLD-LAS',
  'LAS-SLC','SLC-LAS','LAS-APA','APA-LAS','LAS-RNO','RNO-LAS',
  // JSX — Dallas hub
  'DAL-LAS','LAS-DAL','DAL-DSI','DSI-DAL','DAL-HOU','HOU-DAL',
  'DAL-OPF','OPF-DAL','DAL-APA','APA-DAL','DAL-TSM','TSM-DAL',
  'DAL-SCF','SCF-DAL','DAL-BUR','BUR-DAL','DAL-SAF','SAF-DAL',
  'DAL-HOB','HOB-DAL','DAL-EDC','EDC-DAL',
  // JSX — East Coast to Florida
  'HPN-PBI','PBI-HPN','HPN-OPF','OPF-HPN','HPN-APF','APF-HPN',
  'MMU-PBI','PBI-MMU','MMU-APF','APF-MMU','MMU-BCT','BCT-MMU',
  'TEB-OPF','OPF-TEB','TEB-PBI','PBI-TEB',
  // JSX — Scottsdale hub
  'SCF-APA','APA-SCF','SCF-SLC','SLC-SCF','SCF-CLD','CLD-SCF',

  // Aero — VNY hub
  'VNY-LAS','LAS-VNY','VNY-ASE','ASE-VNY','VNY-SUN','SUN-VNY',
  'VNY-TRM','TRM-VNY','VNY-APC','APC-VNY','VNY-SJD','SJD-VNY',
  'VNY-OGG','OGG-VNY','VNY-TEB','TEB-VNY',
  'VNY-HCR','HCR-VNY','VNY-SLC','SLC-VNY',
  // Aero — Aspen to New York
  'ASE-TEB','TEB-ASE',

  // Tradewind — Nantucket / Martha's Vineyard
  'HPN-ACK','ACK-HPN','HPN-MVY','MVY-HPN',

  // BARK Air — Domestic
  'HPN-VNY','VNY-HPN','HPN-SJC','SJC-HPN','VNY-KOA','KOA-VNY',
  'SEA-HPN','HPN-SEA',
  // BARK Air — Europe
  'HPN-LTN','LTN-HPN','HPN-LBG','LBG-HPN','HPN-MAD','MAD-HPN',
  'HPN-LIS','LIS-HPN','HPN-BER','BER-HPN','HPN-DUB','DUB-HPN',
  'HPN-ATH','ATH-HPN','HPN-ARN','ARN-HPN',
  // BARK Air — Asia
  'VNY-NRT','NRT-VNY',
]);

export const getReachableFrom = (fromCode: string): Set<string> => {
  const fromCodes = expandCode(fromCode);
  const dests = new Set<string>();
  fromCodes.forEach(fc => {
    // Check flights.ts
    Object.keys(FLIGHTS).forEach(key => {
      if (key.startsWith(fc + '-')) dests.add(key.split('-')[1]);
    });
    // Check known routes
    KNOWN_ROUTES.forEach(key => {
      if (key.startsWith(fc + '-')) dests.add(key.split('-')[1]);
    });
  });
  return dests;
};

export const getReachableTo = (toCode: string): Set<string> => {
  const toCodes = expandCode(toCode);
  const origins = new Set<string>();
  toCodes.forEach(tc => {
    // Check flights.ts
    Object.keys(FLIGHTS).forEach(key => {
      if (key.endsWith('-' + tc)) origins.add(key.split('-')[0]);
    });
    // Check known routes
    KNOWN_ROUTES.forEach(key => {
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
