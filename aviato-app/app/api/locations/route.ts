import { NextRequest, NextResponse } from 'next/server';
import { LOCATIONS } from '@/app/data/locations';
import { getValidDestinations } from '@/app/data/helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');

  if (from) {
    return NextResponse.json(getValidDestinations(from));
  }

  return NextResponse.json(LOCATIONS);
}
