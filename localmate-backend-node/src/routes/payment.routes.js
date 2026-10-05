const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const payos = require('../config/payos');
const PaymentTransaction = require('../models/PaymentTransaction');
const Booking = require('../models/Booking');

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const hmacSHA256 = (key, data) => {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

// POST /api/v1/payment/payos/create-payment
router.post('/payos/create-payment', async (req, res) => {
  try {
    const { bookingId, amount, description: customDescription, buyerName, buyerEmail } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Payment amount is required' });
    }

    const amountVnd = Math.round(Number(amount));
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

    let description = `Pay ${orderCode}`;
    if (customDescription && customDescription.trim()) {
      let sanitized = customDescription.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      if (sanitized.length > 25) sanitized = sanitized.substring(0, 25);
      if (sanitized.length > 0) description = sanitized;
    }

    const returnUrl = `${FRONTEND_URL}/payment-success?bookingId=${bookingId || ''}&orderCode=${orderCode}`;
    const cancelUrl = `${FRONTEND_URL}/payment-cancel?bookingId=${bookingId || ''}&orderCode=${orderCode}`;

    if (payos) {
      try {
        const paymentLinkRes = await payos.createPaymentLink({
          orderCode,
          amount: amountVnd,
          description,
          cancelUrl,
          returnUrl,
          buyerName: buyerName || 'Traveler',
          buyerEmail: buyerEmail || 'traveler@localmate.com',
          items: [
            {
              name: `Guided Tour Booking ${bookingId || ''}`,
              quantity: 1,
              price: amountVnd,
            },
          ],
        });

        // Save pending transaction
        const trans = new PaymentTransaction({
          bookingId: bookingId || '',
          amount: amountVnd,
          currency: 'VND',
          paymentMethod: 'PAYOS',
          transactionRef: String(orderCode),
          status: 'PENDING',
          createdAt: new Date(),
        });
        await trans.save();

        return res.json({
          status: 'SUCCESS',
          checkoutUrl: paymentLinkRes.checkoutUrl,
          qrCode: paymentLinkRes.qrCode,
          orderCode,
          bookingId,
          amount: amountVnd,
        });
      } catch (sdkError) {
        console.warn('PayOS SDK call warning, fallback to REST API:', sdkError.message);
      }
    }

    // Direct REST API Fallback
    const signData = `amount=${amountVnd}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    const signature = hmacSHA256(PAYOS_CHECKSUM_KEY, signData);

    const payload = {
      orderCode,
      amount: amountVnd,
      description,
      cancelUrl,
      returnUrl,
      signature,
      buyerName: buyerName || 'Traveler',
      buyerEmail: buyerEmail || 'traveler@localmate.com',
      items: [
        {
          name: `Guided Tour Booking ${bookingId || ''}`,
          quantity: 1,
          price: amountVnd,
        },
      ],
    };

    const apiRes = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', payload, {
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (apiRes.data && apiRes.data.code === '00') {
      const data = apiRes.data.data;
      const trans = new PaymentTransaction({
        bookingId: bookingId || '',
        amount: amountVnd,
        currency: 'VND',
        paymentMethod: 'PAYOS',
        transactionRef: String(orderCode),
        status: 'PENDING',
        createdAt: new Date(),
      });
      await trans.save();

      return res.json({
        status: 'SUCCESS',
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        orderCode,
        bookingId,
        amount: amountVnd,
      });
    } else {
      throw new Error((apiRes.data && apiRes.data.desc) || 'PayOS error');
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error initializing PayOS payment: ' + error.message });
  }
});

// GET /api/v1/payment/payos/verify/:orderCode
router.get('/payos/verify/:orderCode', async (req, res) => {
  const { orderCode } = req.params;
  try {
    let orderInfo = null;

    if (payos) {
      try {
        orderInfo = await payos.getPaymentLinkInformation(Number(orderCode));
      } catch (e) {
        console.warn('PayOS getPaymentLinkInformation error:', e.message);
      }
    }

    if (!orderInfo) {
      const apiRes = await axios.get(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
        },
      });
      if (apiRes.data && apiRes.data.code === '00') {
        orderInfo = apiRes.data.data;
      }
    }

    const status = orderInfo ? orderInfo.status : 'PENDING';
    const amount = orderInfo ? orderInfo.amount : 0;

    // Find and update transaction
    const trans = await PaymentTransaction.findOne({ transactionRef: String(orderCode) });
    let booking = null;

    if (trans) {
      if (trans.bookingId) {
        booking = await Booking.findById(trans.bookingId);
      }

      if (status === 'PAID') {
        trans.status = 'SUCCESS';
        await trans.save();

        if (booking) {
          booking.paymentStatus = 'PAID';
          booking.updatedAt = new Date();
          await booking.save();
        }
      } else if (status === 'CANCELLED') {
        trans.status = 'CANCELLED';
        await trans.save();
      }
    }

    return res.json({
      orderCode: Number(orderCode),
      status,
      amount,
      bookingId: trans ? trans.bookingId : null,
      tourName: booking ? booking.tourName : null,
      bookingDate: booking ? booking.bookingDate : null,
      data: orderInfo,
    });
  } catch (error) {
    return res.json({
      orderCode: Number(orderCode),
      status: 'PENDING',
      message: 'Payment status check: ' + error.message,
    });
  }
});

// POST /api/v1/payment/payos/webhook
router.post('/payos/webhook', async (req, res) => {
  try {
    const payload = req.body;
    if (payload && payload.data) {
      const { orderCode, code } = payload.data;
      if (orderCode && code === '00') {
        const trans = await PaymentTransaction.findOne({ transactionRef: String(orderCode) });
        if (trans) {
          trans.status = 'SUCCESS';
          await trans.save();

          if (trans.bookingId) {
            const booking = await Booking.findById(trans.bookingId);
            if (booking) {
              booking.paymentStatus = 'PAID';
              booking.updatedAt = new Date();
              await booking.save();
            }
          }
        }
      }
    }
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});

// GET /api/v1/payment/transactions/:bookingId
router.get('/transactions/:bookingId', async (req, res) => {
  try {
    const trans = await PaymentTransaction.findOne({ bookingId: req.params.bookingId });
    if (!trans) return res.status(404).json({ message: 'Transaction not found' });
    return res.json(trans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/payment/transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find().sort({ createdAt: -1 });
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
