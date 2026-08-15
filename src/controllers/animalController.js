const Animal = require('../models/Animal');

// Registra un animale
exports.register = async (req, res) => {
  try {
    const { name, species, breed, age, owner, ownerEmail, location, imageUrl } = req.body;

    if (!name || !species || !owner) {
      return res.status(400).json({
        success: false,
        message: 'Nome, specie e proprietario sono obbligatori'
      });
    }

    const animal = new Animal({
      name,
      species,
      breed,
      age,
      owner,
      ownerEmail,
      location,
      imageUrl,
      registeredBy: req.userId
    });

    await animal.save();

    res.status(201).json({
      success: true,
      message: 'Animale registrato con successo',
      data: animal
    });

  } catch (error) {
    console.error('Animal registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione dell\'animale',
      error: error.message
    });
  }
};

// Lista tutti gli animali
exports.getAll = async (req, res) => {
  try {
    const animals = await Animal.find().sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      count: animals.length,
      data: animals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero degli animali',
      error: error.message
    });
  }
};

// Dettaglio animale
exports.getOne = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animale non trovato'
      });
    }
    res.json({
      success: true,
      data: animal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dell\'animale',
      error: error.message
    });
  }
};
