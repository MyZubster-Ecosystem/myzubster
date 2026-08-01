const express = require('express');
const router = express.Router();

// Route di test
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

// Registrazione (placeholder)
router.post('/register', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Registrazione utente - da implementare',
    data: req.body 
  });
});

// Login (placeholder)
router.post('/login', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Login utente - da implementare',
    data: req.body 
  });
});

// Profilo (placeholder)
router.get('/profile', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Profilo utente - da implementare'
  });
});

module.exports = router;
