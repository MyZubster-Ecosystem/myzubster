const express = require('express');
const router = express.Router();

// Lista bounty
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// Statistiche bounty
router.get('/stats', (req, res) => {
  res.json({ success: true, data: { total: 0, completed: 0, inProgress: 0, open: 0 } });
});

// Crea bounty
router.post('/create', (req, res) => {
  res.json({ success: true, message: 'Bounty creato' });
});

// Assegna bounty
router.patch('/:id/assign', (req, res) => {
  res.json({ success: true, message: 'Bounty assegnato' });
});

// Completa bounty
router.patch('/:id/complete', (req, res) => {
  res.json({ success: true, message: 'Bounty completato' });
});

// Cancella bounty
router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Bounty cancellato' });
});

module.exports = router;
