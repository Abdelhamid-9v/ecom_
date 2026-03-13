import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.route.js';

const app = express();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));   // 10mb to allow base64 image_url if needed
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🚀 GearGrid Pro API is running!',
    version: '2.0.0',
    endpoints: {
      products:      'GET    /api/products',
      search:        'GET    /api/products?search=rtx&category=GPU&sort=price_asc',
      stats:         'GET    /api/products/stats',
      getOne:        'GET    /api/products/:id',
      create:        'POST   /api/products',
      update:        'PUT    /api/products/:id',
      sell:          'PATCH  /api/products/sell/:id',
      delete:        'DELETE /api/products/:id',
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

export default app;