const jwt = require('jsonwebtoken');

exports.authenticate = async (req, res, next) => {
  try {
    // Prendi il token dall'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token di autenticazione mancante o non valido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.username = decoded.username;

    next();

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Token non valido o scaduto',
      error: error.message
    });
  }
};

// Anonymous requests remain guests. If a caller supplies a token, validate it
// exactly like a protected route so an invalid token never downgrades silently.
exports.optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return exports.authenticate(req, res, next);
};

// Middleware per verificare il ruolo admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Permessi insufficienti. Richiesto ruolo admin.'
    });
  }
  next();
};

