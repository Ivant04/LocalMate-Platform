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
    // PayOS requires orderCode to be a unique integer <= Number.MAX_SAFE_INTEGER
    const orderCode = Date.now();

    let description = `Tour ${String(orderCode).slice(-6)}`;
    if (customDescription && customDescription.trim()) {
      let sanitized = customDescription
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim();
      if (sanitized.length > 25) sanitized = sanitized.substring(0, 25);
      if (sanitized.length > 0) description = sanitized;
    }

    const returnUrl = `${FRONTEND_URL}/payment-result?bookingId=${bookingId || ''}&orderCode=${orderCode}&status=PAID`;
    const cancelUrl = `${FRONTEND_URL}/payment-result?bookingId=${bookingId || ''}&orderCode=${orderCode}&cancel=true&status=CANCELLED`;

    if (payos) {
      let paymentLinkRes = null;
      try {
        paymentLinkRes = await payos.createPaymentLink({
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
      } catch (sdkError) {
        console.warn('PayOS SDK call error:', sdkError.message || sdkError);
      }

      if (paymentLinkRes && paymentLinkRes.checkoutUrl) {
        try {
          const trans = new PaymentTransaction({
            bookingId: String(bookingId || `BK-${orderCode}`),
            orderCode: orderCode,
            amount: amountVnd,
            description: description,
            checkoutUrl: paymentLinkRes.checkoutUrl,
            paymentLinkId: paymentLinkRes.paymentLinkId || '',
            status: 'PENDING',
          });
          await trans.save();
        } catch (dbErr) {
          console.warn('PaymentTransaction save warning:', dbErr.message);
        }

        return res.json({
          status: 'SUCCESS',
          checkoutUrl: paymentLinkRes.checkoutUrl,
          qrCode: paymentLinkRes.qrCode || '',
          orderCode,
          bookingId,
          amount: amountVnd,
        });
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
      try {
        const trans = new PaymentTransaction({
          bookingId: String(bookingId || `BK-${orderCode}`),
          orderCode: orderCode,
          amount: amountVnd,
          description: description,
          checkoutUrl: data.checkoutUrl,
          paymentLinkId: data.paymentLinkId || '',
          status: 'PENDING',
        });
        await trans.save();
      } catch (dbErr) {
        console.warn('PaymentTransaction save warning:', dbErr.message);
      }

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
    const trans = await PaymentTransaction.findOne({
      $or: [{ orderCode: Number(orderCode) }, { transactionRef: String(orderCode) }]
    });
    let booking = null;

    if (trans) {
      if (trans.bookingId) {
        booking = await Booking.findById(trans.bookingId).catch(() => null);
      }

      if (status === 'PAID') {
        trans.status = 'PAID';
        await trans.save();

        if (booking) {
          const price = Number(booking.totalPrice) || amount || 0;
          const fee = Math.round(price * 0.10); // 10% hoa hồng nền tảng
          booking.paymentStatus = 'PAID';
          booking.escrowStatus = 'HELD'; // Bước 2: Bên trung gian giữ tiền trong quỹ Escrow
          booking.escrowAmount = price;
          booking.platformCommissionRate = 0.10;
          booking.platformFee = fee;
          booking.helperPayoutAmount = price - fee;
          booking.escrowHeldAt = new Date();
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
