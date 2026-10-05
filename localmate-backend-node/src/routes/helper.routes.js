const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HelperProfile = require('../models/HelperProfile');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// Helper mapping function identical to Java HelperController
const toHelperMap = async (user, profile) => {
  const userIdStr = user._id ? user._id.toString() : user.id;
  const profileIdStr = profile._id ? profile._id.toString() : profile.id;

  // Fetch reviews for this helper
  let reviews = await Review.find({
    $or: [{ helperId: userIdStr }, { helperId: profileIdStr }],
  }).sort({ createdAt: -1 }).lean();

  let displayRating = profile.rating || 5.0;
  let displayReviewCount = profile.reviewCount || 0;

  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    displayRating = Math.round((sum / reviews.length) * 10) / 10;
    displayReviewCount = reviews.length;
  }

  const mappedReviews = reviews.map((r) => ({
    id: r._id ? r._id.toString() : r.id,
    author: r.travelerName || 'Verified Traveler',
    avatar: r.travelerAvatar,
    rating: r.rating,
    text: r.comment,
    date: r.createdAt ? new Date(r.createdAt).toISOString().substring(0, 10) : 'Recently',
    createdAt: r.createdAt,
  }));

  const rate = profile.hourlyRate != null ? profile.hourlyRate : 10.0;
  const displayPrice = rate > 1000 ? Math.round(rate / 25000.0) : rate;

  const avatar = user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

  return {
    id: userIdStr,
    userId: userIdStr,
    profileId: profileIdStr,
    name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    city: profile.city || 'Vietnam',
    location: profile.city || 'Vietnam',
    country: 'Vietnam',
    title: profile.title,
    bio: profile.bio,
    rating: displayRating,
    reviewsCount: displayReviewCount,
    reviews: mappedReviews,
    languages: profile.languages && profile.languages.length > 0 ? profile.languages : ['English'],
    skills: profile.skills || [],
    expertises: (profile.skills && profile.skills.length > 0)
      ? profile.skills.map((s) => s.toUpperCase())
      : ['LOCAL EXPERT'],
    price: displayPrice,
    hourlyRate: displayPrice,
    priceRaw: rate,
    img: avatar,
    avatar: avatar,
    verified: profile.verified !== undefined ? profile.verified : true,
    availabilityDays: profile.availabilityDays,
    availabilityStatus: profile.availabilityStatus || 'AVAILABLE',
  };
};

