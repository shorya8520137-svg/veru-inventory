const axios = require('axios');

async function getCompleteToken() {
    try {
        const response = await axios.post('https://api.giftgala.in/api/auth/login', {
            email: 'admin@company.com',
            password: 'Admin@123'
        });
        
        if (response.data.success) {
            console.log('✅ Login successful!');
            console.log('🎫 Complete Token:');
            console.log(response.data.token);
            return response.data.token;
        } else {
            console.log('❌ Login failed:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

getCompleteToken();