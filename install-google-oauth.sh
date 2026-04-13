#!/bin/bash

# Install required npm packages for Google OAuth
echo "📦 Installing Google OAuth dependencies..."

npm install passport passport-google-oauth20

echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add to your .env file:"
echo "   GOOGLE_CLIENT_ID=your-google-client-id"
echo "   GOOGLE_CLIENT_SECRET=your-google-client-secret"
echo "   JWT_SECRET=your-secret-key-here"
echo ""
echo "2. Restart your server:"
echo "   npm run server"
echo ""
echo "3. Test the endpoints:"
echo "   GET https://api.giftgala.in/auth/google/status"
echo "   GET https://api.giftgala.in/auth/google (to start login)"
