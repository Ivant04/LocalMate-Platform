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
    gender: user.gender || 'Male',
    location: user.location || 'Vietnam',
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
      gender: 'Male',
      location: 'Vietnam',
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

// In-memory OTP storage for phone verification (phone -> { otp, expiresAt })
const phoneOtpStore = new Map();

// Helper to extract clean digits from phone
const extractPhoneDigits = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
};

// POST /api/v1/auth/login (Supports both Email and Phone Number + Password)
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier || !password) {
      return res.status(401).json({ message: 'Please enter your Email or Phone Number and Password!' });
    }

    let user = null;
    const isPhoneNumber = /^[+0-9\s\-\.]{8,20}$/.test(identifier);

    if (isPhoneNumber) {
      const digits = extractPhoneDigits(identifier);
      const last9 = digits.slice(-9);
      // Create flexible regex to match digits regardless of spaces, dots, dashes
      // e.g. for '901234567', matches '9[\\s\\-\\.]*0[\\s\\-\\.]*1...'
      const phonePattern = last9.split('').join('[\\s\\-\\.]*');
      const phoneRegex = new RegExp(phonePattern + '$');

      user = await User.findOne({
        $or: [
          { phone: phoneRegex },
          { phone: identifier },
          { phone: digits },
          { email: identifier.toLowerCase() }
        ]
      });
    } else {
      user = await User.findOne({ email: identifier.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid account (Email or Phone Number) or password!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials or password!' });
    }

    const token = generateToken(user.email);
    const responseData = await formatUserResponse(user, token);
    return res.json(responseData);
  } catch (error) {
    return res.status(401).json({ message: 'Login failed: ' + error.message });
  }
});

// POST /api/v1/auth/phone/send-otp
router.post('/phone/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Please provide a valid phone number!' });
    }

    const rawPhone = phone.trim();
    const digits = extractPhoneDigits(rawPhone);
    if (digits.length < 9 || digits.length > 12) {
      return res.status(400).json({ message: 'Invalid phone number (must be 9 - 11 digits)!' });
    }

    // Generate 6-digit OTP code (for demo, random 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    phoneOtpStore.set(digits, { otp, expiresAt, rawPhone });

    console.log(`[OTP SERVICE] Generated OTP for ${rawPhone} (${digits}): ${otp}`);

    return res.json({
      success: true,
      message: 'OTP verification code sent successfully!',
      phone: rawPhone,
      otp: otp, // Returned for effortless demo evaluation without requiring third-party SMS fee
      expiresInSeconds: 300,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
});

// POST /api/v1/auth/phone/verify-otp
router.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phone, otp, fullName } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Please provide phone number and OTP code!' });
    }

    const rawPhone = phone.trim();
    const digits = extractPhoneDigits(rawPhone);
    const enteredOtp = otp.trim();

    const otpData = phoneOtpStore.get(digits);
    // Allow master demo bypass '123456' or exact matching valid OTP
    const isValid = (otpData && otpData.otp === enteredOtp && Date.now() <= otpData.expiresAt) || enteredOtp === '123456';

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP code!' });
    }

    // Clean up used OTP
    phoneOtpStore.delete(digits);

    // Look for existing user with this phone
    const last9 = digits.slice(-9);
    let user = await User.findOne({
      $or: [
        { phone: new RegExp(last9 + '$') },
        { phone: rawPhone }
      ]
    });

    // If user does not exist, automatically register a new Traveler account
    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const standardPhone = rawPhone.startsWith('+84') ? '0' + rawPhone.slice(3) : rawPhone;
      const autoEmail = `${digits}@phone.localmate.vn`;
      const displayName = (fullName && fullName.trim()) ? fullName.trim() : `Guest ${standardPhone.slice(-4)}`;

      user = new User({
        email: autoEmail,
        phone: rawPhone,
        fullName: displayName,
        password: randomPassword,
        roles: ['ROLE_TRAVELER'],
        status: 'ACTIVE',
        gender: 'Male',
        location: 'Vietnam',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${digits}`,
      });
      await user.save();
    } else if (fullName && fullName.trim() && user.fullName.startsWith('Guest ')) {
      user.fullName = fullName.trim();
      await user.save();
    }

    const token = generateToken(user.email);
    const responseData = await formatUserResponse(user, token);
    return res.json(responseData);
  } catch (error) {
    return res.status(400).json({ message: 'OTP verification failed: ' + error.message });
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
        gender: 'Male',
        location: 'Vietnam',
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
