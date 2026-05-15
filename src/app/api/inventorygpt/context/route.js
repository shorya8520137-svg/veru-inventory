import { NextResponse } from 'next/server';
import { buildInventoryGptBrainContext } from '@/lib/inventorygptBrainContext';

export async function GET(req) {
  try {
    const token =
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
      '';

    const brain = await buildInventoryGptBrainContext(token, {
      productLimit: 80,
      warehouseLimit: 100
    });

    return NextResponse.json({
      success: true,
      brain,
      preview: {
        inventory: brain.inventoryPreview,
        website: brain.websiteProducts,
        dispatch: []
      }
    });
  } catch (error) {
    console.error('[inventorygpt/context]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load context' },
      { status: 500 }
    );
  }
}
