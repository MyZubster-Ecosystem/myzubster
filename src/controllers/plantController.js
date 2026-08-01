const Plant = require('../models/Plant');

// Registra una pianta
exports.register = async (req, res) => {
  try {
    const { 
      name, scientificName, species, family, genus, type,
      height, bloomSeason, location, imageUrl, notes,
      conservationStatus, isEdible, isMedicinal
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Nome e specie sono obbligatori'
      });
    }

    const plant = new Plant({
      name,
      scientificName,
      species,
      family,
      genus,
      type,
      height,
      bloomSeason,
      location,
      imageUrl,
      notes,
      conservationStatus,
      isEdible: isEdible || false,
      isMedicinal: isMedicinal || false,
      registeredBy: req.userId
    });

    await plant.save();

    res.status(201).json({
      success: true,
      message: 'Pianta registrata con successo',
      data: plant
    });

  } catch (error) {
    console.error('Plant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione della pianta',
      error: error.message
    });
  }
};

// Lista tutte le piante
exports.getAll = async (req, res) => {
  try {
    const { 
      species, family, type, verified,
      search, limit = 50, page = 1
    } = req.query;

    const query = {};
    if (species) query.species = { $regex: species, $options: 'i' };
    if (family) query.family = { $regex: family, $options: 'i' };
    if (type) query.type = type;
    if (verified !== undefined) query.verified = verified === 'true';

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const plants = await Plant.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('registeredBy', 'username email')
      .populate('verifiedBy', 'username email');

    const total = await Plant.countDocuments(query);

    res.json({
      success: true,
      count: plants.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: plants
    });

  } catch (error) {
    console.error('Get plants error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle piante',
      error: error.message
    });
  }
};

// Dettaglio pianta
exports.getOne = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .populate('registeredBy', 'username email')
      .populate('verifiedBy', 'username email');

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Pianta non trovata'
      });
    }

    res.json({
      success: true,
      data: plant
    });

  } catch (error) {
    console.error('Get plant error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della pianta',
      error: error.message
    });
  }
};

// Aggiorna pianta
exports.update = async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;

    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Pianta non trovata'
      });
    }

    if (plant.registeredBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per modificare questa pianta'
      });
    }

    Object.assign(plant, updates);
    await plant.save();

    res.json({
      success: true,
      message: 'Pianta aggiornata con successo',
      data: plant
    });

  } catch (error) {
    console.error('Update plant error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento della pianta',
      error: error.message
    });
  }
};

// Verifica pianta (solo admin)
exports.verify = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono verificare le piante'
      });
    }

    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Pianta non trovata'
      });
    }

    plant.verified = true;
    plant.verifiedBy = req.userId;
    plant.verifiedAt = new Date();
    await plant.save();

    res.json({
      success: true,
      message: 'Pianta verificata con successo',
      data: plant
    });

  } catch (error) {
    console.error('Verify plant error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica della pianta',
      error: error.message
    });
  }
};

// Elimina pianta
exports.delete = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Pianta non trovata'
      });
    }

    if (plant.registeredBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per eliminare questa pianta'
      });
    }

    await plant.deleteOne();

    res.json({
      success: true,
      message: 'Pianta eliminata con successo'
    });

  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione della pianta',
      error: error.message
    });
  }
};

// Statistiche piante
exports.getStats = async (req, res) => {
  try {
    const total = await Plant.countDocuments();
    const verified = await Plant.countDocuments({ verified: true });
    
    const species = await Plant.aggregate([
      { $group: { _id: '$species', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const types = await Plant.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const conservationStatus = await Plant.aggregate([
      { $group: { _id: '$conservationStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        verified,
        unverified: total - verified,
        topSpecies: species,
        types,
        conservationStatus
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche',
      error: error.message
    });
  }
};
