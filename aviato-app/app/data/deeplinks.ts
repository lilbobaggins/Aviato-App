// Deep link URL generator for each airline
// Aero: CONFIRMED full deep linking with airport codes, passengers, trip type
// JSX: Route-specific landing pages at flights.jsx.com
// Others: Best available destination/booking pages

import { findLoc } from './locations';

// City slug mappings for JSX (flights.jsx.com uses lowercase hyphenated city names)
const JSX_CITY_SLUGS: Record<string, string> = {
  BUR: 'burbank', VNY: 'van-nuys', SMO: 'santa-monica', SNA: 'orange-county',
  LAS: 'las-vegas', ASE: 'aspen', DAL: 'dallas', SCF: 'scottsdale',
  OAK: 'oakland', SJD: 'los-cabos', CLD: 'carlsbad', HOU: 'houston',
  BJC: 'denver', APA: 'denver', RNO: 'reno', CCR: 'concord', MRY: 'monterey',
  HPN: 'white-plains', TEB: 'teterboro', FRG: 'farmingdale', MMU: 'morristown',
  OPF: 'miami', FLL: 'fort-lauderdale', PBI: 'west-palm-beach', BCT: 'boca-raton',
  ACK: 'nantucket', MVY: 'marthas-vineyard', SUN: 'sun-valley',
  TRM: 'coachella-valley', EDC: 'austin', SLC: 'salt-lake-city',
  DSI: 'destin', NAS: 'nassau', APC: 'napa', APF: 'naples', OGG: 'maui',
  SJU: 'san-juan', SBH: 'st-barths',
};

// Seasonal/event airport codes that don't have permanent flights.jsx.com route pages
const JSX_SEASONAL_CODES = new Set(['TRM']);

// Aero destination slugs (aero.com/destinations/na/{slug})
const AERO_DEST_SLUGS: Record<string, string> = {
  VNY: 'los-angeles', BUR: 'los-angeles', SMO: 'los-angeles', SNA: 'los-angeles',
  ASE: 'aspen', SJD: 'los-cabos', LAS: 'las-vegas',
  HPN: 'new-york-city', TEB: 'new-york-city', FRG: 'new-york-city', MMU: 'new-york-city',
  APC: 'napa', TRM: 'palm-springs', OGG: 'maui', SUN: 'sun-valley',
  DAL: 'dallas',
};

// Tradewind destination page slugs (used for deep link notes only)
const TRADEWIND_DEST_SLUGS: Record<string, string> = {
  ACK: 'nantucket',
  MVY: 'marthas-vineyard',
  NAS: 'nassau',
  VIJ: 'virgin-gorda',
  EIS: 'british-virgin-islands-tortola',
  AXA: 'anguilla',
  SBH: 'st-barths',
  MHH: 'marsh-harbour',
  ELH: 'north-eleuthera',
  SJU: 'san-juan-puerto-rico',
  HPN: 'westchester',
  FLL: 'fort-lauderdale',
};

// BARK Air city name mapping (Shopify filter uses city names)
// URL: air.bark.co/collections/bookings?filter.v.option.location={Origin}+To+{Dest}
const BARK_CITY_NAMES: Record<string, string> = {
  VNY: 'Los Angeles', BUR: 'Los Angeles', SMO: 'Los Angeles', SNA: 'Los Angeles',
  HPN: 'New York', TEB: 'New York', FRG: 'New York', MMU: 'New York',
  SJC: 'San Francisco',
  FXE: 'Fort Lauderdale', FLL: 'Fort Lauderdale',
  KOA: 'Kailua-Kona',
};

// Slate region point IDs (app.flyslate.com uses numeric IDs for regions)
// URL format: app.flyslate.com/search/points/{originId}-{destId}/ft/1/c/USD/
const SLATE_POINT_IDS: Record<string, number | undefined> = {
  // New York region
  HPN: 252, TEB: 252, FRG: 252,
  // South Florida region
  FLL: 218, PBI: 218,
  // Nantucket — TODO: find this ID from Slate's site
  // ACK: ???,
};

