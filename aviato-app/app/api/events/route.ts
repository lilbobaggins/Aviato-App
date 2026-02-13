import { NextResponse } from 'next/server';
import { EVENTS } from '@/app/data/events';

export async function GET() {
  return NextResponse.json(EVENTS);
}
