import { NextRequest, NextResponse } from 'next/server';
import { isAllowedDomain } from '@/app/lib/tracking';
import { neon } from '@neondatabase/serverless';

// Lazy table init â runs CREATE TABLE IF NOT EXISTS on first request
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      airline VARCHAR(50) NOT NULL DEFAULT 'unknown',
      origin VARCHAR(10) DEFAULT '',
      destination VARCHAR(10) DEFAULT '',
      flight_date VARCHAR(20) DEFAULT '',
      price INTEGER DEFAULT 0,
      session_id VARCHAR(100) DEFAULT '',
      user_ip VARCHAR(50) DEFAULT '',
      user_agent TEXT DEFAULT '',
      destination_url VARCHAR(2048) NOT NULL
    )
  `;
  tableReady = true;
}

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

  // Log the click to Postgres
  try {
    await ensureTable();
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO clicks (airline, origin, destination, flight_date, price, session_id, user_ip, user_agent, destination_url)
      VALUES (${airline}, ${origin}, ${destination}, ${flightDate}, ${price}, ${sessionId}, ${userIp}, ${userAgent}, ${url})
    `;
  } catch (error) {
    console.error('Failed to log click:', error);
    // Don't block the redirect if DB write fails
  }

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

  try {
    await ensureTable();
    const sql = neon(process.env.DATABASE_URL!);

    // Total all time
    const totalResult = await sql`SELECT COUNT(*) as count FROM clicks`;
    const totalAllTime = parseInt(totalResult[0].count as string, 10);

    // Total last 30 days
    const recentResult = await sql`
      SELECT COUNT(*) as count FROM clicks
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    const total30Days = parseInt(recentResult[0].count as string, 10);

    // Clicks by airline (last 30 days)
    const airlineResult = await sql`
      SELECT airline, COUNT(*) as count FROM clicks
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY airline
      ORDER BY count DESC
    `;
    const byAirline = airlineResult.map((r: Record<string, unknown>) => ({
      airline: r.airline as string,
      count: parseInt(r.count as string, 10),
    }));

    // Top routes (last 30 days)
    const routeResult = await sql`
      SELECT origin || '-' || destination as route, COUNT(*) as count FROM clicks
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY origin, destination
      ORDER BY count DESC
      LIMIT 20
    `;
    const topRoutes = routeResult.map((r: Record<string, unknown>) => ({
      route: r.route as string,
      count: parseInt(r.count as string, 10),
    }));

    // Recent 50 clicks
    const recentClicks = await sql`
      SELECT id, created_at, airline, origin, destination, price
      FROM clicks
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const recent = recentClicks.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      created_at: (r.created_at as Date).toISOString ? (r.created_at as Date).toISOString() : String(r.created_at),
      airline: r.airline as string,
      origin: r.origin as string,
      destination: r.destination as string,
      price: r.price as number,
    }));

    return NextResponse.json({
      total_all_time: totalAllTime,
      total_30_days: total30Days,
      by_airline: byAirline,
      top_routes: topRoutes,
      recent,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
