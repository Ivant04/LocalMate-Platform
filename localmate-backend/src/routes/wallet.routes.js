const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Helper function to resolve and sync wallet
async function getOrSyncWallet(userId, email) {
  let normalizedEmail = (email || '').toLowerCase().trim();
  let targetUserId = userId;

  if (!targetUserId && normalizedEmail) {
    const u = await User.findOne({ email: normalizedEmail });
    if (u) targetUserId = u._id.toString();
  }

  if (!normalizedEmail && targetUserId) {
    const u = await User.findById(targetUserId).catch(() => null);
    if (u) normalizedEmail = u.email.toLowerCase();
  }

  if (!normalizedEmail && !targetUserId) {
    normalizedEmail = 'helper1@gmail.com';
    targetUserId = '6ac332801335975ffbe29804';
  }

  // Find existing wallet
  let wallet = await Wallet.findOne({
    $or: [{ userId: targetUserId }, { email: normalizedEmail }],
  });

  // Calculate live pending balance from active bookings (HELD in Escrow)
  const helperIds = [targetUserId, normalizedEmail].filter(Boolean);
  const user = await User.findOne({ email: normalizedEmail });
  if (user && !helperIds.includes(user._id.toString())) {
    helperIds.push(user._id.toString());
  }

  const activeHeldBookings = await Booking.find({
    helperId: { $in: helperIds },
    status: { $in: ['ACCEPTED', 'CONFIRMED'] },
    escrowStatus: 'HELD',
  }).lean();

  let livePendingBalance = 0;
  for (const b of activeHeldBookings) {
    const price = Number(b.totalPrice) || 0;
    const payout = b.helperPayoutAmount || (price - Math.round(price * 0.1));
    livePendingBalance += payout;
  }

  if (!wallet) {
    // Check if there are past released bookings to backfill available balance
    const releasedBookings = await Booking.find({
      helperId: { $in: helperIds },
      status: 'COMPLETED',
      escrowStatus: 'RELEASED',
    }).lean();

    let initialAvailable = 0;
    const initialTransactions = [];

    for (const b of releasedBookings) {
      const price = Number(b.totalPrice) || 0;
      const payout = b.helperPayoutAmount || (price - Math.round(price * 0.1));
      initialAvailable += payout;
      initialTransactions.push({
        type: 'ESCROW_RELEASE',
        amount: payout,
        description: `Giải ngân ký quỹ từ ${b.tourName || 'Tour trải nghiệm'} (90%)`,
        status: 'SUCCESS',
        bookingId: b._id.toString(),
        createdAt: b.escrowReleasedAt || b.updatedAt || new Date(),
      });
    }

    wallet = new Wallet({
      userId: targetUserId || (user ? user._id.toString() : 'helper-id'),
      email: normalizedEmail,
      availableBalance: initialAvailable,
      pendingBalance: livePendingBalance,
      totalEarnings: initialAvailable,
      totalWithdrawn: 0,
      bankAccount: {
        bankName: 'Vietcombank',
        accountNumber: '1029384756',
        accountHolder: (user ? user.fullName : 'LOCAL HELPER').toUpperCase(),
      },
      transactions: initialTransactions,
    });
    await wallet.save();
  } else {
    // Update live pending balance
    wallet.pendingBalance = livePendingBalance;
    await wallet.save();
  }

  return wallet;
}

