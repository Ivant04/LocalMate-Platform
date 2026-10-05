const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const HelperProfile = require('../models/HelperProfile');
const { JWT_SECRET } = require('../middleware/auth');

const formatUserResponse = async (user, token) => {
  const helperProfile = await HelperProfile.findOne({ userId: user._id.toString() });
  return {
    token,
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    status: user.status,
    gender: user.gender || 'Nam',
    location: user.location || 'Việt Nam',
    birthDate: user.birthDate || '',
    nationality: user.nationality || 'VN',
    address: user.address || (helperProfile ? helperProfile.fullAddress : ''),
    bio: user.bio || (helperProfile ? helperProfile.bio : ''),
    prefLang: user.prefLang || 'en',
    prefCurrency: user.prefCurrency || 'USD',
    notifBookings: user.notifBookings !== undefined ? user.notifBookings : true,
    notifMessages: user.notifMessages !== undefined ? user.notifMessages : true,
    notifPromos: user.notifPromos !== undefined ? user.notifPromos : false,
    hourlyRate: helperProfile ? helperProfile.hourlyRate : undefined,
  };
};

// Generate JWT token matching Java backend
const generateToken = (email) => {
  return jwt.sign({ sub: email, email }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already in use!' });
    }

    let userRole = role ? role.toUpperCase() : 'TRAVELER';
    if (!userRole.startsWith('ROLE_')) {
      userRole = 'ROLE_' + userRole;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName || normalizedEmail.split('@')[0],
      phone: phone || '+84 901 234 567',
      roles: [userRole],
      status: 'ACTIVE',
      gender: 'Nam',
      location: 'Việt Nam',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    });

    await user.save();

    // If registering as Helper, create initial HelperProfile
    if (userRole === 'ROLE_HELPER') {
      const helperProfile = new HelperProfile({
        userId: user._id.toString(),
        title: 'Local Helper',
        bio: `Hello, I am ${user.fullName}! Excited to show you around.`,
        city: 'Da Nang',
        languages: ['English', 'Vietnamese'],
        skills: ['Local Exploration', 'Food Tour'],
        hourlyRate: 15.0,
        rating: 5.0,
        reviewCount: 0,
        verified: false,
        availabilityStatus: 'AVAILABLE',
      });
      await helperProfile.save();
    }

    const token = generateToken(user.email);
    const responseData = await formatUserResponse(user, token);
    return res.json(responseData);
  } catch (error) {
    return res.status(400).json({ message: 'Registration failed: ' + error.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: 'Incorrect email or password!' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password!' });
    }

    const token = generateToken(user.email);
    const responseData = await formatUserResponse(user, token);
    return res.json(responseData);
  } catch (error) {
    return res.status(401).json({ message: 'Incorrect email or password!' });
  }
});

// POST /api/v1/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, email, fullName, avatarUrl } = req.body;
    let userEmail = null;
    let userName = null;
    let userPicture = null;

    if (credential && credential.trim()) {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
        const response = await axios.get(verifyUrl);
        if (response.data && response.data.email) {
          userEmail = response.data.email;
          userName = response.data.name;
          userPicture = response.data.picture;
        }
      } catch (err) {
        if (!email) {
          return res.status(400).json({ message: 'Invalid Google token: ' + err.message });
        }
      }
    }

    // Fallback for demo mode
    if (!userEmail && email && email.trim()) {
      userEmail = email;
      userName = fullName || email.split('@')[0];
      userPicture = avatarUrl;
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'Unable to retrieve email from Google account!' });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = new User({
        email: normalizedEmail,
        fullName: userName || normalizedEmail.split('@')[0],
        password: randomPassword,
        avatarUrl: userPicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        roles: ['ROLE_TRAVELER'],
        status: 'ACTIVE',
        gender: 'Nam',
        location: 'Việt Nam',
      });
      await user.save();
    } else {
      let updated = false;
      if (!user.avatarUrl && userPicture) {
        user.avatarUrl = userPicture;
        updated = true;
      }
      if (!user.fullName && userName) {
        user.fullName = userName;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken(user.email);
    const responseData = await formatUserResponse(user, token);
    return res.json(responseData);
  } catch (error) {
    return res.status(400).json({ message: 'Google login failed: ' + error.message });
  }
});

module.exports = router;
