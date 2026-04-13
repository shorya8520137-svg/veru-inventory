/**
 * DEBUG ORDER TRACKING 403 ERROR
 * This script will help identify why the /api/order-tracking endpoint is returning 403
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

console.log('🔍 DEBUGGING ORDER TRACKING 403 ERROR');
console.log('=' .repeat(50));

// Test with different users to identify the issue
const testUsers = [
    {
        name: 'Test User (Warehouse Staff)',
        email: 'test@hunyhuny.com',
        password: 'test123'
    },
    {
        name: 'Admin User',
        email: 'admin@company.com', 
        password: 'admin123'
    }
];

const debugLogin = async (credentials) => {
    try {
        console.log(`\n🔐 Testing login for: ${credentials.email}`);
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Login successful');
            console.log('👤 User ID:', data.user.id);
            console.log('👤 User role:', data.user.role);
            console.log('👤 Role ID:', data.user.role_id);
            console.log('🔑 Token length:', data.token.length);
            
            // Decode JWT to see what's inside
            const tokenParts = data.token.split('.');
            if (tokenParts.length === 3) {
                try {
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    console.log('🎫 JWT Payload:', JSON.stringify(payload, null, 2));
                } catch (e) {
                    console.log('❌ Could not decode JWT payload');
                }
            }
            
            return data.token;
        } else {
            console.log('❌ Login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
};

const debugOrderTrackingAPI = async (token, userInfo) => {
    try {
        console.log(`\n📋 Testing /api/order-tracking for ${userInfo}...`);
        
        const response = await fetch(`${API_BASE}/api/order-tracking`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📊 Raw response:', responseText);
        
        try {
            const data = JSON.parse(responseText);
            
            if (response.status === 200) {
                console.log('✅ Order tracking API access successful');
                console.log('📊 Orders returned:', data.data?.length || 0);
            } else if (response.status === 403) {
                console.log('❌ 403 Forbidden - Permission denied');
                console.log('🔍 Error details:', data.message);
                console.log('🔑 Required permission:', data.required_permission);
                console.log('👤 User role:', data.user_role);
            } else if (response.status === 401) {
                console.log('❌ 401 Unauthorized - Token issue');
                console.log('🔍 Error details:', data.message);
                console.log('🔍 Error code:', data.error);
            } else {
                console.log(`❌ API call failed with status ${response.status}`);
                console.log('🔍 Error:', data.message || data);
            }
        } catch (parseError) {
            console.log('❌ Could not parse response as JSON:', responseText);
        }
        
    } catch (error) {
        console.error('❌ Order tracking API error:', error.message);
    }
};

const debugUserPermissions = async (token, userInfo) => {
    try {
        console.log(`\n🔑 Checking permissions for ${userInfo}...`);
        
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ User info retrieved');
            console.log('👤 User:', data.user.name, '(' + data.user.email + ')');
            console.log('🏢 Role:', data.user.role);
            console.log('🔑 Permissions:', data.user.permissions || 'No permissions returned');
        } else {
            console.log('❌ Could not retrieve user info');
        }
        
    } catch (error) {
        console.error('❌ User permissions error:', error.message);
    }
};

const runDebug = async () => {
    console.log('🚀 Starting order tracking 403 debug...\n');
    
    for (const user of testUsers) {
        console.log('\n' + '=' .repeat(60));
        console.log(`DEBUGGING: ${user.name.toUpperCase()}`);
        console.log('=' .repeat(60));
        
        const token = await debugLogin(user);
        if (token) {
            await debugUserPermissions(token, user.name);
            await debugOrderTrackingAPI(token, user.name);
        }
    }
    
    console.log('\n🏁 Debug completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check if users have the right permissions in the database');
    console.log('2. Verify JWT token is being passed correctly');
    console.log('3. Check if checkWarehousePermission middleware is working');
    console.log('4. Verify database connection and permission queries');
};

// Run the debug
runDebug().catch(console.error);