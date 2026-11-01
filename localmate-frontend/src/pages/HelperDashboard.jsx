import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';
import { formatVND, formatRateVND } from '../utils/formatCurrency';

export default function HelperDashboard() {
  const navigate = useNavigate();

  // Current logged in Helper
  const [currentUser, setCurrentUser] = useState(null);
  const [helperStatus, setHelperStatus] = useState('AVAILABLE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Helper Hourly Rate state in VND
  const [hourlyRate, setHourlyRate] = useState(100000);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [inputRate, setInputRate] = useState(100000);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccessMsg, setPriceSuccessMsg] = useState('');

  // Real requests and bookings state from MongoDB
  const [requests, setRequests] = useState([]);
  const [confirmedTours, setConfirmedTours] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Real review stats from MongoDB
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });

  // Helper Wallet State (Ví thu nhập Escrow & Rút tiền)
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Vietcombank');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState('');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // Real dynamic calendar date (defaults to current active date)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 9, 1)); // October 2026

  // Live timer tick for request expiration countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user and fetch helper profile status & hourly rate
  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert("Vui lòng đăng nhập bằng tài khoản Local Helper!");
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(stored);
      if (!u) {
        navigate('/login');
        return;
      }
      setCurrentUser(u);

      // Fetch current helper status and price
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${u.id || u.email}`);
          if (res.ok) {
            const data = await res.json();
            if (data.availabilityStatus) {
              setHelperStatus(data.availabilityStatus);
            }
            if (data.hourlyRate !== undefined || data.price !== undefined) {
              const r = Number(data.hourlyRate || data.price) || 100000;
              const rateVND = r < 1000 ? Math.round(r * 25000) : r;
              setHourlyRate(rateVND);
              setInputRate(rateVND);
            }
          }
        } catch (err) {
          console.error('Error fetching helper status and rate:', err);
        }
      };
      fetchStatus();
    } catch {
      setCurrentUser(null);
    }
  }, [navigate]);

  // Update helper hourly rate (VND)
  const handleSavePrice = async (newPrice) => {
    let rateToSave = Number(newPrice);
    if (isNaN(rateToSave) || rateToSave <= 0) {
      alert("Vui lòng nhập mức giá hợp lệ từ 10.000 ₫ đến 50.000.000 ₫/giờ.");
      return;
    }
    if (rateToSave < 1000) {
      rateToSave = Math.round(rateToSave * 25000);
    }
    if (rateToSave < 10000 || rateToSave > 50000000) {
      alert("Vui lòng nhập mức giá từ 10.000 ₫ đến 50.000.000 ₫/giờ.");
      return;
    }

    setSavingPrice(true);
    try {
      const targetId = currentUser?.id || currentUser?.email || 'minh.danang@localmate.com';
      const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${targetId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: rateToSave })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedRate = Number(data.hourlyRate || data.price) || rateToSave;
        const finalRate = updatedRate < 1000 ? updatedRate * 25000 : updatedRate;
        setHourlyRate(finalRate);
        setInputRate(finalRate);
        setIsEditingPrice(false);
        setPriceSuccessMsg(`Mức giá mỗi giờ đã được cập nhật thành công: ${formatRateVND(finalRate)}!`);
        setTimeout(() => setPriceSuccessMsg(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Không thể cập nhật mức giá.");
      }
    } catch (err) {
      console.error('Error updating price:', err);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSavingPrice(false);
    }
  };

  // Update helper availability status (AVAILABLE, BUSY, OFFLINE)
  const handleChangeStatus = async (newStatus) => {
    if (updatingStatus || newStatus === helperStatus) return;
    setUpdatingStatus(true);
    try {
      const targetId = currentUser?.id || currentUser?.email || 'minh.danang@localmate.com';
      const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${targetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setHelperStatus(newStatus);
      } else {
        alert("Không thể cập nhật trạng thái hoạt động.");
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper for computing countdown string
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return 'Đã hết hạn';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Fetch real traveler requests and confirmed bookings from MongoDB
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const email = currentUser?.email || 'minh.danang@localmate.com';
        const res = await fetch(`${API_BASE_URL}/api/v1/bookings/helper-requests?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter for pending requests and confirmed/completed tours
          const pending = data.filter(d => d.status === 'PENDING');
          const confirmed = data.filter(d => d.status === 'CONFIRMED' || d.status === 'ACCEPTED' || d.status === 'COMPLETED');
          setRequests(pending);
          setConfirmedTours(confirmed);
        }
      } catch (err) {
        console.error('Error fetching helper requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const target = currentUser?.id || currentUser?._id || currentUser?.email;
        if (!target) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/reviews/helper/${encodeURIComponent(target)}`);
        if (res.ok) {
          const data = await res.json();
          setReviewStats({
            averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    const fetchWallet = async () => {
      setWalletLoading(true);
      try {
        const email = currentUser?.email || 'helper1@gmail.com';
        const userId = currentUser?.id || currentUser?._id;
        const res = await fetch(`${API_BASE_URL}/api/v1/wallet/my-wallet?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId || '')}`);
        if (res.ok) {
          const data = await res.json();
          setWallet(data);
          if (data.bankAccount) {
            setWithdrawBank(data.bankAccount.bankName || 'Vietcombank');
            setWithdrawAccountNum(data.bankAccount.accountNumber || '');
            setWithdrawAccountHolder(data.bankAccount.accountHolder || (currentUser?.fullName || '').toUpperCase());
          }
        }
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchRequests();
    fetchReviews();
    fetchWallet();
  }, [currentUser]);

  // Handle Withdrawal Submission
  const handleConfirmWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || isNaN(amountNum) || amountNum < 10000) {
      setWithdrawErrorMsg("Số tiền rút tối thiểu là 10.000 ₫.");
      return;
    }
    if (wallet && amountNum > wallet.availableBalance) {
      setWithdrawErrorMsg(`Số tiền rút vượt quá số dư khả dụng hiện có (${formatVND(wallet.availableBalance)}).`);
      return;
    }
    if (!withdrawAccountNum.trim()) {
      setWithdrawErrorMsg("Vui lòng nhập số tài khoản ngân hàng.");
      return;
    }
    if (!withdrawAccountHolder.trim()) {
      setWithdrawErrorMsg("Vui lòng nhập tên chủ tài khoản.");
      return;
    }

    setIsSubmittingWithdraw(true);
    setWithdrawErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || currentUser?._id,
          email: currentUser?.email || 'helper1@gmail.com',
          amount: amountNum,
          bankName: withdrawBank,
          accountNumber: withdrawAccountNum.trim(),
          accountHolder: withdrawAccountHolder.trim().toUpperCase(),
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWallet(data.wallet);
        setIsWithdrawModalOpen(false);
        setWithdrawSuccessMsg(`🎉 ${data.message}`);
        setTimeout(() => setWithdrawSuccessMsg(''), 6000);
      } else {
        setWithdrawErrorMsg(data.message || 'Lỗi khi xử lý rút tiền.');
      }
    } catch (err) {
      console.error(err);
      setWithdrawErrorMsg('Lỗi kết nối máy chủ rút tiền.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate real dynamic calendar grid based on confirmed tours
  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        tours: []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTours = confirmedTours.filter(t => {
        if (!t.date) return false;
        return t.date === dateStr || t.date.endsWith(`-${String(d).padStart(2, '0')}`);
      });

      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        tours: dayTours
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        dayNum: n,
        isCurrentMonth: false,
        tours: []
      });
    }

    return days;
  };

  const [processingBookingId, setProcessingBookingId] = useState(null);

  const handleAccept = async (id, travelerName, tourName) => {
    if (processingBookingId) return;
    setProcessingBookingId(id);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${id}/accept`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Không thể chấp nhận yêu cầu đặt lịch. Vui lòng thử lại.");
        setProcessingBookingId(null);
        return;
      }

      // Find the accepted item from current requests
      const acceptedItem = requests.find(r => r.id === id);
      if (acceptedItem) {
        const confirmedTour = { ...acceptedItem, status: 'CONFIRMED' };
        setConfirmedTours(prev => [confirmedTour, ...prev]);
      }

      setRequests(prev => prev.filter(r => r.id !== id));
      alert(`Đã nhận tour thành công! Chuyến đi "${tourName}" cùng ${travelerName} đã được xác nhận. Thông báo đã được gửi đến du khách qua tin nhắn.`);
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleDecline = async (id, travelerName) => {
    if (window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu từ ${travelerName}?`)) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/bookings/${id}/decline`, { method: 'POST' });
      } catch (err) {
        console.error(err);
      }
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  // Real Total Earnings in VND (Helper thực nhận 90% sau 10% phí sàn)
  const realTotalEarnings = confirmedTours.reduce((sum, t) => {
    const val = Number(t.helperPayoutAmount) || Math.round((Number(t.price || t.totalPrice) || 0) * 0.9);
    const vnd = val < 1000 ? val * 25000 : val;
    return sum + Math.round(vnd);
  }, 0);

  // Real Weekly Earnings by Day of Week (Helper thực nhận 90%)
  const weeklyDayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weeklyEarnings = [0, 0, 0, 0, 0, 0, 0];

  confirmedTours.forEach(tour => {
    if (tour.date) {
      const dt = new Date(tour.date);
      if (!isNaN(dt.getTime())) {
        const dayIdx = (dt.getDay() + 6) % 7; // Monday = 0
        const val = Number(tour.helperPayoutAmount) || Math.round((Number(tour.price || tour.totalPrice) || 0) * 0.9);
        const vnd = val < 1000 ? val * 25000 : val;
        weeklyEarnings[dayIdx] += Math.round(vnd);
      }
    }
  });

  const maxWeeklyEarnings = Math.max(...weeklyEarnings, 500000);
  const thisWeekTotal = weeklyEarnings.reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-cyan-700 selection:text-white">
      
      {/* SideNavBar - Shared Component - Desktop Only */}
      <Sidebar activePage="dashboard" />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tổng quan Bảng điều khiển</h1>
              
              {/* Helper Status Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleChangeStatus('AVAILABLE')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    helperStatus === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'AVAILABLE' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></span>
                  SẴN SÀNG
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus('BUSY')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    helperStatus === 'BUSY'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'BUSY' ? 'bg-white' : 'bg-amber-500'}`}></span>
                  ĐANG BẬN
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus('OFFLINE')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    helperStatus === 'OFFLINE'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'OFFLINE' ? 'bg-slate-300' : 'bg-slate-400'}`}></span>
                  NGOẠI TUYẾN
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Trạng thái: <strong className="text-teal-700">{
                helperStatus === 'AVAILABLE' ? 'Sẵn sàng' :
                helperStatus === 'BUSY' ? 'Đang bận' : 'Ngoại tuyến'
              }</strong> • {
                helperStatus === 'AVAILABLE' ? 'Sẵn sàng nhận các yêu cầu tour từ du khách' :
                helperStatus === 'BUSY' ? 'Đang trong lịch trình dẫn tour' :
                'Ngoại tuyến (tạm dừng nhận lịch mới)'
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Real Review Rating Card */}
            <div 
              onClick={() => navigate('/reviews')}
              className="flex flex-col items-center bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[110px] cursor-pointer hover:border-cyan-400 transition-colors"
              title="Xem tất cả đánh giá của bạn"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">ĐÁNH GIÁ</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {reviewStats.reviewCount > 0 ? Number(reviewStats.averageRating).toFixed(1) : (currentUser?.rating ? Number(currentUser.rating).toFixed(1) : '5.0')}
                </span>
                <span className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {reviewStats.reviewCount} nhận xét
              </span>
            </div>

            {/* Real Total Earnings Card */}
            <div className="flex flex-col items-center bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">TỔNG THU NHẬP (90%)</span>
              <span className="text-2xl font-extrabold text-teal-700">
                {formatVND(realTotalEarnings)}
              </span>
              <span className="text-[10px] text-teal-600 font-semibold mt-0.5 text-center">
                {confirmedTours.length} tour • Thực nhận 90%
              </span>
            </div>

            {/* My Hourly Rate Card */}
            <div className="relative flex flex-col items-center justify-between bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[135px] group hover:border-teal-500 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">MỨC GIÁ MỖI GIỜ</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl font-extrabold text-slate-900">{formatRateVND(hourlyRate)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputRate(hourlyRate);
                  setIsEditingPrice(true);
                }}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline transition-colors cursor-pointer bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
                <span>Đổi mức giá</span>
              </button>
            </div>
          </div>
        </section>

        {/* Price Update Success Banner */}
        {priceSuccessMsg && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm font-bold text-emerald-900">{priceSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setPriceSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Withdraw Success Banner */}
        {withdrawSuccessMsg && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-sm font-bold text-emerald-900">{withdrawSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Helper Escrow Wallet Banner */}
        <section className="bg-gradient-to-r from-teal-900 via-cyan-950 to-slate-900 rounded-3xl p-6 md:p-7 text-white shadow-md border border-teal-800/40 relative overflow-hidden">
          {/* Subtle glow elements */}
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/4 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-teal-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                <h2 className="text-lg md:text-xl font-bold tracking-tight">Ví Thu Nhập Local Helper (Escrow Wallet)</h2>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Bảo vệ Ký quỹ 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Tiền từ du khách được giữ an toàn tại Quỹ Ký Quỹ Escrow. Khi du khách xác nhận hoàn tất tour, 90% sẽ tự động cộng vào Số dư khả dụng để bạn có thể rút về tài khoản ngân hàng bất kỳ lúc nào.
              </p>
            </div>

            {/* Financial stats inside wallet */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-xs">
                <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider block">SỐ DƯ KHẢ DỤNG</span>
                <span className="text-xl md:text-2xl font-black text-white mt-1 block">
                  {formatVND(wallet?.availableBalance || 0)}
                </span>
                <span className="text-[10px] text-teal-300 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Có thể rút ngay
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-xs">
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider block">ĐANG KÝ QUỸ (HELD)</span>
                <span className="text-xl md:text-2xl font-black text-amber-300 mt-1 block">
                  {formatVND(wallet?.pendingBalance || 0)}
                </span>
                <span className="text-[10px] text-amber-200/80 font-medium">Chờ hoàn tất tour</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-xs">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">ĐÃ RÚT VỀ TK</span>
                <span className="text-xl md:text-2xl font-black text-slate-200 mt-1 block">
                  {formatVND(wallet?.totalWithdrawn || 0)}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Tổng đã thanh toán</span>
              </div>
            </div>
          </div>

          {/* Action buttons & Bank info */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="material-symbols-outlined text-base text-teal-400">account_balance</span>
              <span>
                TK nhận tiền mặc định: <strong className="text-white">{wallet?.bankAccount?.bankName || 'Vietcombank'}</strong> • {wallet?.bankAccount?.accountNumber ? `•••• ${wallet.bankAccount.accountNumber.slice(-4)}` : 'Chưa có'} ({wallet?.bankAccount?.accountHolder || 'CHỦ TÀI KHOẢN'})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Lịch sử biến động
              </button>

              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(wallet?.availableBalance > 0 ? wallet.availableBalance : '');
                  setWithdrawErrorMsg('');
                  setIsWithdrawModalOpen(true);
                }}
                disabled={!wallet || wallet.availableBalance <= 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                  wallet && wallet.availableBalance > 0
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Rút tiền về Ngân hàng
              </button>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Availability Calendar (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-lg">calendar_month</span>
                {currentCalendarDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1.5">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto no-scrollbar">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-7 mb-3">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-slate-400 tracking-wider">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 auto-rows-fr">
                  {getCalendarDays().map((item, idx) => {
                    if (!item.isCurrentMonth) {
                      return (
                        <div key={idx} className="bg-slate-50/40 rounded-xl p-2 min-h-[75px] border border-slate-100/60 opacity-30">
                          <span className="text-xs font-semibold text-slate-400">{item.dayNum}</span>
                        </div>
                      );
                    }

                    if (item.tours.length > 0) {
                      return (
                        <div key={idx} className="bg-teal-50/60 rounded-xl p-2 min-h-[75px] border-2 border-teal-600 shadow-2xs flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-teal-900">{item.dayNum}</span>
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {item.tours.map((t, k) => (
                              <div 
                                key={k} 
                                onClick={() => navigate('/chat', { state: { travelerEmail: t.email, travelerName: t.travelerName } })}
                                className="text-[10px] p-1 rounded-md bg-cyan-100 text-cyan-900 font-bold truncate border border-cyan-200 cursor-pointer hover:bg-cyan-200"
                                title={`${t.travelerName} - ${t.tourName} (${t.time || 'Tour'})`}
                              >
                                {t.travelerName}: {t.time || 'Đã đặt'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="bg-slate-50/80 rounded-xl p-2 min-h-[75px] border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-700">{item.dayNum}</span>
                        <span className="text-[10px] text-slate-300 font-medium">Trống lịch</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings & Requests (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Real Weekly Earnings Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-base text-slate-800 font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-700 text-lg">bar_chart</span>
                  Thu nhập tuần này
                </h2>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  {formatVND(thisWeekTotal)} tuần này
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-2.5 h-36 mb-2 mt-2">
                  {weeklyDayNames.map((label, idx) => {
                    const amt = weeklyEarnings[idx];
                    const barHeight = amt > 0 ? `${Math.max(15, Math.round((amt / maxWeeklyEarnings) * 100))}%` : '8%';
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="relative w-full flex justify-center">
                          {amt > 0 && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none">
                              {formatVND(amt)}
                            </span>
                          )}
                          <div 
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              amt > 0 ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-100'
                            }`} 
                            style={{ height: barHeight }}
                          ></div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yêu cầu tour chờ duyệt</h3>
                <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                  {requests.length} Chờ duyệt
                </span>
              </div>
              
              {requests.length > 0 ? (
                requests.map(req => {
                  const remaining = getTimeRemaining(req.expiresAt);
                  const isExpired = remaining === 'Đã hết hạn';
                  const reqPriceVND = Number(req.price) < 1000 ? Math.round(Number(req.price) * 25000) : Number(req.price);

                  return (
                    <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{req.travelerName}</h4>
                            {/* Live Countdown Badge */}
                            {req.expiresAt && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                isExpired 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {isExpired ? 'Đã hết hạn' : `Hết hạn sau ${remaining}`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{req.phone || req.email || 'Du khách đã xác minh'}</p>
                        </div>
                        <span className="text-teal-700 font-extrabold text-base">
                          {formatVND(reqPriceVND)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="font-bold text-slate-800">{req.tourName}</p>
                        <p className="flex items-center gap-1 text-slate-500">
                          <span className="material-symbols-outlined text-[15px] text-teal-600">calendar_month</span>
                          <span>{req.date} • {req.time}</span>
                        </p>
                        {req.location && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <span className="material-symbols-outlined text-[15px] text-teal-600">location_on</span>
                            <span>{req.location}</span>
                          </p>
                        )}
                        {req.requests && (
                          <p className="text-xs italic text-slate-500">"{req.requests}"</p>
                        )}
                        <div className="flex items-center justify-between text-[11px] bg-emerald-50/90 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-emerald-900 mt-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                            Ký quỹ Escrow (100% an toàn):
                          </span>
                          <span className="font-bold text-emerald-800">
                            Thực nhận 90%: {formatVND(req.helperPayoutAmount || Math.round(reqPriceVND * 0.9))}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => handleAccept(req.id, req.travelerName, req.tourName)}
                          disabled={isExpired || processingBookingId === req.id}
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isExpired || processingBookingId === req.id
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-2xs active:scale-95'
                          }`}
                        >
                          {processingBookingId === req.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang nhận...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Chấp nhận</span>
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDecline(req.id, req.travelerName)}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button 
                          onClick={() => navigate('/chat', {
                            state: {
                              travelerEmail: req.email,
                              travelerName: req.travelerName,
                              travelerAvatar: req.travelerAvatar,
                              tourName: req.tourName,
                              date: req.date,
                              totalCost: reqPriceVND
                            }
                          })}
                          className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                          title="Nhắn tin với du khách"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-400 text-xs shadow-2xs">
                  Hiện chưa có yêu cầu đặt tour nào!
                </div>
              )}
            </div>

            {/* Confirmed Upcoming Tours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tour đã xác nhận</h3>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                  {confirmedTours.length} Đang hoạt động
                </span>
              </div>

              {confirmedTours.length > 0 ? (
                confirmedTours.map(tour => {
                  const tourPriceVND = Number(tour.price) < 1000 ? Math.round(Number(tour.price) * 25000) : Number(tour.price);

                  return (
                    <div key={tour.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img 
                            src={tour.travelerAvatar} 
                            alt={tour.travelerName} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{tour.travelerName}</h4>
                            <p className="text-xs text-slate-400">{tour.email || 'Du khách đã xác minh'}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          tour.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {tour.status === 'COMPLETED' ? '✓ ĐÃ HOÀN TẤT' : 'ĐÃ XÁC NHẬN'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1 border border-slate-100">
                        <p className="font-bold text-slate-700">{tour.tourName}</p>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-[14px] text-teal-600">event</span>
                          <span>{tour.date} • {tour.time}</span>
                        </div>
                        {tour.location && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-[14px] text-teal-600">pin_drop</span>
                            <span>{tour.location}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] bg-cyan-50/70 border border-cyan-200/70 px-2.5 py-1.5 rounded-lg text-cyan-900 mt-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-cyan-700" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                            Quỹ Escrow:
                          </span>
                          <span className="font-bold">
                            {tour.escrowStatus === 'RELEASED' ? '✓ Đã nhận 90%' : '🔒 Đang giữ (Thực nhận: ' + formatVND(tour.helperPayoutAmount || Math.round(tourPriceVND * 0.9)) + ')'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-teal-700 font-extrabold text-base">
                            {formatVND(tourPriceVND)}
                          </span>
                          <p className="text-[10px] text-slate-400">Tổng phí (10% sàn - 90% Helper)</p>
                        </div>
                        <button
                          onClick={() => navigate('/chat', {
                            state: {
                              travelerEmail: tour.email,
                              travelerName: tour.travelerName,
                              travelerAvatar: tour.travelerAvatar,
                              tourName: tour.tourName,
                              date: tour.date,
                              totalCost: tourPriceVND
                            }
                          })}
                          className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">chat</span>
                          Nhắn tin với du khách
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-5 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs shadow-2xs">
                  Chưa có tour nào được xác nhận
                </div>
              )}
            </div>

          </div>
          
        </div>

        {/* Edit Hourly Rate Modal */}
        {isEditingPrice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 p-6 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Cập nhật mức giá theo giờ</h3>
                    <p className="text-xs text-slate-500">Thiết lập mức giá mỗi giờ cho các tour của bạn</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Du khách đặt lịch tour sẽ được tính chi phí dựa trên mức giá mỗi giờ này. Thay đổi sẽ có hiệu lực ngay lập tức trên trang Tìm kiếm và Khám phá.
                </p>

                {/* Input with Currency Prefix & Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Mức giá mỗi giờ (VNĐ)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      max="50000000"
                      value={inputRate}
                      onChange={(e) => setInputRate(e.target.value)}
                      className="w-full pl-4 pr-16 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-xl font-bold text-slate-900 outline-none transition-all"
                      placeholder="100000"
                      autoFocus
                    />
                    <span className="absolute right-4 font-bold text-sm text-slate-500">₫ / giờ</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="block text-[11px] font-bold uppercase text-slate-400 mb-2">GỢI Ý NHANH</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[50000, 100000, 150000, 200000, 250000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInputRate(preset)}
                        className={`py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          Number(inputRate) === preset
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {formatVND(preset).replace(' ₫', 'k')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Estimate Example */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Ước tính tour 3 giờ (1 người):</span>
                    <span className="font-bold text-teal-700">{formatVND((Number(inputRate) || 0) * 3)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Ước tính tour 4 giờ (2 người):</span>
                    <span className="font-bold text-teal-700">{formatVND((Number(inputRate) || 0) * 4 * 2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  disabled={savingPrice}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrice(inputRate)}
                  disabled={savingPrice || !inputRate}
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingPrice ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Lưu mức giá mới</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Withdrawal Modal */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 p-6 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Rút tiền về Tài khoản Ngân hàng</h3>
                    <p className="text-xs text-slate-500">Tiền sẽ được chuyển ngay vào tài khoản thụ hưởng của bạn</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                {/* Available Balance Notice */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">SỐ DƯ KHẢ DỤNG</span>
                    <span className="text-lg font-black text-teal-900">{formatVND(wallet?.availableBalance || 0)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(wallet?.availableBalance || 0)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs cursor-pointer"
                  >
                    Rút toàn bộ
                  </button>
                </div>

                {/* Bank Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-600 focus:bg-white"
                  >
                    {['Vietcombank', 'MB Bank (Quân Đội)', 'Techcombank', 'BIDV', 'VietinBank', 'ACB', 'TPBank', 'VPBank', 'MoMo'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số tài khoản ngân hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawAccountNum}
                    onChange={(e) => setWithdrawAccountNum(e.target.value)}
                    placeholder="Ví dụ: 1029384756"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                {/* Account Holder */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chủ tài khoản (Viết hoa không dấu) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawAccountHolder}
                    onChange={(e) => setWithdrawAccountHolder(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold uppercase focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                {/* Withdraw Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số tiền muốn rút (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      max={wallet?.availableBalance || 50000000}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="100000"
                      required
                      className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base font-bold focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-slate-400">₫</span>
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Số tiền rút:</span>
                    <strong className="text-slate-900">{formatVND(Number(withdrawAmount) || 0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí rút tiền:</span>
                    <span className="text-emerald-700 font-bold">0 ₫ (Miễn phí)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 font-bold">
                    <span>Số dư còn lại:</span>
                    <span className="text-teal-800">
                      {formatVND(Math.max(0, (wallet?.availableBalance || 0) - (Number(withdrawAmount) || 0)))}
                    </span>
                  </div>
                </div>

                {withdrawErrorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {withdrawErrorMsg}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    disabled={isSubmittingWithdraw}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || !withdrawAmount || Number(withdrawAmount) < 10000}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingWithdraw ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý rút tiền...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Xác nhận chuyển khoản</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction History Modal */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 p-6 space-y-5 animate-scaleUp max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Lịch sử Biến động Ví Thu Nhập</h3>
                    <p className="text-xs text-slate-500">Chi tiết tất cả giao dịch cộng tiền Escrow và rút tiền</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Transactions List */}
              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                {wallet?.transactions && wallet.transactions.length > 0 ? (
                  wallet.transactions.map((tx, idx) => {
                    const isCredit = tx.type === 'ESCROW_RELEASE' || tx.type === 'BONUS';
                    return (
                      <div key={tx._id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {isCredit ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{tx.description}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-sm font-extrabold block ${
                            isCredit ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isCredit ? '+' : '-'}{formatVND(tx.amount)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            tx.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : tx.status === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {tx.status === 'PENDING' ? '⏳ Chờ Admin duyệt' : tx.status === 'FAILED' ? '✕ Đã từ chối' : '✓ Thành công'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">receipt</span>
                    <p className="text-xs font-semibold text-slate-600">Chưa có giao dịch biến động nào</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
    </div>
  );
}
