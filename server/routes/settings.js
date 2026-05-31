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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT value FROM settings WHERE user_id = $1 AND key = 'invoicePattern' FOR UPDATE`,
      [req.userId]
    );
    const pattern = result.rows[0]?.value || { prefix: 'INV', year: new Date().getFullYear(), lastNum: 0 };
    const currentYear = new Date().getFullYear();

    let num;
    if (pattern.year !== currentYear) {
      pattern.year = currentYear;
      pattern.lastNum = 1;
      num = 1;
    } else {
      num = (pattern.lastNum || 0) + 1;
      pattern.lastNum = num;
    }

    await client.query(
      `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.userId, 'invoicePattern', JSON.stringify(pattern)]
    );

    await client.query('COMMIT');
    res.json({ prefix: pattern.prefix || 'INV', year: currentYear, num });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to get next invoice number' });
  } finally {
    client.release();
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
