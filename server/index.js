const express = require('express');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const settingsRoutes = require('./routes/settings');
const clientRoutes = require('./routes/clients');
const pdfRoutes = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/pdf', pdfRoutes);

app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'landing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app.html'));
});

app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'landing.html'));
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
