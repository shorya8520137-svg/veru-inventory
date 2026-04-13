# Veru Inventory Management System

A comprehensive inventory management system built with Next.js, Node.js, and MySQL.

## Features

- 📦 Product Management
- 🛒 Website Orders Management
- 👥 Customer Management
- 💬 Customer Support Chat
- 🤖 AI-Powered InventoryGPT
- ⭐ Product Reviews
- 🎬 Product Reels
- 📊 Warehouse Management
- 🔐 Role-Based Access Control
- 🔒 Two-Factor Authentication

## Tech Stack

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- Lucide Icons

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication

### Cloud Services
- Cloudinary (Media Storage)
- Vercel (Deployment)

## Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/shorya8520137-svg/veru-inventory.git
cd veru-inventory
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=inventory_db
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Set up the database
```bash
mysql -u root -p < setup-database.sql
```

5. Run the development server
```bash
# Frontend
npm run dev

# Backend (in another terminal)
node server.js
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
veru-inventory/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   └── lib/             # Utility functions
├── controllers/          # Backend controllers
├── routes/              # API routes
├── public/              # Static files
├── server.js            # Backend server
└── package.json
```

## Key Features

### Product Management
- Add, edit, delete products
- Bulk upload via CSV
- Category management
- Stock tracking

### Order Management
- Website orders
- Warehouse orders
- Order tracking
- Dispatch management

### Customer Support
- Real-time chat
- Conversation history
- AI-powered responses
- Rating system

### Reels Section
- Auto-playing video reels
- Product showcases
- Cloudinary integration

### Security
- JWT authentication
- 2FA support
- Role-based permissions
- Audit logging

## API Documentation

API endpoints are available at `/api/*`

Key endpoints:
- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/customers` - Customer management
- `/api/support` - Customer support
- `/api/auth` - Authentication

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Server)
```bash
pm2 start server.js --name veru-inventory
```

## Database Backup

To backup the database:
```bash
mysqldump -u root -p inventory_db > backup.sql
```

To restore:
```bash
mysql -u root -p inventory_db < backup.sql
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For support, email support@veru-inventory.com

## Authors

- Development Team

## Acknowledgments

- Next.js team
- React community
- All contributors
