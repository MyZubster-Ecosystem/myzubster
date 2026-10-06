const Plant = require('../models/Plant');
const {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation
} = require('../services/locationPrivacyService');

function isSensitivePlant(conservationStatus) {
  return ['endangered', 'critically-endangered'].includes(conservationStatus);
}

function serializePublicPlant(plant) {
  const data = typeof plant.toObject === 'function' ? plant.toObject() : { ...plant };
  delete data.privateLocation;
  data.location = projectPublicLocation(data.location);

  if (data.registeredBy && typeof data.registeredBy === 'object') {
    delete data.registeredBy.email;
  }
  if (data.verifiedBy && typeof data.verifiedBy === 'object') {
    delete data.verifiedBy.email;
  }

  return data;
}

function sendControllerError(res, error, fallbackMessage) {
  const status = error instanceof LocationPrivacyError ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: status === 400 ? error.message : fallbackMessage,
    code: error.code
  });
}

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

    const preparedLocation = prepareLocation(location, {
      forcePrivate: isSensitivePlant(conservationStatus)
    });

    const plant = new Plant({
      name,
      scientificName,
      species,
      family,
      genus,
      type,
      height,
      bloomSeason,
      location: preparedLocation.publicLocation,
      privateLocation: preparedLocation.privateLocation,
      imageUrl,
      notes,
      conservationStatus,
      isEdible: isEdible || false,
      isMedicinal: isMedicinal || false,
      registeredBy: req.userId
    });

    await plant.save();

    return res.status(201).json({
      success: true,
      message: 'Pianta registrata con successo',
      data: serializePublicPlant(plant)
    });
  } catch (error) {
    console.error('Plant registration error:', error);
    return sendControllerError(res, error, 'Errore durante la registrazione della pianta');
  }
};

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
    if (search) query.$text = { $search: search };

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const plants = await Plant.find(query)
      .select('-privateLocation')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('registeredBy', 'username')
      .populate('verifiedBy', 'username');

    const total = await Plant.countDocuments(query);

    return res.json({
      success: true,
      count: plants.length,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
      data: plants.map(serializePublicPlant)
    });
  } catch (error) {
    console.error('Get plants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle piante'
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .select('-privateLocation')
      .populate('registeredBy', 'username')
      .populate('verifiedBy', 'username');

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Pianta non trovata'
      });
    }

    return res.json({
      success: true,
      data: serializePublicPlant(plant)
    });
  } catch (error) {
    console.error('Get plant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della pianta'
    });
  }
};

exports.getPrivateLocation = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id).select('+privateLocation');
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Pianta non trovata' });
    }

    const isOwner = plant.registeredBy && plant.registeredBy.toString() === req.userId;
    if (!isOwner && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per leggere la posizione privata'
      });
    }

    const exact = plant.privateLocation
      ? decryptExactLocation(plant.privateLocation.toObject
        ? plant.privateLocation.toObject()
        : plant.privateLocation)
      : null;

    return res.json({
      success: true,
      data: {
        location: exact,
        visibility: plant.location && plant.location.visibility,
        consentVersion: plant.location && plant.location.consentVersion,
        consentedAt: plant.location && plant.location.consentedAt
      }
    });
  } catch (error) {
    console.error('Get private plant location error:', error);
    return sendControllerError(res, error, 'Errore durante il recupero della posizione privata');
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.createdAt;
    delete updates.registeredBy;
    delete updates.verified;
    delete updates.verifiedBy;
    delete updates.verifiedAt;
    delete updates.privateLocation;

    const plant = await Plant.findById(req.params.id).select('+privateLocation');
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

    if (Object.prototype.hasOwnProperty.call(updates, 'location')) {
      const preparedLocation = prepareLocation(updates.location, {
        forcePrivate: isSensitivePlant(updates.conservationStatus || plant.conservationStatus)
      });
      updates.location = preparedLocation.publicLocation;
      updates.privateLocation = preparedLocation.privateLocation;
    }

    Object.assign(plant, updates);
    await plant.save();

    return res.json({
      success: true,
      message: 'Pianta aggiornata con successo',
      data: serializePublicPlant(plant)
    });
  } catch (error) {
    console.error('Update plant error:', error);
    return sendControllerError(res, error, 'Errore durante l\'aggiornamento della pianta');
  }
};

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
      return res.status(404).json({ success: false, message: 'Pianta non trovata' });
    }

    plant.verified = true;
    plant.verifiedBy = req.userId;
    plant.verifiedAt = new Date();
    await plant.save();

    return res.json({
      success: true,
      message: 'Pianta verificata con successo',
      data: serializePublicPlant(plant)
    });
  } catch (error) {
    console.error('Verify plant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante la verifica della pianta'
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Pianta non trovata' });
    }

    if (plant.registeredBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per eliminare questa pianta'
      });
    }

    await plant.deleteOne();
    return res.json({ success: true, message: 'Pianta eliminata con successo' });
  } catch (error) {
    console.error('Delete plant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione della pianta'
    });
  }
};

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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche'
    });
  }
};
