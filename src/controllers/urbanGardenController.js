const UrbanGarden = require('../models/urbanGardenModel');
const { v4: uuidv4 } = require('uuid');

exports.createGarden = async (req, res) => {
  try {
    const {name, ownerId, category, lat, lng, address, size} = req.body;
    if (!name || !ownerId || !category || lat === undefined || lng === undefined)
      return res.status(400).json({error: 'name, ownerId, category, lat, lng required'});
    const g = new UrbanGarden({gardenId: uuidv4().substring(0,12), name, ownerId, category, location: {lat, lng, address}, size: size||'small'});
    await g.save();
    res.status(201).json({message: 'Garden created', gardenId: g.gardenId});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.getGardens = async (req, res) => {
  try {
    const {category, lat, lng, maxDist} = req.query;
    let query = UrbanGarden.find({isPublic: true});
    if (category) query = UrbanGarden.findByCategory(category);
    else if (lat && lng) query = UrbanGarden.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(maxDist||1));
    const gardens = await query.sort({createdAt: -1}).limit(100);
    res.json({count: gardens.length, gardens});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.getGarden = async (req, res) => {
  try {
    const g = await UrbanGarden.findOne({gardenId: req.params.gardenId});
    if (!g) return res.status(404).json({error: 'Not found'});
    res.json(g);
  } catch (e) { res.status(500).json({error: e.message}); }
};
