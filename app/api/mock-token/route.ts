import { NextResponse } from 'next/server';

export async function GET() {
  const json = await fetch(new URL('/metadata/3tD7BZSHoM.json', process.cwd()).toString()).then(r => r.text());
  return new NextResponse(json, {
    headers: { 'Content-Type': 'application/json' }
  });
}
