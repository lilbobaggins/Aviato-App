import { NextRequest, NextResponse } from 'next/server';
import { getMetroAreaFlights } from '@/app/data/flights';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
  }

  const flights = getMetroAreaFlights(from, to);

  return NextResponse.json({
    from,
    to,
    flights,
    count: flights.length,
  });
}
