const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all clients for the current user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, address, phone, company, created_at FROM clients WHERE user_id = $1 ORDER BY name ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get a single client by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, address, phone, company, created_at FROM clients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create a new client
router.post('/', async (req, res) => {
  const { name, email, address, phone, company } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Client name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clients (user_id, name, email, address, phone, company)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, address, phone, company, created_at`,
      [req.userId, name.trim(), email || null, address || null, phone || null, company || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'A client with this name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update an existing client
router.put('/:id', async (req, res) => {
  const { name, email, address, phone, company } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Client name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE clients
       SET name = $1, email = $2, address = $3, phone = $4, company = $5
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, email, address, phone, company, created_at`,
      [name.trim(), email || null, address || null, phone || null, company || null, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'A client with this name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
