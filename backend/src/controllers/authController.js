const User = require('../models/User');
const { ROLES } = require('../models/User');
const { signToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { fullName, email, password, role = 'participant', language = 'en', ndisNumber, subscriptionTier } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Unsupported role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userPayload = { fullName, email, password, role, language };
    if (role !== 'supportWorker') {
      userPayload.ndisNumber = ndisNumber;
      userPayload.subscriptionTier = subscriptionTier;
    }

    const user = await User.create(userPayload);
    const token = signToken(user);

    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  // JWTs are stateless; client discards the token. Endpoint exists for a
  // consistent API surface and a future token-blacklist hook if needed.
  res.status(200).json({ message: 'Logged out' });
}

module.exports = { register, login, logout };