function getCitySlug(code: string): string {
  const loc = findLoc(code);
  return loc.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function generateDeepLink(
  airline: string,
  originCode: string,
  destCode: string,
  departDate: string,
  returnDate: string,
  passengers: number,
  tripType: string
): string {
  switch (airline) {
    case 'Aero': {
      // CONFIRMED: Full deep link with airport codes, passengers, trip type
      // preventBookingFlowReset=true forces Aero to use URL params (overrides cached session)
      const aeroParams: Record<string, string> = {
        preventBookingFlowReset: 'true',
        adults: String(passengers),
        infants: '0',
        petInSeat: '0',
        petUnderSeat: '0',
        serviceAnimal: '0',
        origin: originCode,
        destination: destCode,
        type: tripType === 'roundtrip' ? 'roundtrip' : 'oneway',
      };
      // Try to pre-fill dates (Aero may or may not support these params)
      if (departDate) aeroParams.departureDate = departDate;
      if (returnDate && tripType === 'roundtrip') aeroParams.returnDate = returnDate;
      const params = new URLSearchParams(aeroParams);
      return `https://aero.com/checkout?${params.toString()}`;
    }

    case 'JSX': {
      // CONFIRMED: Full deep link to JSX booking/select page
      // Pre-fills origin, destination, date, and passengers — user just picks a flight time
      const jsxParams = new URLSearchParams({
        o: originCode,
        d: destCode,
        dd: departDate,
        adt: String(passengers),
        chd: '0',
        inf: '0',
        curr: 'USD',
      });
      // Add return date for round-trip bookings
      if (returnDate && tripType === 'roundtrip') {
        jsxParams.set('rd', returnDate);
      }
      return `https://www.jsx.com/booking/select?${jsxParams.toString()}`;
    }

    case 'Slate': {
      // Slate's own booking page with pre-selected route
      const slateOriginId = SLATE_POINT_IDS[originCode];
      const slateDestId = SLATE_POINT_IDS[destCode];
      if (slateOriginId && slateDestId) {
        return `https://app.flyslate.com/search/points/${slateOriginId}-${slateDestId}/ft/1/c/USD/`;
      }
      // Fallback for routes without mapped IDs (e.g. Nantucket)
      return 'https://app.flyslate.com/';
    }

    case 'Tradewind': {
      // Tradewind uses Videcom's VARS booking engine (ASP.NET WebForms).
      // The requirementsBS.aspx page is the public entry point that creates a
      // booking session and shows the flight calendar — no pre-existing session needed.
      return 'https://booking.flytradewind.com/VARS/Public/CustomerPanels/requirementsBS.aspx';
    }

    case 'BARK Air': {
      // BARK Air uses Shopify — route filter via URL query param
      const barkOrigin = BARK_CITY_NAMES[originCode];
      const barkDest = BARK_CITY_NAMES[destCode];
      if (barkOrigin && barkDest) {
        const location = `${barkOrigin} To ${barkDest}`.replace(/ /g, '+');
        return `https://air.bark.co/collections/bookings?filter.v.option.location=${location}&sort_by=created-ascending`;
      }
      return 'https://air.bark.co/collections/bookings';
    }

    case 'Surf Air': {
      return 'https://fly.surfair.com/explore/scheduled';
    }

    case 'Boutique Air': {
      return 'https://www.boutiqueair.com';
    }

    default:
      return '#';
  }
}

// Get a human-readable description of what happens when clicking the deep link
export function getDeepLinkNote(
  airline: string,
  originCode: string,
  destCode: string,
  tripType: string
): string {
  const origin = findLoc(originCode);
  const dest = findLoc(destCode);

  switch (airline) {
    case 'Aero':
      return `Opens Aero with ${origin.city} → ${dest.city} pre-selected (${tripType === 'roundtrip' ? 'round trip' : 'one way'}). Each link resets the booking — your route is always fresh.`;

    case 'JSX':
      return `Opens JSX's booking page with ${origin.city} → ${dest.city} pre-selected (${tripType === 'roundtrip' ? 'round trip' : 'one way'}, ${passengers} passenger${passengers > 1 ? 's' : ''}). Just pick your flight time and check out!`;

    case 'Slate': {
      const hasSlateLink = SLATE_POINT_IDS[originCode] && SLATE_POINT_IDS[destCode];
      return hasSlateLink
        ? `Opens Slate with ${origin.city} → ${dest.city} pre-selected. Pick your date to book!`
        : `Opens Slate's booking page. Search ${origin.city} → ${dest.city} to see available flights.`;
    }

    case 'Tradewind': {
      return `Opens Tradewind's booking calendar. Select ${origin.city} → ${dest.city} and pick your dates to book.`;
    }

    case 'BARK Air': {
      const hasBarkLink = BARK_CITY_NAMES[originCode] && BARK_CITY_NAMES[destCode];
      return hasBarkLink
        ? `Opens BARK Air filtered to ${origin.city} → ${dest.city} flights. Each ticket includes 1 dog + 1 human.`
        : `Opens BARK Air's booking page. Each ticket includes 1 dog + 1 human.`;
    }

    case 'Surf Air':
      return `Opens Surf Air's booking page. Search ${origin.city} → ${dest.city} to see available flights.`;

    case 'Boutique Air':
      return `Opens Boutique Air's booking page. Search ${origin.city} → ${dest.city} and pick your date to book.`;

    default:
      return `Complete your booking on ${airline}'s website.`;
  }
}
