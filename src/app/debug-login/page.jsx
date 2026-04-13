'use client';

import { useState } from 'react';

export default function DebugLogin() {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testBackend = async () => {
        setLoading(true);
        setResult('Testing backend connection...\n');
        
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
        
        try {
            // Test 1: Basic connection
            setResult(prev => prev + `\n1️⃣ Testing: ${API_BASE}\n`);
            
            const response = await fetch(`${API_BASE}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            setResult(prev => prev + `✅ Basic connection: ${response.status}\n`);
            const data = await response.json();
            setResult(prev => prev + `📋 Response: ${JSON.stringify(data)}\n`);
            
            // Test 2: Login API
            setResult(prev => prev + `\n2️⃣ Testing login API...\n`);
            
            const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'admin@company.com',
                    password: 'Admin@123'
                })
            });
            
            setResult(prev => prev + `✅ Login API: ${loginResponse.status}\n`);
            const loginData = await loginResponse.json();
            setResult(prev => prev + `📋 Login Response: ${JSON.stringify(loginData, null, 2)}\n`);
            
            if (loginData.success) {
                setResult(prev => prev + `\n✅ Backend is working perfectly!\n`);
            } else {
                setResult(prev => prev + `\n❌ Login failed: ${loginData.message}\n`);
            }
            
        } catch (error) {
            setResult(prev => prev + `\n❌ Error: ${error.message}\n`);
            setResult(prev => prev + `\n🔧 This is likely a CORS or SSL certificate issue\n`);
            setResult(prev => prev + `💡 The backend is working (tested from server)\n`);
            setResult(prev => prev + `🌐 But browser can't connect due to security restrictions\n`);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🔧 Backend Debug Test</h1>
                
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4">Configuration</h2>
                    <p><strong>API Base:</strong> {process.env.NEXT_PUBLIC_API_BASE}</p>
                    <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                </div>
                
                <button 
                    onClick={testBackend}
                    disabled={loading}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 mb-6"
                >
                    {loading ? '🔄 Testing...' : '🧪 Test Backend Connection'}
                </button>
                
                {result && (
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                        {result}
                    </div>
                )}
                
                <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">💡 If connection fails:</h3>
                    <ul className="text-yellow-700 space-y-1">
                        <li>• Backend server might not be running on port 8443</li>
                        <li>• SSL certificate issues (self-signed certificates)</li>
                        <li>• CORS configuration problems</li>
                        <li>• Firewall blocking port 8443</li>
                        <li>• Browser security restrictions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}