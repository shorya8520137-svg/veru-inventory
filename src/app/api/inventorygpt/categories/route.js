import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const response = await fetch(`${apiBase}/api/website/categories`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, categories: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, categories: [], error: error.message },
      { status: 500 }
    );
  }
}
