const express = require('express');
const router = express.Router();
const plants = require('../data/plants.json');

// GET /api/plants - List all plants
router.get('/', (req, res) => {
  const { season, search } = req.query;
  let results = plants.plants;
  
  if (season) {
    results = results.filter(p => 
      p.season.some(s => s.toLowerCase() === season.toLowerCase())
    );
  }
  
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.scientific.toLowerCase().includes(q)
    );
  }
  
  res.json({
    total: results.length,
    plants: results
  });
});

// GET /api/plants/:name - Get specific plant
router.get('/:name', (req, res) => {
  const plant = plants.plants.find(
    p => p.name.toLowerCase().replace(/\s/g, '-') === req.params.name.toLowerCase()
  );
  
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  
  res.json(plant);
});

// GET /api/plants/recommend/:ph/:temp/:humidity - Get plant recommendations
router.get('/recommend/:ph/:temp/:humidity', (req, res) => {
  const ph = parseFloat(req.params.ph);
  const temp = parseFloat(req.params.temp);
  const humidity = parseFloat(req.params.humidity);
  
  const recommended = plants.plants.filter(p => 
    ph >= p.ph_min && ph <= p.ph_max &&
    temp >= p.temp_min && temp <= p.temp_max &&
    humidity >= p.humidity_min && humidity <= p.humidity_max
  );
  
  res.json({
    conditions: { ph, temperature: temp, humidity },
    recommended_count: recommended.length,
    plants: recommended
  });
});

module.exports = router;
