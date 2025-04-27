const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
//    POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email y password requeridos' });
    }
    const user = new User({ email, password, name });
    await user.save();
    // Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user, token });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Login
//    POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    //Email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }
    //Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }
    // Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user, token });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Error en el servidor' });
  }
});

module.exports = router;
