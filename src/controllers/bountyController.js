const Bounty = require('../models/Bounty');

// Crea un nuovo bounty (solo admin)
exports.create = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono creare bounty'
      });
    }

    const { title, description, issueNumber, issueUrl, repository, amount, prNumber, prUrl } = req.body;

    if (!title || !description || !issueNumber || !issueUrl || !repository || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi obbligatori devono essere compilati'
      });
    }

    // Verifica se il bounty esiste già
    const existing = await Bounty.findOne({ issueNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Bounty per l'issue #${issueNumber} già esistente`
      });
    }

    const bounty = new Bounty({
      title,
      description,
      issueNumber,
      issueUrl,
      repository,
      amount,
      prNumber,
      prUrl,
      createdBy: req.userId
    });

    await bounty.save();

    res.status(201).json({
      success: true,
      message: 'Bounty creato con successo',
      data: bounty
    });

  } catch (error) {
    console.error('Create bounty error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione del bounty',
      error: error.message
    });
  }
};

// Lista tutti i bounty
exports.getAll = async (req, res) => {
  try {
    const { status, repository, limit = 50, page = 1 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (repository) query.repository = repository;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bounties = await Bounty.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email');

    const total = await Bounty.countDocuments(query);

    res.json({
      success: true,
      count: bounties.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: bounties
    });

  } catch (error) {
    console.error('Get bounties error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dei bounty',
      error: error.message
    });
  }
};

// Dettaglio bounty
exports.getOne = async (req, res) => {
  try {
    const bounty = await Bounty.findById(req.params.id)
      .populate('assignedTo', 'username email moneroWallet')
      .populate('createdBy', 'username email');

    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty non trovato'
      });
    }

    res.json({
      success: true,
      data: bounty
    });

  } catch (error) {
    console.error('Get bounty error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del bounty',
      error: error.message
    });
  }
};

// Claim bounty (utente)
exports.claim = async (req, res) => {
  try {
    const { walletAddress, username } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Indirizzo wallet Monero obbligatorio'
      });
    }

    const bounty = await Bounty.findById(req.params.id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty non trovato'
      });
    }

    if (bounty.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Questo bounty non è più disponibile (stato: ${bounty.status})`
      });
    }

    bounty.status = 'in-progress';
    bounty.assignedTo = req.userId;
    bounty.assignedToUsername = username || req.username;
    bounty.assignedToWallet = walletAddress;
    bounty.claimedAt = new Date();
    await bounty.save();

    res.json({
      success: true,
      message: 'Bounty reclamato con successo',
      data: bounty
    });

  } catch (error) {
    console.error('Claim bounty error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il reclamo del bounty',
      error: error.message
    });
  }
};

// Completa bounty (admin)
exports.complete = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono completare i bounty'
      });
    }

    const { paymentTxHash, prNumber, prUrl } = req.body;

    const bounty = await Bounty.findById(req.params.id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty non trovato'
      });
    }

    if (bounty.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Il bounty deve essere in stato "in-progress" per essere completato`
      });
    }

    bounty.status = 'completed';
    bounty.completedAt = new Date();
    if (paymentTxHash) bounty.paymentTxHash = paymentTxHash;
    if (paymentTxHash) bounty.paidAt = new Date();
    if (prNumber) bounty.prNumber = prNumber;
    if (prUrl) bounty.prUrl = prUrl;
    await bounty.save();

    res.json({
      success: true,
      message: 'Bounty completato con successo',
      data: bounty
    });

  } catch (error) {
    console.error('Complete bounty error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il completamento del bounty',
      error: error.message
    });
  }
};

// Cancella bounty (admin)
exports.cancel = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono cancellare i bounty'
      });
    }

    const bounty = await Bounty.findById(req.params.id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty non trovato'
      });
    }

    bounty.status = 'cancelled';
    await bounty.save();

    res.json({
      success: true,
      message: 'Bounty cancellato con successo',
      data: bounty
    });

  } catch (error) {
    console.error('Cancel bounty error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la cancellazione del bounty',
      error: error.message
    });
  }
};

// Statistiche bounty
exports.getStats = async (req, res) => {
  try {
    const total = await Bounty.countDocuments();
    const open = await Bounty.countDocuments({ status: 'open' });
    const inProgress = await Bounty.countDocuments({ status: 'in-progress' });
    const completed = await Bounty.countDocuments({ status: 'completed' });
    const cancelled = await Bounty.countDocuments({ status: 'cancelled' });

    const totalAmount = await Bounty.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const byRepository = await Bounty.aggregate([
      { $group: { _id: '$repository', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        completed,
        cancelled,
        totalPaid: totalAmount.length > 0 ? totalAmount[0].total : 0,
        byRepository
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
