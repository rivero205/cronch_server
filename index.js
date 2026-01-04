const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const routes = require('./routes/index');

// Security: CORS - MUST be first to handle preflight requests
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Security: Helmet for HTTP headers (after CORS)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Security: Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Routes
const reportRoutes = require('./routes/reportRoutes');
const businessRoutes = require('./routes/businessRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes
app.use('/api', routes); // Main routes (assuming products/expenses etc are in routes/index.js? Wait, previous view showed they were individual files?)

// Wait, looking at the previous view of index.js:
// 10: const routes = require('./routes/index');
// 39: // Routes
// 40: app.use('/api', routes);

// It seems there is a 'routes/index.js' that aggregates them. I should check that file.
// If I add them here, I might duplicate or misuse it.
// Let me check 'server/routes/index.js' first if I haven't seen it yet.
// Actually, I saw `list_dir` output earlier showing `expenseRoutes.js`, `productRoutes.js` etc in `server/routes`. 
// I did NOT see `index.js` in `server/routes` in the list_dir output! 
// Wait, step 443 output:
// {"name":"expenseRoutes.js", ...}
// {"name":"index.js", ...}  <-- YES IT IS THERE.

// So I should probably add the new routes to `server/routes/index.js` instead of `server/index.js` if that's how it's structured.
// OR `server/index.js` imports `routes/index.js`.
// Let's verify `server/routes/index.js` content.

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CRUNCH API' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