// GET /api/v1/wallet/my-wallet
router.get('/my-wallet', async (req, res) => {
  try {
    const { userId, email } = req.query;
    const wallet = await getOrSyncWallet(userId, email);
    return res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/wallet/withdraw
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, email, amount, bankName, accountNumber, accountHolder } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 10000) {
      return res.status(400).json({ message: 'Số tiền rút tối thiểu là 10.000 ₫.' });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập số tài khoản ngân hàng.' });
    }

    if (!accountHolder || !accountHolder.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên chủ tài khoản.' });
    }

    const wallet = await getOrSyncWallet(userId, email);

    if (withdrawAmount > wallet.availableBalance) {
      return res.status(400).json({
        message: `Số dư khả dụng không đủ. Bạn hiện có ${wallet.availableBalance.toLocaleString('vi-VN')} ₫.`,
      });
    }

    // Deduct available balance (held while waiting for admin approval)
    wallet.availableBalance -= withdrawAmount;

    // Update bank account details
    wallet.bankAccount = {
      bankName: bankName || wallet.bankAccount?.bankName || 'Vietcombank',
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
    };

    // Record transaction with PENDING status (requires Admin approval)
    const newTx = {
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      description: `Yêu cầu rút tiền về ${wallet.bankAccount.bankName} (${wallet.bankAccount.accountNumber})`,
      status: 'PENDING', // ⏳ Chờ Admin duyệt
      bankInfo: {
        bankName: wallet.bankAccount.bankName,
        accountNumber: wallet.bankAccount.accountNumber,
        accountHolder: wallet.bankAccount.accountHolder,
      },
      createdAt: new Date(),
    };

    wallet.transactions.unshift(newTx);
    await wallet.save();

    return res.json({
      message: `Yêu cầu rút ${withdrawAmount.toLocaleString('vi-VN')} ₫ đã được gửi thành công! Vui lòng chờ Ban quản trị duyệt và chuyển khoản.`,
      wallet,
      transaction: newTx,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/wallet/admin/pending-withdrawals (Danh sách các yêu cầu rút tiền chờ Admin duyệt)
router.get('/admin/pending-withdrawals', async (req, res) => {
  try {
    const wallets = await Wallet.find({
      'transactions.status': 'PENDING',
      'transactions.type': 'WITHDRAWAL',
    }).lean();

    const pendingRequests = [];

    for (const w of wallets) {
      let user = await User.findById(w.userId).catch(() => null);
      if (!user) user = await User.findOne({ email: w.email });

      for (const tx of w.transactions) {
        if (tx.type === 'WITHDRAWAL' && tx.status === 'PENDING') {
          pendingRequests.push({
            transactionId: tx._id.toString(),
            walletId: w._id.toString(),
            userId: w.userId,
            email: w.email,
            helperName: user ? user.fullName : (w.bankAccount?.accountHolder || 'Local Helper'),
            phone: user ? user.phone : '—',
            amount: tx.amount,
            description: tx.description,
            bankInfo: tx.bankInfo || w.bankAccount,
            createdAt: tx.createdAt,
            status: tx.status,
          });
        }
      }
    }

    // Sort newest first
    pendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/wallet/admin/approve-withdrawal (Admin phê duyệt và xác nhận đã chuyển khoản)
router.post('/admin/approve-withdrawal', async (req, res) => {
  try {
    const { walletId, transactionId } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Không tìm thấy ví của Helper' });

    const tx = wallet.transactions.id(transactionId);
    if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch rút tiền' });

    if (tx.status !== 'PENDING') {
      return res.status(400).json({ message: `Giao dịch này đã được xử lý (Trạng thái: ${tx.status})` });
    }

    tx.status = 'SUCCESS';
    tx.description = `Rút tiền thành công về ${tx.bankInfo?.bankName || wallet.bankAccount?.bankName} (${tx.bankInfo?.accountNumber || wallet.bankAccount?.accountNumber})`;
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + tx.amount;

    await wallet.save();

    return res.json({
      message: `Đã phê duyệt và hoàn tất chuyển khoản ${tx.amount.toLocaleString('vi-VN')} ₫ cho Helper thành công!`,
      wallet,
      transaction: tx,
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/wallet/admin/reject-withdrawal (Admin từ chối và hoàn tiền lại về số dư khả dụng của Helper)
router.post('/admin/reject-withdrawal', async (req, res) => {
  try {
    const { walletId, transactionId, reason } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Không tìm thấy ví của Helper' });

    const tx = wallet.transactions.id(transactionId);
    if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch rút tiền' });

    if (tx.status !== 'PENDING') {
      return res.status(400).json({ message: `Giao dịch này đã được xử lý (Trạng thái: ${tx.status})` });
    }

    // Restore available balance
    wallet.availableBalance += tx.amount;
    tx.status = 'FAILED';
    tx.description = `Từ chối rút tiền (${reason || 'Thông tin ngân hàng không hợp lệ'}). Đã hoàn tiền về ví.`;

    await wallet.save();

    return res.json({
      message: `Đã từ chối lệnh rút tiền và hoàn lại ${tx.amount.toLocaleString('vi-VN')} ₫ vào Số dư khả dụng của Helper!`,
      wallet,
      transaction: tx,
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/v1/wallet/bank-account
router.put('/bank-account', async (req, res) => {
  try {
    const { userId, email, bankName, accountNumber, accountHolder } = req.body;
    const wallet = await getOrSyncWallet(userId, email);

    wallet.bankAccount = {
      bankName: bankName || 'Vietcombank',
      accountNumber: (accountNumber || '').trim(),
      accountHolder: (accountHolder || '').trim().toUpperCase(),
    };

    await wallet.save();
    return res.json({ message: 'Cập nhật tài khoản ngân hàng thành công', bankAccount: wallet.bankAccount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = {
  router,
  getOrSyncWallet,
};
