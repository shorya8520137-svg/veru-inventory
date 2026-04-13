const db = require('./db/connection');
const bcrypt = require('bcrypt');

async function createTestUser() {
    console.log('🔧 Creating test user for order API testing...\n');

    try {
        // Check if test user already exists
        const checkUserQuery = 'SELECT id, username FROM users WHERE username = ? OR email = ?';
        
        db.query(checkUserQuery, ['testuser', 'test@example.com'], async (err, existingUsers) => {
            if (err) {
                console.error('❌ Error checking existing users:', err.message);
                return;
            }

            if (existingUsers.length > 0) {
                console.log('✅ Test user already exists:', existingUsers[0].username);
                console.log('User ID:', existingUsers[0].id);
                console.log('\n🔑 You can use these credentials:');
                console.log('Username: testuser');
                console.log('Password: testpass123');
                process.exit(0);
                return;
            }

            // Create new test user
            console.log('👤 Creating new test user...');
            
            const hashedPassword = await bcrypt.hash('testpass123', 10);
            const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            
            const createUserQuery = `
                INSERT INTO users (
                    id, username, email, password, first_name, last_name, 
                    role, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(createUserQuery, [
                userId,
                'testuser',
                'test@example.com',
                hashedPassword,
                'Test',
                'User',
                'user',
                true,
                new Date()
            ], (err, result) => {
                if (err) {
                    console.error('❌ Error creating test user:', err.message);
                    return;
                }

                console.log('✅ Test user created successfully!');
                console.log('User ID:', userId);
                console.log('\n🔑 Test credentials:');
                console.log('Username: testuser');
                console.log('Password: testpass123');
                console.log('Email: test@example.com');
                
                console.log('\n💡 You can now test the order API with these credentials');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
        process.exit(1);
    }
}

createTestUser();