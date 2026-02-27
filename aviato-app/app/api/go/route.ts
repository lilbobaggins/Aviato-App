import { NextRequest, NextResponse } from 'next/server';
import { isAllowedDomain } from '@/app/lib/tracking';

// In-memory click log for MVP (persists per serverless instance lifecycle)
// For production: replace with Vercel Postgres via @vercel/postgres
interface ClickRecord {
  id: number;
  created_at: string;
  airline: string;
  origin: string;
  destination: string;
  flight_date: string;
  price: number;
  session_id: string;
  user_ip: string;
  user_agent: string;
  destination_url: string;
}

// In-memory storage â works for dev/testing and low-traffic MVP
// Each serverless instance maintains its own array; data resets on cold starts
// To persist: connect Vercel Postgres and INSERT instead of push
const clickLog: ClickRecord[] = [];
let nextId = 1;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const airline = searchParams.get('airline') || 'unknown';
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const flightDate = searchParams.get('flightDate') || '';
  const price = parseInt(searchParams.get('price') || '0', 10);
  const sessionId = searchParams.get('sessionId') || '';

  // Validate required URL parameter
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Prevent open redirects â only allow known airline domains
  if (!isAllowedDomain(url)) {
    return NextResponse.json({ error: 'Invalid redirect domain' }, { status: 403 });
  }

  // Extract request metadata
  const userIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Log the click
  const record: ClickRecord = {
    id: nextId++,
    created_at: new Date().toISOString(),
    airline,
    origin,
    destination,
    flight_date: flightDate,
    price,
    session_id: sessionId,
    user_ip: userIp,
    user_agent: userAgent,
    destination_url: url,
  };

  clickLog.push(record);

  // Keep in-memory log bounded (last 10,000 clicks)
  if (clickLog.length > 10000) {
    clickLog.splice(0, clickLog.length - 10000);
  }

  // TODO: When Vercel Postgres is connected, uncomment:
  // import { sql } from '@vercel/postgres';
  // await sql`INSERT INTO clicks (airline, origin, destination, flight_date, price, session_id, user_ip, user_agent, destination_url)
  //           VALUES (${airline}, ${origin}, ${destination}, ${flightDate}, ${price}, ${sessionId}, ${userIp}, ${userAgent}, ${url})`;

  // 302 redirect to the actual airline booking page
  return NextResponse.redirect(url, 302);
}

// Dashboard data endpoint â returns click stats
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const key = (body as Record<string, string>).key || '';

  // Simple secret key protection for dashboard
  const dashboardKey = process.env.DASHBOARD_KEY || 'aviato-admin-2026';
  if (key !== dashboardKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Aggregate stats from in-memory log
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentClicks = clickLog.filter(c => new Date(c.created_at) >= thirtyDaysAgo);

  // Clicks by airline
  const byAirline: Record<string, number> = {};
  for (const c of recentClicks) {
    byAirline[c.airline] = (byAirline[c.airline] || 0) + 1;
  }

  // Clicks by route
  const byRoute: Record<string, number> = {};
  for (const c of recentClicks) {
    const route = `${c.origin}-${c.destination}`;
    byRoute[route] = (byRoute[route] || 0) + 1;
  }

  // Sort by count descending
  const airlineStats = Object.entries(byAirline)
    .map(([airline, count]) => ({ airline, count }))
    .sort((a, b) => b.count - a.count);

  const routeStats = Object.entries(byRoute)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({
    total_all_time: clickLog.length,
    total_30_days: recentClicks.length,
    by_airline: airlineStats,
    top_routes: routeStats,
    recent: clickLog.slice(-50).reverse().map(c => ({
      id: c.id,
      created_at: c.created_at,
      airline: c.airline,
      origin: c.origin,
      destination: c.destination,
      price: c.price,
    })),
  });
}