// GET /api/v1/helpers
router.get('/', async (req, res) => {
  try {
    const { location, city, lang, featured } = req.query;
    const profiles = await HelperProfile.find().lean();
    let result = [];

    for (const profile of profiles) {
      const user = await User.findById(profile.userId).lean();
      if (!user) continue;

      const helperMap = await toHelperMap(user, profile);

      // Filter location / city
      const targetCity = city || location;
      if (targetCity && targetCity.trim()) {
        const pCity = (profile.city || '').toLowerCase();
        if (!pCity.includes(targetCity.toLowerCase().trim())) {
          continue;
        }
      }

      // Filter language
      if (lang && lang.trim() && lang.toUpperCase() !== 'ALL') {
        const hasLang = profile.languages && profile.languages.some((l) => l.toLowerCase() === lang.trim().toLowerCase());
        if (!hasLang) continue;
      }

      result.push(helperMap);
    }

    // Sort by rating descending
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    if (featured === 'true' && result.length > 4) {
      result = result.slice(0, 4);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching helpers: ' + error.message });
  }
});

// GET /api/v1/helpers/:id/schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let profile = await HelperProfile.findOne({ userId: id });
    let helperUserId = id;

    if (!profile) {
      profile = await HelperProfile.findById(id).catch(() => null);
      if (profile) {
        helperUserId = profile.userId;
      } else {
        const users = await User.find().lean();
        const found = users.find(
          (u) => u.email && (u.email.toLowerCase() === id.toLowerCase() || u.email.toLowerCase().startsWith(id.toLowerCase()))
        );
        if (found) {
          helperUserId = found._id.toString();
          profile = await HelperProfile.findOne({ userId: found._id.toString() });
        }
      }
    } else {
      helperUserId = profile.userId;
    }

    const currentStatus = profile ? profile.availabilityStatus : 'AVAILABLE';

    const bookings = await Booking.find({ helperId: helperUserId }).lean();
    const busySlots = bookings
      .filter((b) => {
        if (date && date.trim() && b.bookingDate !== date.trim()) {
          return false;
        }
        const st = (b.status || '').toUpperCase();
        return st === 'PENDING' || st === 'ACCEPTED' || st === 'CONFIRMED';
      })
      .map((b) => ({
        id: b._id.toString(),
        bookingDate: b.bookingDate,
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '13:00',
        status: b.status,
        tourName: b.tourName,
      }));

    return res.json({
      helperId: helperUserId,
      availabilityStatus: currentStatus,
      date: date || '',
      busySlots,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/helpers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let profile = await HelperProfile.findOne({ userId: id });
    let user = await User.findById(id).catch(() => null);

    if (!profile) {
      profile = await HelperProfile.findById(id).catch(() => null);
      if (profile) {
        user = await User.findById(profile.userId);
      }
    }

    if (!profile || !user) {
      const users = await User.find().lean();
      for (const u of users) {
        if (u.email && (u.email.toLowerCase().startsWith(id.toLowerCase()) || u.fullName.toLowerCase().includes(id.toLowerCase()))) {
          user = u;
          profile = await HelperProfile.findOne({ userId: u._id.toString() });
          break;
        }
      }
    }

    if (!profile || !user) {
      return res.status(404).json({ message: 'Helper not found' });
    }

    const map = await toHelperMap(user, profile);
    return res.json(map);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/v1/helpers/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['AVAILABLE', 'BUSY', 'OFFLINE'].includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid status. Must be AVAILABLE, BUSY, or OFFLINE.' });
    }

    const upperStatus = status.toUpperCase();
    let profile = await HelperProfile.findOne({ userId: id });
    if (!profile) profile = await HelperProfile.findById(id).catch(() => null);
    if (!profile) {
      const user = await User.findOne({ email: new RegExp('^' + id, 'i') });
      if (user) profile = await HelperProfile.findOne({ userId: user._id.toString() });
    }

    if (!profile) return res.status(404).json({ message: 'Helper profile not found' });

    profile.availabilityStatus = upperStatus;
    await profile.save();

    return res.json({ message: 'Status updated successfully', status: upperStatus });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH or PUT /api/v1/helpers/:id/price
const handleUpdatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const rateObj = req.body.hourlyRate !== undefined ? req.body.hourlyRate : req.body.price;
    if (rateObj === undefined || rateObj === null) {
      return res.status(400).json({ message: 'hourlyRate or price is required' });
    }

    const newRate = parseFloat(rateObj);
    if (isNaN(newRate) || newRate <= 0 || newRate > 1000) {
      return res.status(400).json({ message: 'Hourly rate must be between $1 and $1,000/hr' });
    }

    let profile = await HelperProfile.findOne({ userId: id });
    let user = await User.findById(id).catch(() => null);

    if (!profile) {
      profile = await HelperProfile.findById(id).catch(() => null);
      if (profile) user = await User.findById(profile.userId);
    }

    if (!profile) {
      const users = await User.find().lean();
      for (const u of users) {
        if (u.email && u.email.toLowerCase().startsWith(id.toLowerCase())) {
          user = u;
          profile = await HelperProfile.findOne({ userId: u._id.toString() });
          break;
        }
      }
    }

    if (!profile) return res.status(404).json({ message: 'Helper profile not found' });

    profile.hourlyRate = newRate;
    await profile.save();

    if (user) {
      const map = await toHelperMap(user, profile);
      return res.json(map);
    }

    return res.json({ message: 'Price updated successfully', hourlyRate: newRate });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
router.patch('/:id/price', handleUpdatePrice);
router.put('/:id/price', handleUpdatePrice);

// POST /api/v1/helpers
router.post('/', async (req, res) => {
  try {
    const { email, name, phone, city, title, bio, avatar, availabilityStatus, languages, skills, hourlyRate } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = new User({
      email: normalizedEmail,
      fullName: name || 'Local Helper',
      phone: phone || '+84 912 345 678',
      avatarUrl: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      roles: ['ROLE_HELPER'],
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    await user.save();

    const profile = new HelperProfile({
      userId: user._id.toString(),
      title: title || 'Local Guide & Explorer',
      bio: bio || 'Experienced local guide ready to share authentic local culture.',
      city: city || 'Đà Nẵng',
      languages: Array.isArray(languages) ? languages : ['Tiếng Việt', 'Tiếng Anh'],
      skills: Array.isArray(skills) ? skills : ['Food Tour', 'Culture'],
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 12.0,
      rating: 5.0,
      reviewCount: 0,
      verified: true,
      availabilityStatus: (availabilityStatus || 'AVAILABLE').toUpperCase(),
      createdAt: new Date(),
    });
    await profile.save();

    const map = await toHelperMap(user, profile);
    return res.json(map);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/v1/helpers/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let profile = await HelperProfile.findOne({ userId: id });
    let user = await User.findById(id).catch(() => null);

    if (!profile) {
      profile = await HelperProfile.findById(id).catch(() => null);
      if (profile) user = await User.findById(profile.userId);
    }

    if (!profile || !user) {
      const users = await User.find().lean();
      for (const u of users) {
        if (u.email && u.email.toLowerCase() === id.toLowerCase()) {
          user = u;
          profile = await HelperProfile.findOne({ userId: u._id.toString() });
          break;
        }
      }
    }

    if (!profile || !user) {
      return res.status(404).json({ message: 'Helper not found' });
    }

    const { name, fullName, phone, avatar, status, city, title, bio, availabilityStatus, hourlyRate, languages } = req.body;
    if (name !== undefined) user.fullName = name;
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatarUrl = avatar;
    if (status !== undefined) user.status = status.toUpperCase();

    if (city !== undefined) profile.city = city;
    if (title !== undefined) profile.title = title;
    if (bio !== undefined) profile.bio = bio;
    if (availabilityStatus !== undefined) profile.availabilityStatus = availabilityStatus.toUpperCase();
    if (hourlyRate !== undefined) profile.hourlyRate = parseFloat(hourlyRate);
    if (languages !== undefined && Array.isArray(languages)) profile.languages = languages;

    await user.save();
    await profile.save();

    const map = await toHelperMap(user, profile);
    return res.json(map);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/v1/helpers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let profile = await HelperProfile.findOne({ userId: id });
    let user = await User.findById(id).catch(() => null);

    if (!profile) {
      profile = await HelperProfile.findById(id).catch(() => null);
      if (profile) user = await User.findById(profile.userId);
    }

    if (profile) await HelperProfile.deleteOne({ _id: profile._id });
    if (user) await User.deleteOne({ _id: user._id });

    return res.json({ message: 'Helper deleted successfully', id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
