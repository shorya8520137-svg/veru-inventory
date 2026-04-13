export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward the request to the webhook
    const response = await fetch('http://13.215.172.213:5678/webhook/9d72bb83-50a7-4e2b-a0d4-b36ad271a59d', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return Response.json(
        { error: `Webhook error: ${response.status}` },
        { status: response.status }
      );
    }

    // Try to parse as JSON first, if it fails, treat as plain text
    const contentType = response.headers.get('content-type');
    let content;
    
    if (contentType && contentType.includes('application/json')) {
      content = await response.json();
    } else {
      const text = await response.text();
      content = { output: text };
    }
    
    return Response.json(content);
  } catch (error) {
    console.error('SEO API Error:', error);
    return Response.json(
      { error: 'Failed to generate content', details: error.message },
      { status: 500 }
    );
  }
}
