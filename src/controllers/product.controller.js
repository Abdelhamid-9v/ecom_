import pool from '../config/db.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['GPU', 'CPU', 'RAM', 'Storage', 'Peripherals', 'Monitors', 'Other'];

function calcPricing(purchase_price) {
  const price    = parseFloat(purchase_price);
  const shipping = 50;
  const customs  = price * 0.23;          // 23% diwana
  const costTotal  = price + shipping + customs;
  const finalPrice = costTotal * 1.20;    // +20% profit margin
  return { shipping, customs, costTotal, finalPrice };
}

// ─── GET ALL ─────────────────────────────────────────────────────────────────
export const getallProducts = async (req, res) => {
  try {
    // Optional: ?category=GPU&search=rtx&sort=price_asc
    const { category, search, sort } = req.query;

    let sql    = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && VALID_CATEGORIES.includes(category)) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    const sortMap = {
      price_asc:  'purchase_price ASC',
      price_desc: 'purchase_price DESC',
      name_asc:   'name ASC',
      name_desc:  'name DESC',
      newest:     'created_at DESC',
      oldest:     'created_at ASC',
    };
    sql += ` ORDER BY ${sortMap[sort] || 'created_at DESC'}`;

    const products = await pool.query(sql, params);
    res.json(products);
  } catch (err) {
    console.error('[getallProducts]', err);
    res.status(500).json({ error: 'Server error while fetching products.' });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[getProductById]', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
  const { name, purchase_price, quantity = 0, category = 'Other', image_url = null } = req.body;

  // Validation
  if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required.' });
  if (!purchase_price || isNaN(purchase_price) || purchase_price <= 0)
    return res.status(400).json({ error: 'A valid purchase price is required.' });
  if (isNaN(quantity) || quantity < 0)
    return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });

  const { customs, costTotal, finalPrice } = calcPricing(purchase_price);

  try {
    const result = await pool.query(
      'INSERT INTO products (name, purchase_price, quantity, category, image_url) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), purchase_price, quantity, category, image_url]
    );

    // ✅ Return the full created product (id needed by frontend for image linking)
    const newId = Number(result.insertId);
    const rows  = await pool.query('SELECT * FROM products WHERE id = ?', [newId]);

    res.status(201).json({
      ...rows[0],
      pricing: {
        buying_price:             parseFloat(purchase_price).toFixed(2) + ' DH',
        estimated_customs:        customs.toFixed(2) + ' DH',
        total_cost:               costTotal.toFixed(2) + ' DH',
        recommended_selling_price: finalPrice.toFixed(2) + ' DH',
      },
    });
  } catch (err) {
    console.error('[createProduct]', err);
    res.status(500).json({ error: 'Server error while creating product.' });
  }
};

// ─── UPDATE (full edit) ───────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, purchase_price, quantity, category, image_url } = req.body;

  // At least one field required
  if (!name && purchase_price === undefined && quantity === undefined && !category && image_url === undefined)
    return res.status(400).json({ error: 'Nothing to update.' });

  if (category && !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });

  if (purchase_price !== undefined && (isNaN(purchase_price) || purchase_price <= 0))
    return res.status(400).json({ error: 'Invalid purchase price.' });

  if (quantity !== undefined && (isNaN(quantity) || quantity < 0))
    return res.status(400).json({ error: 'Quantity must be non-negative.' });

  try {
    // Build dynamic SET clause
    const fields  = [];
    const params  = [];

    if (name)                     { fields.push('name = ?');           params.push(name.trim()); }
    if (purchase_price !== undefined) { fields.push('purchase_price = ?'); params.push(purchase_price); }
    if (quantity !== undefined)   { fields.push('quantity = ?');       params.push(quantity); }
    if (category)                 { fields.push('category = ?');       params.push(category); }
    if (image_url !== undefined)  { fields.push('image_url = ?');      params.push(image_url); }

    params.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Product not found.' });

    const updated = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated successfully! ✅', product: updated[0] });
  } catch (err) {
    console.error('[updateProduct]', err);
    res.status(500).json({ error: 'Server error while updating product.' });
  }
};

// ─── SELL (decrement stock by 1) ─────────────────────────────────────────────
export const sellProduct = async (req, res) => {
  const { id } = req.params;
  const qty = parseInt(req.body?.quantity) || 1; // optional: sell multiple

  if (qty < 1) return res.status(400).json({ error: 'Quantity to sell must be at least 1.' });

  try {
    // Check current stock first
    const rows = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });

    const product = rows[0];
    if (product.quantity < qty)
      return res.status(400).json({ error: `Not enough stock. Available: ${product.quantity}` });

    await pool.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [qty, id]
    );

    const updated = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({
      message: `Sold ${qty} unit(s) successfully! 💰`,
      product: updated[0],
    });
  } catch (err) {
    console.error('[sellProduct]', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Product not found or already deleted.' });

    res.json({ message: 'Product deleted successfully! 🗑️', id: Number(id) });
  } catch (err) {
    console.error('[deleteProduct]', err);
    res.status(500).json({ error: 'Server error while deleting product.' });
  }
};

// ─── STATS (bonus endpoint) ───────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [totals] = await pool.query(`
      SELECT
        COUNT(*)                          AS total_products,
        SUM(quantity)                     AS total_stock,
        ROUND(AVG(purchase_price), 2)     AS avg_price,
        ROUND(MIN(purchase_price), 2)     AS min_price,
        ROUND(MAX(purchase_price), 2)     AS max_price,
        SUM(quantity * purchase_price)    AS total_inventory_value,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock
      FROM products
    `);

    const byCategory = await pool.query(`
      SELECT category, COUNT(*) AS count, SUM(quantity) AS stock
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({ summary: totals, by_category: byCategory });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ error: 'Server error.' });
  }
};