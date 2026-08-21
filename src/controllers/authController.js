const User = require('../models/User');
const jwt = require('jsonwebtoken');

function isValidMoneroAddress(value) {
  if (!value) return true;
  const address = String(value).trim();
  const alphabet = '[1-9A-HJ-NP-Za-km-z]';
  return new RegExp(`^[48]${alphabet}{94}$`).test(address) || new RegExp(`^4${alphabet}{105}$`).test(address);
}

exports.register = async (req, res) => {
  try {
    const { username, email, password, moneroWallet } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email e password sono obbligatori' });
    }

    if (moneroWallet && !isValidMoneroAddress(moneroWallet)) {
      return res.status(400).json({
        success: false,
        message: 'Indirizzo XMR non valido. Inserisci solo un indirizzo pubblico Monero; non inserire seed phrase o chiavi private.'
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username o email già in uso' });

    const user = new User({
      username,
      email,
      password,
      moneroWallet: moneroWallet ? String(moneroWallet).trim() : null
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          moneroWallet: user.moneroWallet,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Errore durante la registrazione', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email e password sono obbligatori' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Credenziali non valide' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Credenziali non valide' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          moneroWallet: user.moneroWallet,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Errore durante il login', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Errore durante il recupero del profilo', error: error.message });
  }
};
