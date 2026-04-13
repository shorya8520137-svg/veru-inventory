import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const response = await fetch(`${apiBase}/api/website/products`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, products: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, products: [], error: error.message },
      { status: 500 }
    );
  }
}
