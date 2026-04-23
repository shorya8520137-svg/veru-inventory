require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Trust proxy for CloudFlare and other reverse proxies
app.set('trust proxy', true);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// ===============================
// PASSPORT INITIALIZATION (Google OAuth)
// ===============================
const passport = require('./config/passport');
app.use(passport.initialize());

// ===============================
// DATABASE
// ===============================
require("./db/connection");

// ===============================
// HEALTH CHECK ENDPOINT
// ===============================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// ===============================
// AUTH ROUTES (PUBLIC - NO JWT REQUIRED)
// ===============================
app.use("/api/auth", require("./routes/authRoutes"));

// Google OAuth routes (PUBLIC)
app.use("/auth", require("./routes/googleAuthRoutes"));

// Protected routes example
app.use("/api", require("./routes/protectedRoutes"));

// ===============================
// ROUTES (FRONTEND COMPATIBLE)
// ===============================

// permissions routes (FIRST - before global auth middleware)
app.use('/api', require('./routes/permissionsRoutes'));

// users routes (profile management)
app.use('/api/users', require('./routes/usersRoutes'));

// ===============================
// API KEY AUTHENTICATED ROUTES
// ===============================
// These routes use API key authentication instead of JWT
const apiWebsiteRoutes = require('./routes/apiWebsiteRoutes');
app.use('/api/v1/website', apiWebsiteRoutes);

// Mount API website routes at /api/website for frontend compatibility
// Authentication is handled by the global middleware below
app.use('/api/website', apiWebsiteRoutes);

// ===============================
// PROTECTED ROUTES (JWT REQUIRED)
// ===============================
const { authenticateToken } = require('./middleware/auth');

// Apply JWT authentication to all API routes except auth, permissions, and public website routes
app.use('/api', (req, res, next) => {
    console.log(`🔍 Auth middleware - Path: ${req.path}, Method: ${req.method}`);
    
    // Skip authentication for auth routes and user management (handled in permissionsRoutes)
    if (req.path.startsWith('/auth') || 
        req.path.startsWith('/users') || 
        req.path.startsWith('/roles') || 
        req.path.startsWith('/permissions')) {
        console.log('✅ Skipping auth for auth/user routes');
        return next();
    }
    
    // Skip authentication for website customer auth routes (signup/login are public)
    if (req.path.startsWith('/website-auth/signup') || 
        req.path.startsWith('/website-auth/login') ||
        req.path.startsWith('/website-auth/google')) {
        console.log('✅ Skipping auth for website customer signup/login');
        return next();
    }
    
    // Skip authentication for customer support public endpoints (customer chat)
    // Allow: POST /conversations (create), GET /conversations/:id/messages (fetch), POST /conversations/:id/messages (send)
    if (req.path.startsWith('/customer-support/conversations')) {
        // Allow all conversation creation and message operations without auth
        if (req.method === 'POST' || req.method === 'GET') {
            console.log('✅ Skipping auth for customer support public endpoints');
            return next();
        }
    }
    
    // Skip authentication for public website API routes (products/orders) OR if API key is provided
    // Note: /website-customers is NOT a public route - it requires JWT authentication
    if (req.path.startsWith('/website/') || req.path === '/website') {
        
        // Check if API key is provided in headers
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (apiKey) {
            // Use API key authentication instead of JWT
            console.log('🔑 Using API key authentication for website route');
            const apiKeysController = require('./controllers/apiKeysController');
            return apiKeysController.validateApiKey(req, res, next);
        }
        
        // Skip authentication for GET requests (public access)
        if (req.method === 'GET') {
            console.log('✅ Skipping auth for public website GET routes');
            return next();
        }
        
        // For POST/PUT/DELETE without API key, require JWT
        console.log('🔒 Applying JWT authentication for website write operations');
    }
    
    console.log('🔒 Applying authentication');
    // Apply authentication to all other routes
    authenticateToken(req, res, next);
});

