const express = require('express');
const router = express.Router();

// Simulazione database annunci
let listings = [];

// GET - Lista annunci
router.get('/', (req, res) => {
  res.json({ success: true, count: listings.length, listings });
});

// POST - Crea annuncio
router.post('/create', (req, res) => {
  const { title, category, price, currency, description, location, features, contact, escrow, stock } = req.body;
  if (!title || !category || !price) {
    return res.status(400).json({ error: 'Titolo, categoria e prezzo sono obbligatori' });
  }
  const newListing = {
    id: `LIST-${Date.now()}`,
    title,
    category,
    price,
    currency: currency || 'XMR',
    description: description || '',
    location: location || '',
    features: features || [],
    contact: contact || {},
    escrow: escrow || false,
    stock: stock || 1,
    createdAt: new Date().toISOString()
  };
  listings.push(newListing);
  res.status(201).json({ success: true, listing: newListing });
});

// GET - Dettaglio annuncio
router.get('/:id', (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Annuncio non trovato' });
  res.json({ success: true, listing });
});

module.exports = router;
