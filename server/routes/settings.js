const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value FROM settings WHERE user_id = $1',
      [req.userId]
    );
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/bulk', async (req, res) => {
  const settings = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
        [req.userId, key, JSON.stringify(value)]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  } finally {
    client.release();
  }
});

router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM settings WHERE user_id = $1', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear settings' });
  }
});

router.get('/next-invoice-number', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE user_id = $1 AND key = 'invoicePattern'`,
      [req.userId]
    );
    const pattern = result.rows[0]?.value || { prefix: 'INV', year: new Date().getFullYear(), lastNum: 0 };
    const currentYear = new Date().getFullYear();

    if (pattern.year !== currentYear) {
      res.json({ prefix: pattern.prefix || 'INV', year: currentYear, num: 1 });
    } else {
      res.json({ prefix: pattern.prefix || 'INV', year: currentYear, num: (pattern.lastNum || 0) + 1 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get next invoice number' });
  }
});

router.post('/update-invoice-counter', async (req, res) => {
  const { num } = req.body;
  try {
    const currentYear = new Date().getFullYear();
    const result = await pool.query(
      `SELECT value FROM settings WHERE user_id = $1 AND key = 'invoicePattern'`,
      [req.userId]
    );
    const pattern = result.rows[0]?.value || { prefix: 'INV', year: currentYear, lastNum: 0 };
    pattern.year = currentYear;
    pattern.lastNum = num;

    await pool.query(
      `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.userId, 'invoicePattern', JSON.stringify(pattern)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update counter' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value FROM settings WHERE user_id = $1 AND key = $2',
      [req.userId, req.params.key]
    );
    res.json(result.rows[0]?.value ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

router.put('/:key', async (req, res) => {
  const { value } = req.body;
  try {
    await pool.query(
      `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.userId, req.params.key, JSON.stringify(value)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

module.exports = router;
