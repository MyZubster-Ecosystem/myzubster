const Animal = require('../models/Animal');
const {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation
} = require('../services/locationPrivacyService');

function serializePublicAnimal(animal) {
  const data = typeof animal.toObject === 'function' ? animal.toObject() : { ...animal };
  delete data.privateLocation;
  delete data.owner;
  delete data.ownerEmail;
  data.location = projectPublicLocation(data.location);
  if (data.registeredBy && typeof data.registeredBy === 'object') {
    delete data.registeredBy.email;
  }
  return data;
}

function sendError(res, error, fallback) {
  const status = error instanceof LocationPrivacyError ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: status === 400 ? error.message : fallback,
    code: error.code
  });
}

exports.register = async (req, res) => {
  try {
    const { name, species, breed, age, owner, ownerEmail, location, imageUrl } = req.body;
    if (!name || !species || !owner) {
      return res.status(400).json({
        success: false,
        message: 'Nome, specie e proprietario sono obbligatori'
      });
    }

    // Animal positions are always private at P0. Exact data remains available only
    // to the registrant/admin through the authenticated private endpoint.
    const preparedLocation = prepareLocation(location, { forcePrivate: true });
    const animal = new Animal({
      name,
      species,
      breed,
      age,
      owner,
      ownerEmail,
      location: preparedLocation.publicLocation,
      privateLocation: preparedLocation.privateLocation,
      imageUrl,
      registeredBy: req.userId
    });
    await animal.save();

    return res.status(201).json({
      success: true,
      message: 'Animale registrato con successo',
      data: serializePublicAnimal(animal)
    });
  } catch (error) {
    console.error('Animal registration error:', error);
    return sendError(res, error, 'Errore durante la registrazione dell\'animale');
  }
};

exports.getAll = async (req, res) => {
  try {
    const animals = await Animal.find()
      .select('-privateLocation')
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('registeredBy', 'username');
    return res.json({
      success: true,
      count: animals.length,
      data: animals.map(serializePublicAnimal)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore durante il recupero degli animali' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .select('-privateLocation')
      .populate('registeredBy', 'username');
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animale non trovato' });
    }
    return res.json({ success: true, data: serializePublicAnimal(animal) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore durante il recupero dell\'animale' });
  }
};

exports.getPrivateLocation = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).select('+privateLocation');
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animale non trovato' });
    }
    const isRegistrant = animal.registeredBy && animal.registeredBy.toString() === req.userId;
    if (!isRegistrant && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permessi insufficienti' });
    }

    const payload = animal.privateLocation && typeof animal.privateLocation.toObject === 'function'
      ? animal.privateLocation.toObject()
      : animal.privateLocation;
    return res.json({
      success: true,
      data: {
        location: payload ? decryptExactLocation(payload) : null,
        visibility: 'private',
        consentVersion: animal.location && animal.location.consentVersion,
        consentedAt: animal.location && animal.location.consentedAt
      }
    });
  } catch (error) {
    return sendError(res, error, 'Errore durante il recupero della posizione privata');
  }
};

exports.serializePublicAnimal = serializePublicAnimal;
