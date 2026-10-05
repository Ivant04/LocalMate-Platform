const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const HelperProfile = require('../models/HelperProfile');
const Message = require('../models/Message');
const Review = require('../models/Review');

const parseMinutes = (timeStr, defaultMinutes) => {
  if (!timeStr || !timeStr.includes(':')) return defaultMinutes;
  try {
    const parts = timeStr.trim().split(':');
    return parseInt(parts[0].trim(), 10) * 60 + parseInt(parts[1].trim(), 10);
  } catch (e) {
    return defaultMinutes;
  }
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const checkAndExpire = async (bookings) => {
  const now = new Date();
  for (const b of bookings) {
    if (b.status && b.status.toUpperCase() === 'PENDING' && b.expiresAt && new Date(b.expiresAt) < now) {
      b.status = 'EXPIRED';
      b.updatedAt = now;
      await Booking.updateOne({ _id: b._id }, { $set: { status: 'EXPIRED', updatedAt: now } });
    }
  }
};

// GET /api/v1/bookings/my-bookings
router.get('/my-bookings', async (req, res) => {
  try {
    const { travelerId, email } = req.query;
    let targetTravelerId = travelerId;

    if ((!targetTravelerId || !targetTravelerId.trim()) && email && email.trim()) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        targetTravelerId = user._id.toString();
      }
    }

    if (!targetTravelerId || !targetTravelerId.trim()) {
      return res.json([]);
    }

    const bookings = await Booking.find({
      $or: [{ travelerId: targetTravelerId }, { travelerId: email }],
    }).lean();

    await checkAndExpire(bookings);

    const response = [];
    for (const b of bookings) {
      let helper = null;
      if (b.helperId) {
        helper = await User.findById(b.helperId).catch(() => null);
        if (!helper) {
          helper = await User.findOne({ email: b.helperId });
        }
      }

      const bookingIdStr = b._id.toString();
      const review = await Review.findOne({ bookingId: bookingIdStr }).lean();

      response.push({
        id: bookingIdStr,
        travelerId: b.travelerId,
        helperId: b.helperId,
        tourName: b.tourName,
        bookingDate: b.bookingDate,
        durationHours: b.durationHours,
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '13:00',
        sentAt: b.sentAt,
        expiresAt: b.expiresAt,
        meetLocation: b.meetLocation,
        specialRequests: b.specialRequests,
        totalPrice: b.totalPrice,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        guideName: helper ? helper.fullName : 'Local Guide',
        guideAvatar: helper && helper.avatarUrl ? helper.avatarUrl : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        guideEmail: helper ? helper.email : '',
        guidePhone: helper ? helper.phone : '',
        reviewed: !!review,
        reviewId: review ? review._id.toString() : null,
        reviewRating: review ? review.rating : null,
        reviewComment: review ? review.comment : null,
        reviewCreatedAt: review ? review.createdAt : null,
      });
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings
router.post('/', async (req, res) => {
  try {
    const bookingData = { ...req.body };
    const { travelerEmail, helperEmail } = req.query;

    // Resolve Traveler
    if ((!bookingData.travelerId || !bookingData.travelerId.trim()) && travelerEmail && travelerEmail.trim()) {
      const u = await User.findOne({ email: travelerEmail.toLowerCase().trim() });
      if (u) bookingData.travelerId = u._id.toString();
    }

    // Resolve Helper
    let candidateHelper = bookingData.helperId;
    if (candidateHelper && candidateHelper.trim()) {
      let helperUser = await User.findById(candidateHelper).catch(() => null);
      if (!helperUser) {
        helperUser = await User.findOne({ email: candidateHelper });
      }
      if (!helperUser) {
        const slug = candidateHelper.toLowerCase();
        if (slug.includes('kevin')) helperUser = await User.findOne({ email: 'kevin.nguyen@localmate.com' });
        else if (slug.includes('huong')) helperUser = await User.findOne({ email: 'huong.dang@localmate.com' });
        else if (slug.includes('tuan') || slug.includes('khang')) helperUser = await User.findOne({ email: 'tuan.tran@localmate.com' });
        else if (slug.includes('elena')) helperUser = await User.findOne({ email: 'elena.nguyen@localmate.com' });
        else if (slug.includes('linh')) helperUser = await User.findOne({ email: 'linh.hanoi@localmate.com' });
        else if (slug.includes('minh')) helperUser = await User.findOne({ email: 'minh.danang@localmate.com' });
      }
      if (helperUser) {
        bookingData.helperId = helperUser._id.toString();
      }
    } else if (helperEmail && helperEmail.trim()) {
      const u = await User.findOne({ email: helperEmail.toLowerCase().trim() });
      if (u) bookingData.helperId = u._id.toString();
    }

    if (!bookingData.helperId || !bookingData.helperId.trim()) {
      return res.status(400).json({ message: 'Helper ID is required.' });
    }

    // Check if helper is OFFLINE
    let hp = await HelperProfile.findOne({ userId: bookingData.helperId });
    if (!hp) hp = await HelperProfile.findById(bookingData.helperId).catch(() => null);
    if (hp && hp.availabilityStatus && hp.availabilityStatus.toUpperCase() === 'OFFLINE') {
      return res.status(400).json({
        message: 'Helper is currently OFFLINE and not receiving new bookings.',
        code: 'HELPER_OFFLINE',
      });
    }

    const duration = bookingData.durationHours && bookingData.durationHours > 0 ? bookingData.durationHours : 4;
    bookingData.durationHours = duration;

    const startMin = parseMinutes(bookingData.startTime, 9 * 60);
    bookingData.startTime = minutesToTime(startMin);

    let endMin;
    if (bookingData.endTime && bookingData.endTime.trim()) {
      endMin = parseMinutes(bookingData.endTime, startMin + duration * 60);
    } else {
      endMin = startMin + duration * 60;
    }
    bookingData.endTime = minutesToTime(endMin);

    // Schedule conflict check
    const existingBookings = await Booking.find({ helperId: bookingData.helperId }).lean();
    for (const existing of existingBookings) {
      if (bookingData.bookingDate && existing.bookingDate && bookingData.bookingDate !== existing.bookingDate) {
        continue;
      }
      const exStatus = (existing.status || '').toUpperCase();
      if (!['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(exStatus)) {
        continue;
      }

      const exStartMin = parseMinutes(existing.startTime, 9 * 60);
      const exDuration = existing.durationHours && existing.durationHours > 0 ? existing.durationHours : 4;
      const exEndMin = existing.endTime ? parseMinutes(existing.endTime, exStartMin + exDuration * 60) : exStartMin + exDuration * 60;

      if (startMin < exEndMin && endMin > exStartMin) {
        const conflictMsg = `Helper is busy during this time (already booked ${minutesToTime(exStartMin)} - ${minutesToTime(exEndMin)} on ${bookingData.bookingDate}). Please choose another time slot.`;
        return res.status(409).json({
          message: conflictMsg,
          code: 'SCHEDULE_CONFLICT',
          conflictingStart: minutesToTime(exStartMin),
          conflictingEnd: minutesToTime(exEndMin),
        });
      }
    }

    const now = new Date();
    bookingData.sentAt = now;
    bookingData.expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    bookingData.status = 'PENDING';
    if (!bookingData.paymentStatus) {
      bookingData.paymentStatus = 'PAID';
    }
    bookingData.createdAt = now;

    const newBooking = new Booking(bookingData);
    const saved = await newBooking.save();

    return res.json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/bookings/helper-requests
router.get('/helper-requests', async (req, res) => {
  try {
    const { helperId, email } = req.query;
    let targetHelperId = helperId;

    if ((!targetHelperId || !targetHelperId.trim()) && email && email.trim()) {
      const u = await User.findOne({ email: email.toLowerCase().trim() });
      if (u) targetHelperId = u._id.toString();
    }

    let bookings;
    if (targetHelperId && targetHelperId.trim()) {
      bookings = await Booking.find({ helperId: targetHelperId }).lean();
    } else {
      bookings = await Booking.find().lean();
    }

    await checkAndExpire(bookings);

    const response = [];
    for (const b of bookings) {
      let traveler = null;
      if (b.travelerId) {
        traveler = await User.findById(b.travelerId).catch(() => null);
        if (!traveler) {
          traveler = await User.findOne({ email: b.travelerId });
        }
      }

      const displayTime = `${b.startTime || '09:00'} - ${b.endTime || '13:00'}${b.durationHours ? ` (${b.durationHours}h)` : ''}`;

      response.push({
        id: b._id.toString(),
        travelerId: b.travelerId,
        travelerName: traveler ? traveler.fullName : 'Traveler',
        travelerAvatar: traveler && traveler.avatarUrl ? traveler.avatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: traveler ? traveler.phone : '',
        email: traveler ? traveler.email : '',
        tourName: b.tourName,
        date: b.bookingDate ? b.bookingDate.toString() : 'Upcoming',
        time: displayTime,
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '13:00',
        sentAt: b.sentAt,
        expiresAt: b.expiresAt,
        location: b.meetLocation,
        requests: b.specialRequests,
        price: b.totalPrice || 0,
        status: b.status,
      });
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings/:id/accept
router.post('/:id/accept', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'ACCEPTED';
    booking.updatedAt = new Date();
    const saved = await booking.save();

    // Send auto confirmation message in chat
    try {
      let helper = await User.findById(booking.helperId).catch(() => null);
      if (!helper) helper = await User.findOne({ email: booking.helperId });

      let traveler = await User.findById(booking.travelerId).catch(() => null);
      if (!traveler) traveler = await User.findOne({ email: booking.travelerId });

      if (helper && traveler) {
        const hEmail = helper.email.toLowerCase().trim();
        const tEmail = traveler.email.toLowerCase().trim();
        const convId = hEmail.localeCompare(tEmail) < 0 ? `${hEmail}_${tEmail}` : `${tEmail}_${hEmail}`;

        const content = `🎉 Booking Accepted! I have confirmed your tour "${booking.tourName}" on ${booking.bookingDate} (${booking.startTime || '09:00'} - ${booking.endTime || '13:00'}). ${booking.meetLocation ? `Meeting point: ${booking.meetLocation}. ` : ''}I'm excited to guide you!`;

        const msg = new Message({
          conversationId: convId,
          senderId: hEmail,
          receiverId: tEmail,
          content,
          isRead: false,
          createdAt: new Date(),
        });
        await msg.save();
      }
    } catch (err) {
      console.warn('Auto message error on accept:', err.message);
    }

    return res.json({
      message: 'Booking accepted successfully',
      status: 'ACCEPTED',
      booking: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings/:id/decline
router.post('/:id/decline', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'DECLINED';
    booking.updatedAt = new Date();
    const saved = await booking.save();

    try {
      let helper = await User.findById(booking.helperId).catch(() => null);
      if (!helper) helper = await User.findOne({ email: booking.helperId });

      let traveler = await User.findById(booking.travelerId).catch(() => null);
      if (!traveler) traveler = await User.findOne({ email: booking.travelerId });

      if (helper && traveler) {
        const hEmail = helper.email.toLowerCase().trim();
        const tEmail = traveler.email.toLowerCase().trim();
        const convId = hEmail.localeCompare(tEmail) < 0 ? `${hEmail}_${tEmail}` : `${tEmail}_${hEmail}`;

        const content = `Notice: I am unable to accept the booking for "${booking.tourName}" on ${booking.bookingDate} due to schedule constraints. Please feel free to choose another available time slot!`;

        const msg = new Message({
          conversationId: convId,
          senderId: hEmail,
          receiverId: tEmail,
          content,
          isRead: false,
          createdAt: new Date(),
        });
        await msg.save();
      }
    } catch (err) {
      console.warn('Auto message error on decline:', err.message);
    }

    return res.json({
      message: 'Booking declined successfully',
      status: 'DECLINED',
      booking: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let traveler = null;
    if (booking.travelerId) {
      traveler = await User.findById(booking.travelerId).catch(() => null);
      if (!traveler) traveler = await User.findOne({ email: booking.travelerId });
    }

    let helper = null;
    if (booking.helperId) {
      helper = await User.findById(booking.helperId).catch(() => null);
      if (!helper) helper = await User.findOne({ email: booking.helperId });
    }

    return res.json({
      id: booking._id.toString(),
      tourName: booking.tourName,
      bookingDate: booking.bookingDate,
      durationHours: booking.durationHours,
      startTime: booking.startTime,
      endTime: booking.endTime,
      meetLocation: booking.meetLocation,
      specialRequests: booking.specialRequests,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      travelerId: booking.travelerId,
      travelerName: traveler ? traveler.fullName : 'Traveler',
      travelerAvatar: traveler ? traveler.avatarUrl : '',
      travelerEmail: traveler ? traveler.email : '',
      helperId: booking.helperId,
      helperName: helper ? helper.fullName : 'Local Helper',
      helperAvatar: helper ? helper.avatarUrl : '',
      helperEmail: helper ? helper.email : '',
      customerSharingLocation: booking.customerSharingLocation,
      customerLatitude: booking.customerLatitude,
      customerLongitude: booking.customerLongitude,
      helperSharingLocation: booking.helperSharingLocation,
      helperLatitude: booking.helperLatitude,
      helperLongitude: booking.helperLongitude,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'COMPLETED';
    booking.updatedAt = new Date();
    const saved = await booking.save();

    return res.json({
      message: 'Booking completed successfully',
      status: 'COMPLETED',
      booking: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'CANCELLED';
    booking.customerSharingLocation = false;
    booking.helperSharingLocation = false;
    booking.updatedAt = new Date();
    await booking.save();

    return res.json({ message: 'Booking cancelled successfully', status: 'CANCELLED' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/bookings/:id/simulate-expire
router.post('/:id/simulate-expire', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.expiresAt = new Date(Date.now() - 10000);
    booking.status = 'EXPIRED';
    booking.updatedAt = new Date();
    const saved = await booking.save();

    return res.json({
      message: 'Booking expired simulated',
      status: saved.status,
      expiresAt: saved.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Clear all bookings
const handleClearAll = async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    await Booking.deleteMany({});
    return res.json({ message: 'All bookings have been successfully deleted', deletedCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
router.delete('/clear-all', handleClearAll);
router.post('/clear-all', handleClearAll);
router.get('/clear-all', handleClearAll);

// GET /api/v1/bookings/travelers
router.get('/travelers', async (req, res) => {
  try {
    const travelers = await User.find({ roles: 'ROLE_TRAVELER' });
    return res.json(travelers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
