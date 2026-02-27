// Click tracking utilities for CPC billing
// Routes outbound booking clicks through /api/go for logging

// Whitelist of known airline booking domains to prevent open redirects
const ALLOWED_DOMAINS = [
  'jsx.com', 'www.jsx.com', 'flights.jsx.com',
  'aero.com', 'www.aero.com',
  'flyslate.com', 'app.flyslate.com',
  'flytradewind.com', 'booking.flytradewind.com',
  'bark.co', 'air.bark.co',
  'surfair.com', 'fly.surfair.com',
  'boutiqueair.com', 'www.boutiqueair.com',
];

export function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// Build a tracked redirect URL that goes through /api/go
export function buildTrackingUrl(params: {
  url: string;
  airline: string;
  origin: string;
  destination: string;
  flightDate?: string;
  price?: number;
  sessionId?: string;
}): string {
  const query = new URLSearchParams({
    url: params.url,
    airline: params.airline,
    origin: params.origin,
    destination: params.destination,
  });
  if (params.flightDate) query.set('flightDate', params.flightDate);
  if (params.price != null) query.set('price', String(params.price));
  if (params.sessionId) query.set('sessionId', params.sessionId);
  return `/api/go?${query.toString()}`;
}

// Get or create a persistent session ID for click attribution
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('aviato_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('aviato_session_id', id);
    }
    return id;
  } catch {
    return '';
  }
}

// Fire a Google Analytics custom event for booking clicks
export function trackBookingClick(params: {
  airline: string;
  origin: string;
  destination: string;
  price?: number;
}) {
  if (typeof window !== 'undefined' && typeof (window as unknown as Record<string, unknown>).gtag === 'function') {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'booking_click', {
      airline: params.airline,
      origin: params.origin,
      destination: params.destination,
      price: params.price,
      value: params.price,
      currency: 'USD',
    });
  }
}
