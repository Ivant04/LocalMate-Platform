const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const HelperProfile = require('../models/HelperProfile');

// GET /api/v1/users
router.get('/', async (req, res) => {
  try {
    const { role, status, gender, search } = req.query;
    let users = await User.find().lean();
    const result = [];

    for (const user of users) {
      // Role filter
      if (role && role.trim() && role.toUpperCase() !== 'ALL') {
        const searchRole = role.toUpperCase().startsWith('ROLE_') ? role.toUpperCase() : 'ROLE_' + role.toUpperCase();
        if (!user.roles || !user.roles.includes(searchRole)) {
          continue;
        }
      }

      // Status filter
      if (status && status.trim() && status.toUpperCase() !== 'ALL') {
        if (!user.status || user.status.toUpperCase() !== status.trim().toUpperCase()) {
          continue;
        }
      }

      // Gender filter
      if (gender && gender.trim() && gender.toUpperCase() !== 'ALL') {
        if (!user.gender || user.gender.toLowerCase() !== gender.trim().toLowerCase()) {
          continue;
        }
      }

      // Search filter
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        const matchName = user.fullName && user.fullName.toLowerCase().includes(s);
        const matchEmail = user.email && user.email.toLowerCase().includes(s);
        const matchPhone = user.phone && user.phone.toLowerCase().includes(s);
        if (!matchName && !matchEmail && !matchPhone) {
          continue;
        }
      }

      const userIdStr = user._id ? user._id.toString() : '';

      // Find user bookings by email or ID
      let userBookings = await Booking.find({
        $or: [{ travelerId: user.email }, { travelerId: userIdStr }],
      }).lean();

      const completedCount = userBookings.filter((b) => b.status && b.status.toUpperCase() === 'COMPLETED').length;
      const totalSpent = userBookings
        .filter((b) => b.status && (b.status.toUpperCase() === 'COMPLETED' || b.status.toUpperCase() === 'CONFIRMED'))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      let recentTrip;
      if (userBookings.length > 0) {
        const latest = userBookings[0];
        let guideName = 'Local Helper';
        if (latest.helperId) {
          const helper = await User.findById(latest.helperId).lean();
          if (helper) guideName = helper.fullName;
        }
        recentTrip = {
          id: latest._id.toString(),
          tourName: latest.tourName || 'Local Guided Tour',
          guideName,
          date: latest.bookingDate ? latest.bookingDate.toString() : 'Scheduled',
          status: latest.status,
        };
      } else {
        recentTrip = null;
      }

      result.push({
        id: userIdStr,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || '—',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        roles: user.roles,
        status: user.status || 'ACTIVE',
        gender: user.gender || 'Male',
        location: user.location || 'Vietnam',
        createdAt: user.createdAt || new Date(),
        completedToursCount: completedCount,
        totalSpent: totalSpent,
        recentTrip,
      });
    }

    // Sort by createdAt descending
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving users: ' + error.message });
  }
});

// GET /api/v1/users/profile
router.get('/profile', async (req, res) => {
  try {
    const { email, id } = req.query;
    if (!email && !id) return res.status(400).json({ message: 'Email or ID is required' });

    let query = {};
    if (id && id.trim()) {
      query._id = id.trim();
    } else if (email && email.trim()) {
      query.email = email.toLowerCase().trim();
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userObj = user.toJSON();
    const helperProfile = await HelperProfile.findOne({ userId: user._id.toString() });
    if (helperProfile) {
      userObj.hourlyRate = helperProfile.hourlyRate;
      userObj.bio = userObj.bio || helperProfile.bio;
      userObj.address = userObj.address || helperProfile.fullAddress;
    }

    return res.json(userObj);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/v1/users/profile
router.put('/profile', async (req, res) => {
  try {
    const {
      id,
      email,
      fullName,
      phone,
      avatarUrl,
      gender,
      location,
      birthDate,
      nationality,
      address,
      bio,
      hourlyRate,
      prefLang,
      prefCurrency,
      notifBookings,
      notifMessages,
      notifPromos,
    } = req.body;

    if (!email && !id) return res.status(400).json({ message: 'Email or ID is required' });

    let user = null;
    if (id && id.trim()) {
      user = await User.findById(id.trim()).catch(() => null);
    }
    if (!user && email && email.trim()) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (nationality !== undefined) user.nationality = nationality;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (prefLang !== undefined) user.prefLang = prefLang;
    if (prefCurrency !== undefined) user.prefCurrency = prefCurrency;
    if (notifBookings !== undefined) user.notifBookings = notifBookings;
    if (notifMessages !== undefined) user.notifMessages = notifMessages;
    if (notifPromos !== undefined) user.notifPromos = notifPromos;
    user.updatedAt = new Date();

    await user.save();

    // Synchronize HelperProfile if exists
    const helperProfile = await HelperProfile.findOne({ userId: user._id.toString() });
    if (helperProfile) {
      if (bio !== undefined) helperProfile.bio = bio;
      if (address !== undefined) helperProfile.fullAddress = address;
      if (location !== undefined) helperProfile.city = location;
      if (hourlyRate !== undefined) {
        const parsedRate = parseFloat(String(hourlyRate).replace(',', '.'));
        if (!isNaN(parsedRate) && parsedRate > 0) {
          helperProfile.hourlyRate = parsedRate;
        }
      }
      helperProfile.updatedAt = new Date();
      await helperProfile.save();
    }

    const userObj = user.toJSON();
    if (helperProfile) {
      userObj.hourlyRate = helperProfile.hourlyRate;
    }

    return res.json(userObj);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/v1/users/password
router.put('/password', async (req, res) => {
  try {
    const { id, email, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current password and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    let user = null;
    if (id && id.trim()) {
      user = await User.findById(id.trim()).catch(() => null);
    }
    if (!user && email && email.trim()) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    await user.save();

    return res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bookings = await Booking.find({
      $or: [{ travelerId: user.email }, { travelerId: user._id.toString() }],
    });

    return res.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      status: user.status,
      gender: user.gender,
      location: user.location,
      createdAt: user.createdAt,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/users
router.post('/', async (req, res) => {
  try {
    const { email, password, fullName, phone, gender, location, avatarUrl, role, status } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    let userRole = role ? role.toUpperCase() : 'TRAVELER';
    if (!userRole.startsWith('ROLE_')) {
      userRole = 'ROLE_' + userRole;
    }

    const hashedPassword = await bcrypt.hash(password || 'localmate123', 10);
    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName || 'User',
      phone: phone || '+84 901 234 567',
      gender: gender || 'Male',
      location: location || 'Vietnam',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      roles: [userRole],
      status: (status || 'ACTIVE').toUpperCase(),
      createdAt: new Date(),
    });

    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/v1/users/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fullName, phone, gender, location, avatarUrl, status } = req.body;
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (status !== undefined) user.status = status.toUpperCase();
    user.updatedAt = new Date();

    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/v1/users/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !status.trim()) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status.toUpperCase().trim();
    user.updatedAt = new Date();
    await user.save();

    return res.json({ message: 'Status updated', status: user.status });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/v1/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await HelperProfile.deleteOne({ userId: user._id.toString() });
    await User.deleteOne({ _id: user._id });

    return res.json({ message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
