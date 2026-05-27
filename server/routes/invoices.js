const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY date DESC',
      [req.userId]
    );
    res.json(result.rows.map(row => dbRowToInvoice(row)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(dbRowToInvoice(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post('/', async (req, res) => {
  const invoice = req.body;
  const now = new Date().toISOString();
  const lineItems = invoice.lineItems || [];
  const status = invoice.status || 'draft';
  const createdAt = invoice.createdAt || now;
  const updatedAt = invoice.updatedAt || now;

  try {
    const existing = await pool.query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [invoice.id, req.userId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE invoices SET
          number = $1, date = $2, due_date = $3, client_name = $4,
          client_email = $5, client_address = $6, line_items = $7,
          notes = $8, template = $9, accent_color = $10, status = $11,
          updated_at = $12
         WHERE id = $13 AND user_id = $14`,
        [
          invoice.number, invoice.date, invoice.dueDate, invoice.clientName,
          invoice.clientEmail, invoice.clientAddress, JSON.stringify(lineItems),
          invoice.notes, invoice.template, invoice.accentColor, status,
          updatedAt, invoice.id, req.userId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO invoices
          (id, user_id, number, date, due_date, client_name, client_email,
           client_address, line_items, notes, template, accent_color, status,
           created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          invoice.id, req.userId, invoice.number, invoice.date, invoice.dueDate,
          invoice.clientName, invoice.clientEmail, invoice.clientAddress,
          JSON.stringify(lineItems), invoice.notes, invoice.template,
          invoice.accentColor, status, createdAt, updatedAt
        ]
      );
    }
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save invoice' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

function dbRowToInvoice(row) {
  return {
    id: row.id,
    number: row.number,
    date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientAddress: row.client_address,
    lineItems: row.line_items || [],
    notes: row.notes,
    template: row.template,
    accentColor: row.accent_color,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

module.exports = router;
