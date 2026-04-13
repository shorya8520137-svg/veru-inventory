import { NextResponse } from 'next/server';

// Try to import Groq, but handle if not available
let Groq;
let groq;

try {
    Groq = require("groq-sdk").default;
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
} catch (error) {
    console.warn('Groq SDK not available, using fallback responses');
}

/**
 * InventoryGPT - AI-Powered Product Assistant
 * Handles customer queries about products with human-like emotional intelligence
 */
export async function POST(req) {
    try {
        const { question, products, categories, conversationHistory } = await req.json();

        if (!question) {
            return NextResponse.json({
                success: false,
                error: 'Question is required'
            }, { status: 400 });
        }

        // If Groq is not available, return a helpful fallback response
        if (!groq) {
            return NextResponse.json({
                success: true,
                answer: `I understand you're asking: "${question}"\n\n` +
                    `I can see you have ${products?.length || 0} products and ${categories?.length || 0} categories in your inventory.\n\n` +
                    `Note: The AI service is currently being configured. In the meantime, I can help you with:\n` +
                    `• Viewing your product catalog\n` +
                    `• Checking stock levels\n` +
                    `• Browsing categories\n\n` +
                    `Please check back soon for full AI-powered assistance! 🚀`,
                model: "fallback",
                tokens: { prompt: 0, completion: 0, total: 0 }
            });
        }

        // Build context from products and categories
        const productContext = products && products.length > 0
            ? `Available Products:\n${JSON.stringify(products, null, 2)}`
            : 'No products available in inventory.';

        const categoryContext = categories && categories.length > 0
            ? `\nProduct Categories:\n${JSON.stringify(categories, null, 2)}`
            : '';

        // Build conversation history
        const historyContext = conversationHistory && conversationHistory.length > 0
            ? `\nPrevious Conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
            : '';

        // Create messages for Groq
        const messages = [
            {
                role: "system",
                content: `You are InventoryGPT, an intelligent and empathetic AI shopping assistant for an e-commerce inventory system.

PERSONALITY & TONE:
- Warm, friendly, and professional
- Show genuine care and understanding
- Use natural, conversational language
- Be enthusiastic about helping customers
- Show empathy when customers are frustrated or confused
- Celebrate with customers when they find what they need

EMOTIONAL INTELLIGENCE:
- Detect customer emotions (excited, frustrated, confused, urgent)
- Respond appropriately to emotional cues
- Use encouraging language for uncertain customers
- Be patient with confused customers
- Show urgency for time-sensitive requests
- Express genuine happiness when solving problems

CAPABILITIES:
- Answer questions about products, prices, availability, and features
- Help customers find the right products for their needs
- Compare products and make recommendations
- Provide detailed product information
- Handle stock availability queries
- Assist with product categories and filtering
- Understand and respond to emotional context

RESPONSE GUIDELINES:
- ONLY use information from the provided product data
- If information is not available, politely say so and offer alternatives
- Be specific with product names, prices, and details
- Format prices clearly with currency symbols
- Use bullet points for multiple items
- Keep responses concise but informative
- Add emojis sparingly to enhance emotional connection (✨, 🎉, 💡, 🛍️, ⭐)
- End with a helpful follow-up question or offer

EMOTIONAL RESPONSE PATTERNS:
- Excited customer: Match their energy, use exclamation marks
- Frustrated customer: Apologize, show understanding, offer quick solutions
- Confused customer: Be patient, explain clearly, offer step-by-step help
- Urgent customer: Acknowledge urgency, provide fast, direct answers
- Browsing customer: Be informative, suggest related products

NEVER:
- Make up product information
- Discuss topics unrelated to the inventory
- Provide information not in the product data
- Be overly formal or robotic
- Ignore emotional cues in customer messages

Remember: You're not just providing information, you're creating a delightful shopping experience! 🛍️✨`
            },
            {
                role: "user",
                content: `${productContext}${categoryContext}${historyContext}

Customer Question: ${question}

Please provide a helpful, emotionally intelligent response based on the available product data.`
            }
        ];

        // Call Groq API
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9,
        });

        const answer = completion.choices[0]?.message?.content;

        if (!answer) {
            throw new Error('No response from AI model');
        }

        return NextResponse.json({
            success: true,
            answer: answer,
            model: "llama3-8b-8192",
            tokens: {
                prompt: completion.usage?.prompt_tokens || 0,
                completion: completion.usage?.completion_tokens || 0,
                total: completion.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('InventoryGPT Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process request',
            fallback: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact our support team for immediate assistance. 🙏"
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        success: true,
        service: 'InventoryGPT',
        status: 'operational',
        model: 'llama3-8b-8192',
        provider: 'Groq',
        capabilities: [
            'Product queries',
            'Price information',
            'Stock availability',
            'Product recommendations',
            'Category browsing',
            'Emotional intelligence',
            'Conversation context'
        ]
    });
}
