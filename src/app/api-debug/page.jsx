"use client";

export default function ApiDebugPage() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    
    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#f0f0f0', minHeight: '100vh' }}>
            <h1 style={{ color: '#333' }}>🔍 API Debug Information</h1>
            
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', border: '2px solid #ddd', borderRadius: '8px' }}>
                <strong>Current NEXT_PUBLIC_API_BASE:</strong> 
                <div style={{ fontSize: '18px', color: '#e74c3c', fontWeight: 'bold', marginTop: '5px' }}>
                    {apiBase || 'NOT SET'}
                </div>
            </div>
            
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', border: '2px solid #27ae60', borderRadius: '8px' }}>
                <strong>Expected (NEW IP):</strong> 
                <div style={{ fontSize: '18px', color: '#27ae60', fontWeight: 'bold', marginTop: '5px' }}>
                    https://16.171.5.50.nip.io
                </div>
            </div>
            
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', border: '2px solid #e74c3c', borderRadius: '8px' }}>
                <strong>OLD IP (should NOT be this):</strong> 
                <div style={{ fontSize: '18px', color: '#e74c3c', fontWeight: 'bold', marginTop: '5px' }}>
                    https://16.171.196.15.nip.io
                </div>
            </div>
            
            <div style={{ 
                background: apiBase === 'https://16.171.5.50.nip.io' ? '#d4edda' : '#f8d7da', 
                padding: '15px', 
                margin: '10px 0',
                border: `2px solid ${apiBase === 'https://16.171.5.50.nip.io' ? '#27ae60' : '#e74c3c'}`,
                borderRadius: '8px'
            }}>
                <strong>Status:</strong> 
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
                    {apiBase === 'https://16.171.5.50.nip.io' ? '✅ CORRECT - Using NEW IP' : '❌ WRONG - Still using OLD IP'}
                </div>
            </div>
            
            <h2 style={{ color: '#333', marginTop: '30px' }}>🧪 Test API Connection</h2>
            <button 
                onClick={async () => {
                    try {
                        console.log('Testing API:', apiBase);
                        const response = await fetch(`${apiBase}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: 'admin@company.com', password: 'admin@123' })
                        });
                        const data = await response.json();
                        console.log('API Response:', response.status, data);
                        alert(`API Test Result:\nStatus: ${response.status}\nSuccess: ${data.success}\nUsing: ${apiBase}`);
                    } catch (error) {
                        console.error('API Error:', error);
                        alert(`API Error: ${error.message}\nUsing: ${apiBase}`);
                    }
                }}
                style={{ 
                    padding: '15px 30px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}
            >
                🚀 Test Current API Endpoint
            </button>
            
            <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
                <h3 style={{ color: '#856404' }}>💡 If showing OLD IP:</h3>
                <ol style={{ color: '#856404' }}>
                    <li>Vercel environment variables might be overriding local .env.local</li>
                    <li>Build cache might be using old values</li>
                    <li>Need to clear Vercel cache and redeploy</li>
                </ol>
            </div>
        </div>
    );
}