// ── TENANT MIDDLEWARE — inject tenant_id after auth ──
const tenantMiddleware = require('./middleware/tenant');
app.use('/api', tenantMiddleware);

app.use("/api/dispatch", require("./routes/dispatchRoutes"));
app.use("/api/dispatch-beta", require("./routes/dispatchRoutes")); // existing

// 🔥 PRODUCT ROUTES (ADDED)
app.use("/api/products", require("./routes/productRoutes"));

// 🔥 ORDER ROUTES (Shiprocket integration)
app.use("/api/orders", require("./routes/orderRoutes"));

// 🔥 REVIEW ROUTES
app.use("/api", require("./routes/reviewRoutes"));

// 🌐 WEBSITE ROUTES (COMBINED) - DISABLED: Using API key routes above instead
// const websiteProductRoutes = require("./routes/websiteProductRoutes");
// const websiteOrderRoutes = require("./routes/websiteOrderRoutes");

// Mount website product routes - DISABLED: Using API key routes above instead
// app.use("/api/website", websiteProductRoutes);

// Mount website order routes - DISABLED: Using API key routes above instead  
// app.use("/api/website", websiteOrderRoutes);

// inventory routes
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// bulk uplode routes
app.use('/api/bulk-upload', require('./routes/bulkUploadRoutes'));

// damage recovery routes
app.use('/api/damage-recovery', require('./routes/damageRecoveryRoutes'));

// returns routes
app.use('/api/returns', require('./routes/returnsRoutes'));

// timeline routes
app.use('/api/timeline', require('./routes/timelineRoutes'));

// debug routes (temporary for testing)
app.use('/api/debug', require('./routes/debugRoutes'));

// order tracking routes
app.use('/api/order-tracking', require('./routes/orderTrackingRoutes'));

// warehouse order activity routes
app.use('/api/warehouse-order-activity', require('./routes/warehouseOrderActivityRoutes'));

// warehouse address routes (for PDF generation)
app.use('/api', require('./routes/warehouseAddressRoutes'));

// ticket management routes
app.use('/api/tickets', require('./routes/ticketRoutes'));

// orders alias (for frontend compatibility)
app.use('/api/orders', require('./routes/orderTrackingRoutes'));

// self transfer routes
app.use('/api/self-transfer', require('./routes/selfTransferRoutes'));

// notification routes
app.use('/api/notifications', require('./routes/notificationRoutes'));

// two-factor authentication routes
app.use('/api/2fa', require('./routes/twoFactorRoutes'));

// API keys management routes
app.use('/api/api-keys', require('./routes/apiKeysRoutes'));

// profile management routes
app.use('/api/profile', require('./routes/profileRoutes'));

// website customers management routes
app.use('/api/website-customers', require('./routes/websiteCustomersRoutes'));

// website customer authentication routes (for external website)
app.use('/api/website-auth', require('./routes/websiteAuthRoutes'));

// customer support chat routes
app.use('/api/customer-support', require('./routes/customerSupportRoutes'));

// warehouse management routes
app.use('/api/warehouse-management', require('./routes/warehouseManagementRoutes'));

// billing routes (store inventory management)
app.use('/api/billing', require('./routes/billingRoutes'));

// transfer suggestions routes (smart suggestions for source/destination)
app.use('/api/transfer-suggestions', require('./routes/transferSuggestionsRoutes'));

// self transfer routes
app.use('/api/self-transfer', require('./routes/selfTransferRoutes'));

// timeline routes
app.use('/api/timeline', require('./routes/timelineRoutes'));

// auth routes (no /api prefix for backward compatibility)
app.use('/auth', require('./routes/authRoutes'));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Inventory Backend",
        timestamp: new Date().toISOString(),
    });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// ── BACKGROUND JOBS ──
require('./jobs/inventorySnapshotJob');

app.listen(PORT, HOST, () => {
    console.log("======================================");
    console.log("🚀 Inventory Backend Started");
    console.log(`🌍 Port: ${PORT}`);
    console.log("======================================");
});
