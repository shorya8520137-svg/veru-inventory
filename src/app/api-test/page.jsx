"use client";

export default function ApiTest() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'NOT SET';
    
    const testApi = async () => {
        try {
            const url = `${apiBase}/api/inventory?limit=10`;
            console.log('Testing:', url);
            const response = await fetch(url);
            const data = await response.json();
            console.log('Response:', data);
            alert('API works! Check console for details.');
        } catch (error) {
            console.error('API Error:', error);
            alert(`API Error: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>API Configuration Test</h1>
            <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <p><strong>NEXT_PUBLIC_API_BASE:</strong></p>
                <code style={{ fontSize: '1.2rem', color: apiBase === 'NOT SET' ? 'red' : 'green' }}>
                    {apiBase}
                </code>
            </div>
            
            <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                <p><strong>Expected URL:</strong></p>
                <code>{process.env.NEXT_PUBLIC_API_BASE}</code>
            </div>

            <button 
                onClick={testApi}
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                }}
            >
                Test API Connection
            </button>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
                <h3>If API Base is "NOT SET":</h3>
                <ol>
                    <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                    <li>Add: <code>NEXT_PUBLIC_API_BASE</code> = <code>{process.env.NEXT_PUBLIC_API_BASE}</code></li>
                    <li>Apply to: Production, Preview, Development</li>
                    <li>Go to Deployments → Redeploy latest deployment</li>
                </ol>
            </div>
        </div>
    );
}
