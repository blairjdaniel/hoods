import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    if (!owner) return NextResponse.json({ error: 'owner required' }, { status: 400 });

    const key = process.env.HELIUS_API_KEY;
    if (!key) return NextResponse.json({ error: 'HELIUS_API_KEY not configured' }, { status: 500 });

    const api = `https://api.helius.xyz/v0/addresses/${owner}/nfts?cluster=devnet&api-key=${key}`;
    const res = await fetch(api);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'helius error', details: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
