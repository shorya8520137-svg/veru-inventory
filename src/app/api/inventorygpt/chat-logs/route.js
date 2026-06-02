import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'https://api.giftgala.in';

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/inventorygpt/chat-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const res = await fetch(`${API_BASE}/api/inventorygpt/chat-logs?${queryString}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
