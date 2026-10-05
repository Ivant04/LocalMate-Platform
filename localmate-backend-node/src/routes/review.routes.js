const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const HelperProfile = require('../models/HelperProfile');

// POST /api/v1/reviews (and /api/reviews)
router.post('/', async (req, res) => {
  try {
    const { bookingId, travelerId, rating, comment } = req.body;

    if (!bookingId || !bookingId.trim()) {
      return res.status(400).json({
        message: 'Booking ID is required.',
        code: 'MISSING_BOOKING_ID',
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5 stars.',
        code: 'INVALID_RATING',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: 'Comment cannot be empty.',
        code: 'EMPTY_COMMENT',
      });
    }

    // 1. Check if Booking exists
    const booking = await Booking.findById(bookingId).catch(() => null);
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // 2. Check if Booking is COMPLETED
    if (!booking.status || booking.status.toUpperCase() !== 'COMPLETED') {
      return res.status(400).json({
        message: 'Booking not completed. You cannot review this booking before completion.',
        code: 'BOOKING_NOT_COMPLETED',
        currentStatus: booking.status,
      });
    }

    // 3. Check if Booking has already been reviewed
    const existingReview = await Review.findOne({ bookingId: booking._id.toString() });
    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this booking.',
        code: 'ALREADY_REVIEWED',
      });
    }

    // 4. Validate traveler ownership
    let travelerUser = null;
    if (travelerId && travelerId.trim()) {
      travelerUser = await User.findById(travelerId).catch(() => null);
      if (!travelerUser) travelerUser = await User.findOne({ email: travelerId });
    }

    if (!travelerUser && booking.travelerId) {
      travelerUser = await User.findById(booking.travelerId).catch(() => null);
      if (!travelerUser) travelerUser = await User.findOne({ email: booking.travelerId });
    }

    if (travelerId && travelerUser) {
      const matchesId = travelerUser._id.toString() === booking.travelerId;
      const matchesEmail = travelerUser.email && travelerUser.email.toLowerCase() === (booking.travelerId || '').toLowerCase();
      if (!matchesId && !matchesEmail) {
        return res.status(403).json({
          message: 'You cannot review this booking as you are not the traveler who booked it.',
          code: 'FORBIDDEN_TRAVELER',
        });
      }
    }

    // 5. Resolve Helper
    let helperUser = null;
    if (booking.helperId) {
      helperUser = await User.findById(booking.helperId).catch(() => null);
      if (!helperUser) helperUser = await User.findOne({ email: booking.helperId });
    }

    const helperIdentifier = helperUser ? helperUser._id.toString() : booking.helperId;

    // 6. Build and save Review
    const newReview = new Review({
      bookingId: booking._id.toString(),
      helperId: helperIdentifier,
      travelerId: travelerUser ? travelerUser._id.toString() : booking.travelerId,
      travelerName: travelerUser ? travelerUser.fullName : 'Verified Traveler',
      travelerAvatar: travelerUser && travelerUser.avatarUrl ? travelerUser.avatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: ratingNum,
      comment: comment.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedReview = await newReview.save();

    // 7. Recalculate dynamic rating and review count
    const allReviews = await Review.find({ helperId: helperIdentifier }).lean();
    const sum = allReviews.reduce((acc, r) => acc + (r.rating || ratingNum), 0);
    const avg = allReviews.length > 0 ? sum / allReviews.length : ratingNum;
    const roundedRating = Math.round(avg * 10) / 10;
    const reviewCount = allReviews.length;

    let profile = await HelperProfile.findOne({ userId: helperIdentifier });
    if (!profile) profile = await HelperProfile.findById(helperIdentifier).catch(() => null);

    if (profile) {
      profile.rating = roundedRating;
      profile.reviewCount = reviewCount;
      profile.updatedAt = new Date();
      await profile.save();
    }

    return res.json({
      message: 'Review submitted successfully!',
      review: savedReview,
      helperRating: roundedRating,
      reviewCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/reviews/helper/:helperId
router.get('/helper/:helperId', async (req, res) => {
  try {
    const { helperId } = req.params;
    let resolvedId = helperId;

    let user = await User.findById(helperId).catch(() => null);
    if (!user) user = await User.findOne({ email: helperId });

    if (user) {
      resolvedId = user._id.toString();
    } else {
      const hp = await HelperProfile.findById(helperId).catch(() => null);
      if (hp) resolvedId = hp.userId;
    }

    let reviews = await Review.find({ helperId: resolvedId }).sort({ createdAt: -1 }).lean();
    if (reviews.length === 0 && resolvedId !== helperId) {
      reviews = await Review.find({ helperId }).sort({ createdAt: -1 }).lean();
    }

    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = reviews.length > 0 ? sum / reviews.length : 5.0;
    const roundedRating = Math.round(avg * 10) / 10;

    return res.json({
      helperId: resolvedId,
      averageRating: roundedRating,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/reviews/booking/:bookingId
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/reviews
router.get('/', async (req, res) => {
  try {
    const { travelerId, helperId } = req.query;

    if (travelerId && travelerId.trim()) {
      let idToUse = travelerId;
      const u = await User.findOne({ email: travelerId });
      if (u) idToUse = u._id.toString();

      const reviews = await Review.find({
        $or: [{ travelerId: idToUse }, { travelerId }],
      }).sort({ createdAt: -1 });
      return res.json(reviews);
    }

    if (helperId && helperId.trim()) {
      const reviews = await Review.find({ helperId: helperId.trim() }).sort({ createdAt: -1 });
      return res.json(reviews);
    }

    const reviews = await Review.find().sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/v1/reviews/:id/response
router.patch('/:id/response', async (req, res) => {
  try {
    const { response } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.response = response || '';
    review.updatedAt = new Date();
    await review.save();
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
