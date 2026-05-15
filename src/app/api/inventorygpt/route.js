import { NextResponse } from 'next/server';
import { tryInsoraOppsDataAnswer } from '@/lib/insoraOppsOpsAnswer';
import { buildInventoryGptBrainContext } from '@/lib/inventorygptBrainContext';

let Groq;
let groq;

try {
  Groq = require('groq-sdk').default;
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch {
  console.warn('Groq SDK not available, using fallback responses');
}

export async function POST(req) {
  try {
    const { question, products, categories, conversationHistory, authToken } =
      await req.json();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });
    }

    const opsAnswer = await tryInsoraOppsDataAnswer(question, authToken || '');
    if (opsAnswer?.answer) {
      return NextResponse.json({
        success: true,
        answer: opsAnswer.answer,
        model: 'deterministic',
        exportTsv: opsAnswer.exportTsv || undefined,
        exportFilename: opsAnswer.exportFilename || undefined
      });
    }

    let brain = null;
    if (authToken) {
      try {
        brain = await buildInventoryGptBrainContext(authToken, { productLimit: 40 });
      } catch (e) {
        console.warn('[InventoryGPT] brain:', e?.message);
      }
    }

    const prods =
      brain?.inventoryPreview?.length ? brain.inventoryPreview : Array.isArray(products) ? products : [];
    const cats = Array.isArray(categories) ? categories : [];

    if (!groq) {
      const p = prods.length;
      const c = cats.length;
      return NextResponse.json({
        success: true,
        answer:
          `Thanks for your message.\n\n` +
          `I have **${p}** live inventory row(s) and **${c}** categories in context. ` +
          `Ask about stock at a warehouse (e.g. GGM_WH), a barcode price, or website products.`,
        model: 'fallback'
      });
    }

    const productContext =
      prods.length > 0
        ? `Live inventory sample:\n${JSON.stringify(prods.slice(0, 30), null, 2)}`
        : 'No live inventory rows in context.';

    const categoryContext =
      cats.length > 0 ? `\nCategories:\n${JSON.stringify(cats.slice(0, 20), null, 2)}` : '';

    const historyContext =
      conversationHistory?.length > 0
        ? `\nPrevious:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}`
        : '';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are InsoraOpps (InventoryGPT), an inventory intelligence copilot for Indian e-commerce ops.
Use live inventory data when provided. Default currency is INR (₹). Be concise and practical.
Never expose SQL errors, internal APIs, or "Source:" labels. If data is missing, say so clearly.`
        },
        {
          role: 'user',
          content: `${productContext}${categoryContext}${historyContext}\n\nQuestion: ${question}`
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.6,
      max_tokens: 1024
    });

    const answer = completion.choices[0]?.message?.content;
    if (!answer) throw new Error('No response from AI model');

    return NextResponse.json({
      success: true,
      answer,
      model: 'llama3-8b-8192'
    });
  } catch (error) {
    console.error('InventoryGPT Error:', error);
    return NextResponse.json(
      {
        success: false,
        fallback:
          "I'm having trouble right now. Please try again in a moment or ask about warehouse stock (e.g. stock at GGM_WH)."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'InsoraOpps / InventoryGPT',
    status: 'operational'
  });
}
