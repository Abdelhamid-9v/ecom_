import { Router } from 'express';
import {
  getallProducts,
  getProductById,
  createProduct,
  updateProduct,
  sellProduct,
  deleteProduct,
  getStats,
} from '../controllers/product.controller.js';

const router = Router();

// ─── Stats ───────────────────────────────────────────────────────────────────
// GET /api/products/stats
router.get('/stats', getStats);

// ─── Collection ──────────────────────────────────────────────────────────────
// GET  /api/products              → get all (supports ?category=GPU&search=rtx&sort=price_asc)
// POST /api/products              → create new product
router.get('/',    getallProducts);
router.post('/',   createProduct);

// ─── Single item ─────────────────────────────────────────────────────────────
// GET    /api/products/:id        → get one by id
// PUT    /api/products/:id        → full update (name, price, qty, category, image_url)
// DELETE /api/products/:id        → delete
router.get('/:id',    getProductById);
router.put('/:id',    updateProduct);
router.delete('/:id', deleteProduct);

// ─── Actions ─────────────────────────────────────────────────────────────────
// PATCH /api/products/sell/:id    → decrement stock (body: { quantity: 1 })
router.patch('/sell/:id', sellProduct);

export default router;