const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db/connection');

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://api.giftgala.in/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const picture = profile.photos[0]?.value || null;

        // Check if user exists in website_customers table
        const checkQuery = 'SELECT * FROM website_customers WHERE google_id = ? OR email = ?';
        
        db.query(checkQuery, [googleId, email], (err, users) => {
            if (err) {
                console.error('Database error during Google auth:', err);
                return done(err, null);
            }

            if (users && users.length > 0) {
                // User exists - update google_id if not set and last_login
                const user = users[0];
                
                if (!user.google_id) {
                    const updateQuery = 'UPDATE website_customers SET google_id = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?';
                    db.query(updateQuery, [googleId, user.id], (err) => {
                        if (err) console.error('Error updating google_id:', err);
                    });
                } else {
                    const updateQuery = 'UPDATE website_customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
                    db.query(updateQuery, [user.id], (err) => {
                        if (err) console.error('Error updating last_login:', err);
                    });
                }

                // Return existing user
                return done(null, {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: picture,
                    role: 'customer'
                });
            }

            // User doesn't exist - create new customer
            // Use a dummy password hash for Google OAuth users
            const dummyPasswordHash = 'google_oauth_' + Math.random().toString(36);
            
            const insertQuery = `
                INSERT INTO website_customers (name, email, password_hash, google_id, is_active, created_at)
                VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
            `;

            db.query(insertQuery, [name, email, dummyPasswordHash, googleId], (err, result) => {
                if (err) {
                    console.error('Error creating new Google user:', err);
                    return done(err, null);
                }

                const newUserId = result.insertId;

                // Return new user
                return done(null, {
                    id: newUserId,
                    email: email,
                    name: name,
                    picture: picture,
                    role: 'customer'
                });
            });
        });

    } catch (error) {
        console.error('Error in Google Strategy:', error);
        return done(error, null);
    }
}));

// Serialize user for the session (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session (not used with JWT, but required by Passport)
passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
