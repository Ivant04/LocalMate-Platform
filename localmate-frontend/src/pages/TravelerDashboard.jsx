import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';
import { formatVND } from '../utils/formatCurrency';

export default function TravelerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Current logged in user from localStorage
  const [currentUser, setCurrentUser] = useState(null);

  // Real bookings from MongoDB
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed'

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Load user data & sync fresh profile from MongoDB
  useEffect(() => {
    const loadUser = async () => {
      const stored = localStorage.getItem('localmate_user');
      let user = null;
      if (stored) {
        try {
          user = JSON.parse(stored);
        } catch {
          user = null;
        }
      }

      if (!user) {
        alert("Vui lòng đăng nhập để xem thông tin chuyến đi!");
        navigate('/login');
        return;
      }

      if (user?.email) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/users/profile?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const freshUser = await res.json();
            user = { ...user, ...freshUser };
            localStorage.setItem('localmate_user', JSON.stringify(user));
          }
        } catch {
          // Keep cached
        }
      }
      setCurrentUser(user);
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [navigate]);

  // Live timer tick for request expiration countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return 'Đã hết hạn';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Fetch real bookings from MongoDB
  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentUser?.id) queryParams.append('travelerId', currentUser.id);
        const email = currentUser?.email || 'myduyen@localmate.com';
        queryParams.append('email', email);

        const res = await fetch(`${API_BASE_URL}/api/v1/bookings/my-bookings?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((b) => {
            const rawPrice = Number(b.totalPrice) || 250000;
            const priceVND = rawPrice < 1000 ? rawPrice * 25000 : rawPrice;

            return {
              id: b.id,
              title: b.tourName || 'Tour trải nghiệm cùng người bản địa',
              rawPrice: priceVND,
              price: formatVND(priceVND),
              date: b.bookingDate || 'Sắp diễn ra',
              time: (b.startTime && b.endTime) ? `${b.startTime} - ${b.endTime} (${b.durationHours || 4} giờ)` : (b.durationHours ? `${b.durationHours} Giờ` : 'Thời gian linh hoạt'),
              startTime: b.startTime,
              endTime: b.endTime,
              sentAt: b.sentAt,
              expiresAt: b.expiresAt,
              location: b.meetLocation || 'Đà Nẵng, Việt Nam',
              guideName: b.guideName || b.helperName || 'Local Helper',
              guideEmail: b.guideEmail || '',
              guideAvatar: b.guideAvatar || b.helperAvatar || '',
              status: b.status || 'PENDING',
              img: b.guideAvatar || b.helperAvatar || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600",
              helperId: b.helperId,
              paymentStatus: b.paymentStatus || 'UNPAID',
              escrowStatus: b.escrowStatus || (b.paymentStatus === 'PAID' ? (b.status === 'COMPLETED' ? 'RELEASED' : 'HELD') : 'NOT_APPLICABLE'),
              escrowAmount: b.escrowAmount || priceVND,
              platformFee: b.platformFee || Math.round(priceVND * 0.10),
              helperPayoutAmount: b.helperPayoutAmount || (priceVND - Math.round(priceVND * 0.10)),
              escrowHeldAt: b.escrowHeldAt,
              escrowReleasedAt: b.escrowReleasedAt,
              confirmedByTraveler: b.confirmedByTraveler || false,
              reviewed: b.reviewed || false,
              reviewRating: b.reviewRating,
              reviewComment: b.reviewComment,
              reviewCreatedAt: b.reviewCreatedAt
            };
          });
          setBookings(formatted);
        }
      } catch (err) {
        console.error('Error fetching bookings from MongoDB:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  // Handle incoming booking from Payment flow if any
  useEffect(() => {
    if (location.state && location.state.guideName) {
      const rawCost = Number(location.state.totalCost) || 250000;
      const costVND = rawCost < 1000 ? rawCost * 25000 : rawCost;

      const newBooking = {
        id: `booking-${Date.now()}`,
        title: location.state.tourName || `Tour trải nghiệm cùng ${location.state.guideName}`,
        rawPrice: costVND,
        price: formatVND(costVND),
        date: location.state.date || new Date().toISOString().split('T')[0],
        time: `${location.state.hours || 3} Giờ`,
        location: location.state.city || 'Trung tâm thành phố',
        guideName: location.state.guideName,
        status: "CONFIRMED",
        paymentStatus: 'PAID',
        escrowStatus: 'HELD', // Tiền vào quỹ ký quỹ Escrow
        escrowAmount: costVND,
        platformFee: Math.round(costVND * 0.10),
        helperPayoutAmount: costVND - Math.round(costVND * 0.10),
        img: location.state.guideAvatar || "https://images.unsplash.com/photo-1528127269322-539801943592?w=600"
      };

      setBookings(prev => {
        if (prev.some(b => b.id.startsWith('booking-') && b.guideName === newBooking.guideName)) {
          return prev;
        }
        return [newBooking, ...prev];
      });
    }
  }, [location.state]);

  // Escrow: Bước 3 & Bước 4 - Du khách xác nhận hoàn thành tour & Giải ngân tiền ký quỹ cho Helper
  const handleConfirmEscrow = async (bookingId, guideName, payoutAmount) => {
    const formattedPayout = payoutAmount ? formatVND(payoutAmount) : '';
    const confirmMsg = `XÁC NHẬN HOÀN THÀNH VÀ GIẢI NGÂN KÝ QUỸ:\n\nBạn xác nhận chuyến đi cùng ${guideName} đã hoàn thành đúng thỏa thuận?\n\nQuỹ ký quỹ Escrow của LocalMate sẽ tiến hành giải ngân 90% (${formattedPayout}) cho Helper. Phí bảo vệ nền tảng 10% được giữ lại.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/escrow/confirm-complete`, { method: 'POST' });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED', escrowStatus: 'RELEASED' } : b));
        alert("🎉 Giải ngân Quỹ ký quỹ Escrow thành công! Cảm ơn bạn đã xác nhận. Hãy để lại đánh giá cho Local Helper nhé!");
      } else {
        alert("Không thể giải ngân ký quỹ. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  // Mark tour as completed
  const handleCompleteBooking = async (bookingId) => {
    handleConfirmEscrow(bookingId, 'Local Helper', 0);
  };

  // Submit Review to Backend
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking || submittingReview) return;
    if (!comment.trim()) {
      setReviewError("Vui lòng viết nhận xét để chia sẻ trải nghiệm của bạn.");
      return;
    }
    setSubmittingReview(true);
    setReviewError('');

    try {
      const payload = {
        bookingId: reviewBooking.id,
        travelerId: currentUser?.id || currentUser?.email || 'myduyen@localmate.com',
        rating: rating,
        comment: comment.trim()
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === reviewBooking.id ? {
          ...b,
          reviewed: true,
          reviewRating: rating,
          reviewComment: comment.trim(),
          reviewCreatedAt: new Date().toISOString()
        } : b));
        setReviewModalOpen(false);
        setReviewBooking(null);
        setComment('');
        setRating(5);
        alert("Cảm ơn bạn! Đánh giá của bạn đã được lưu và hiển thị trên hồ sơ của Helper.");
      } else {
        setReviewError(data.message || 'Không thể gửi đánh giá.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Lỗi kết nối máy chủ gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Cancel booking with MongoDB backend sync
  const handleCancelBooking = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu đặt lịch này không?")) {
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/v1/bookings/${id}/cancel`, {
        method: 'POST'
      });
    } catch (err) {
      console.error(err);
    }

    setBookings(prev => prev.filter(b => b.id !== id));
    alert("Yêu cầu đặt lịch của bạn đã được hủy.");
  };

  const displayName = currentUser?.fullName || 'Du khách';
  const displayAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-cyan-600 selection:text-white">
      
      {/* SideNavBar - Desktop Only */}
      <Sidebar activePage="dashboard" />

      {/* Main Content Canvas */}
      <main className="flex-1 min-h-screen overflow-y-auto relative bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 space-y-8">
          
          {/* Top AppBar Header */}
          <header className="flex justify-between items-center pb-2">
            <div>
              <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-slate-900">Bảng điều khiển Du khách</h2>
              <p className="font-body-md text-sm text-slate-500 mt-1">Khám phá, đặt lịch và quản lý trải nghiệm cùng người bản địa.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-slate-600 text-[20px]">notifications</span>
              </button>
              <div 
                onClick={() => navigate('/profile')}
                className="h-10 w-10 rounded-full overflow-hidden border-2 border-cyan-700 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img className="w-full h-full object-cover" alt={displayName} src={displayAvatar} />
              </div>
            </div>
          </header>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column (4 cols) */}
            <section className="md:col-span-4 space-y-6">
              
              {/* Profile Summary Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <img className="w-full h-full object-cover" alt={displayName} src={displayAvatar} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-headline-md text-lg font-bold text-slate-900 truncate">{displayName}</h3>
                    <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-bold text-xs text-slate-800 font-semibold">4.9 Khám phá</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="font-label-caps text-[11px] text-slate-500 font-semibold uppercase tracking-wider">TỔNG CHUYẾN ĐI</p>
                    <p className="font-headline-md text-xl text-slate-900 font-bold mt-0.5">{bookings.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="font-label-caps text-[11px] text-slate-500 font-semibold uppercase tracking-wider">HELPER ĐÃ LƯU</p>
                    <p className="font-headline-md text-xl text-slate-900 font-bold mt-0.5">12</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2.5">
                <h4 className="font-label-bold text-xs text-slate-900 uppercase tracking-wider font-bold mb-3">Thao tác nhanh</h4>
                <button 
                  onClick={() => navigate('/search')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-100 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-cyan-700">travel_explore</span>
                    <span>Tìm kiếm Local Helper</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>

                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-100 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-cyan-700">manage_accounts</span>
                    <span>Cập nhật thông tin cá nhân</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

            </section>

            {/* Right Column (8 cols) - Upcoming Bookings */}
            <section className="md:col-span-8 space-y-6">
              
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-slate-900">Lịch đặt của tôi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quản lý các chuyến đi đã đặt và đánh giá trải nghiệm cùng Local Helper.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/search')}
                    className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs shadow-sm active:scale-95 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Khám phá tour mới
                  </button>
                </div>
              </div>

              {/* Bookings Status Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'all' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'active' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sắp tới / Đang chờ ({bookings.filter(b => b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'CONFIRMED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'completed' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Đã hoàn thành ({bookings.filter(b => b.status === 'COMPLETED').length})
                </button>
              </div>

              {loadingBookings ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-700 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-xs text-slate-500">Đang tải lịch đặt của bạn...</p>
                </div>
              ) : bookings.filter(b => {
                  if (activeTab === 'active') return b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'CONFIRMED';
                  if (activeTab === 'completed') return b.status === 'COMPLETED';
                  return true;
                }).length > 0 ? (
                <div className="space-y-4">
                  {bookings.filter(b => {
                    if (activeTab === 'active') return b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'CONFIRMED';
                    if (activeTab === 'completed') return b.status === 'COMPLETED';
                    return true;
                  }).map((booking) => {
                    const statusText = 
                      booking.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' :
                      booking.status === 'ACCEPTED' ? 'ĐÃ NHẬN TOUR' :
                      booking.status === 'COMPLETED' ? 'HOÀN THÀNH' :
                      booking.status === 'EXPIRED' ? 'HẾT HẠN' :
                      booking.status === 'DECLINED' ? 'TỪ CHỐI' : 'CHỜ DUYỆT';

                    return (
                      <div 
                        key={booking.id} 
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-cyan-600/40 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:h-auto md:min-h-44">
                          
                          {/* Booking Image */}
                          <div className="w-full sm:w-56 h-44 sm:h-auto overflow-hidden relative shrink-0">
                            <img 
                              className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" 
                              alt={booking.title} 
                              src={booking.img} 
                            />
                            <div className={`absolute top-3 left-3 font-semibold px-2.5 py-1 rounded-full text-[10px] shadow-sm tracking-wider uppercase border ${
                              booking.status === 'CONFIRMED' || booking.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : booking.status === 'COMPLETED'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : booking.status === 'EXPIRED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : booking.status === 'DECLINED'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {statusText}
                            </div>
                          </div>

                          {/* Booking Content */}
                          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h4 className="font-headline-md text-base md:text-lg font-bold text-slate-900 leading-snug line-clamp-1" title={booking.title}>
                                  {booking.title}
                                </h4>
                                <span className="font-headline-md text-lg text-cyan-700 font-bold shrink-0">
                                  {booking.price}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs mb-3">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                                  <span className="font-semibold text-slate-700">{booking.guideName}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                                  <span>{booking.date}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                                  <span>{booking.time}</span>
                                </div>
                                <div className="flex items-center gap-1 min-w-0 truncate" title={booking.location}>
                                  <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                                  <span className="truncate">{booking.location}</span>
                                </div>
                              </div>

                              {/* Escrow Guarantee & 4 Steps Progress */}
                              {(booking.escrowStatus === 'HELD' || booking.escrowStatus === 'RELEASED' || booking.paymentStatus === 'PAID' || booking.status === 'CONFIRMED' || booking.status === 'ACCEPTED') && (
                                <div className="mb-3 p-3.5 rounded-xl border bg-slate-50/90 border-slate-200">
                                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/70">
                                    <div className="flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-cyan-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        shield
                                      </span>
                                      <span className="text-xs font-bold text-slate-800">Quỹ Ký Quỹ Escrow (LocalMate Shield)</span>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      booking.escrowStatus === 'RELEASED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}>
                                      {booking.escrowStatus === 'RELEASED' ? '✓ Đã giải ngân 90%' : '🔒 Đang ký quỹ (Giữ an toàn)'}
                                    </span>
                                  </div>

                                  {/* 4-step interactive flow */}
                                  <div className="grid grid-cols-4 gap-1.5 text-center my-2">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                                        ✓
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 mt-1">1. Đã thanh toán</span>
                                      <span className="text-[9px] text-slate-500">Tiền vào ký quỹ</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-xs ${
                                        booking.escrowStatus === 'RELEASED' 
                                          ? 'bg-emerald-600 text-white' 
                                          : 'bg-amber-500 text-white animate-pulse'
                                      }`}>
                                        {booking.escrowStatus === 'RELEASED' ? '✓' : '2'}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 mt-1">2. Giữ tiền an toàn</span>
                                      <span className="text-[9px] text-amber-700 font-semibold">{booking.escrowStatus === 'RELEASED' ? 'Đã bảo vệ' : 'Chưa giao Helper'}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-xs ${
                                        booking.status === 'COMPLETED' 
                                          ? 'bg-emerald-600 text-white' 
                                          : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {booking.status === 'COMPLETED' ? '✓' : '3'}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 mt-1">3. Hoàn tất tour</span>
                                      <span className="text-[9px] text-slate-500">{booking.status === 'COMPLETED' ? 'Đã xác nhận' : 'Du khách xác nhận'}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-xs ${
                                        booking.escrowStatus === 'RELEASED' 
                                          ? 'bg-emerald-600 text-white' 
                                          : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {booking.escrowStatus === 'RELEASED' ? '✓' : '4'}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 mt-1">4. Giải ngân Helper</span>
                                      <span className="text-[9px] text-slate-500">{booking.escrowStatus === 'RELEASED' ? 'Đã nhận 90%' : 'Nhận 90% khi xong'}</span>
                                    </div>
                                  </div>

                                  {/* Financial breakdown */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-white/70 px-2.5 py-1.5 rounded-lg">
                                    <span>Ký quỹ: <strong className="text-slate-900">{booking.price}</strong></span>
                                    <span>Phí sàn (10%): <strong className="text-slate-700">{formatVND(booking.platformFee || Math.round((booking.rawPrice || 0) * 0.1))}</strong></span>
                                    <span>Helper thực nhận (90%): <strong className="text-emerald-700">{formatVND(booking.helperPayoutAmount || ((booking.rawPrice || 0) - Math.round((booking.rawPrice || 0) * 0.1)))}</strong></span>
                                  </div>
                                </div>
                              )}

                              {/* Status-specific banners */}
                              {booking.status === 'COMPLETED' && (
                                booking.reviewed ? (
                                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 mb-3">
                                    <div className="flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                        <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                        ✓ Đã đánh giá
                                      </span>
                                      <div className="flex text-amber-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <span key={s} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: s <= (booking.reviewRating || 5) ? "'FILL' 1" : "'FILL' 0" }}>
                                            star
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    {booking.reviewComment && (
                                      <p className="text-xs text-slate-700 italic">"{booking.reviewComment}"</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between gap-2 mb-3">
                                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                                      <span className="material-symbols-outlined text-[16px] text-blue-600">done_all</span>
                                      Chuyến đi đã hoàn thành! Hãy viết đánh giá để chia sẻ cảm nhận của bạn.
                                    </span>
                                  </div>
                                )
                              )}

                              {booking.status === 'EXPIRED' && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1 mb-3">
                                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                                    <span className="material-symbols-outlined text-[16px]">timer_off</span>
                                    Yêu cầu đã hết hạn • Helper chưa phản hồi kịp
                                  </div>
                                  <p className="text-[11px] text-rose-700 leading-relaxed">
                                    Local Helper không kịp phản hồi trong thời gian chờ 15 phút. Vui lòng quay lại danh sách để chọn Local Helper khác nhé.
                                  </p>
                                </div>
                              )}

                              {booking.status === 'PENDING' && (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 mb-3">
                                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                                    <span className="material-symbols-outlined text-[16px] text-amber-600">hourglass_top</span>
                                    Đang chờ {booking.guideName} xác nhận...
                                  </span>
                                  {booking.expiresAt && (
                                    <span className="font-bold text-amber-900 text-[11px] bg-amber-100/70 px-2 py-0.5 rounded-full">
                                      {getTimeRemaining(booking.expiresAt) === 'Đã hết hạn' ? 'Đã hết hạn' : `Hết hạn sau ${getTimeRemaining(booking.expiresAt)}`}
                                    </span>
                                  )}
                                </div>
                              )}

                              {booking.status === 'DECLINED' && (
                                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-700 mb-3">
                                  <span className="font-semibold">{booking.guideName}</span> hiện không thể nhận yêu cầu này. Vui lòng khám phá các Helper khác.
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                              {/* Write Review Button for COMPLETED bookings */}
                              {booking.status === 'COMPLETED' && !booking.reviewed && (
                                <button 
                                  onClick={() => {
                                    setReviewBooking(booking);
                                    setRating(5);
                                    setComment('');
                                    setReviewError('');
                                    setReviewModalOpen(true);
                                  }}
                                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  Viết đánh giá
                                </button>
                              )}

                              {/* Mark Tour as Completed & Release Escrow Button for ACCEPTED/CONFIRMED bookings */}
                              {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                                <button 
                                  onClick={() => handleConfirmEscrow(booking.id, booking.guideName, booking.helperPayoutAmount || ((booking.rawPrice || 0) - Math.round((booking.rawPrice || 0) * 0.1)))}
                                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  title="Xác nhận chuyến đi hoàn thành để giải ngân 90% cho Helper"
                                >
                                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                  Xác nhận hoàn tất & Giải ngân
                                </button>
                              )}

                              {booking.status === 'EXPIRED' || booking.status === 'DECLINED' ? (
                                <button 
                                  onClick={() => navigate('/search')}
                                  className="py-2 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">explore</span>
                                  Tìm Helper khác
                                </button>
                              ) : (booking.status !== 'COMPLETED') ? (
                                <button 
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-label-bold text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                                >
                                  Hủy yêu cầu
                                </button>
                              ) : null}

                              <button 
                                onClick={() => navigate('/chat', { 
                                  state: { 
                                    guideEmail: booking.guideEmail, 
                                    guideName: booking.guideName, 
                                    guideAvatar: booking.img,
                                    tourName: booking.title,
                                    date: booking.date,
                                    totalCost: booking.rawPrice
                                  } 
                                })}
                                className="py-2 px-5 rounded-xl border border-cyan-600/40 hover:bg-cyan-50 text-cyan-800 font-label-bold text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                                Nhắn tin cho Helper
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-400">calendar_today</span>
                  <p className="text-sm font-semibold text-slate-700">Chưa có lịch đặt nào</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Bạn hiện chưa có chuyến đi nào được lên lịch.
                  </p>
                  <button 
                    onClick={() => navigate('/search')}
                    className="mt-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Khám phá Local Helper
                  </button>
                </div>
              )}

            </section>

          </div>

          {/* History & Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Recent Activity History */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-label-bold text-xs text-slate-900 uppercase tracking-wider font-bold mb-4">Lịch sử hoạt động gần đây</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-slate-400 font-label-caps text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-2">TRẢI NGHIỆM</th>
                      <th className="py-2.5 px-2">ĐỊA ĐIỂM</th>
                      <th className="py-2.5 px-2">NGÀY</th>
                      <th className="py-2.5 px-2">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 text-slate-900 font-medium">Khám phá văn hóa Đại Nội Huế</td>
                      <td className="py-3 px-2 text-slate-500">Huế, Việt Nam</td>
                      <td className="py-3 px-2 text-slate-500">12/09/2026</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoàn thành
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 text-slate-900 font-medium">Làm đèn lồng &amp; ẩm thực phố cổ Hội An</td>
                      <td className="py-3 px-2 text-slate-500">Hội An, Việt Nam</td>
                      <td className="py-3 px-2 text-slate-500">28/08/2026</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoàn thành
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* "Want to Earn?" Banner */}
            <div className="bg-gradient-to-br from-white to-cyan-50/50 rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-cyan-700 text-[28px] mb-2">work_outline</span>
                <h4 className="font-headline-md text-base font-bold text-slate-900 mb-1.5">Bạn muốn trở thành Local Helper?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chia sẻ tình yêu quê hương, giới thiệu những địa điểm độc đáo và kiếm thêm thu nhập mỗi giờ.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full mt-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs font-semibold shadow-sm transition-all text-center cursor-pointer"
              >
                Đăng ký làm Local Helper
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Mobile BottomNavBar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-white border-t border-slate-200 px-2 py-3 pb-safe shadow-lg">
        <button 
          onClick={() => navigate('/search')}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="text-[11px] font-semibold mt-0.5">Khám phá</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center bg-cyan-50 text-cyan-800 rounded-full px-4 py-1 scale-95"
        >
          <span className="material-symbols-outlined text-cyan-700 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          <span className="text-[11px] font-semibold mt-0.5">Lịch đặt</span>
        </button>
        <button 
          onClick={() => navigate('/chat')}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span className="text-[11px] font-semibold mt-0.5">Tin nhắn</span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="text-[11px] font-semibold mt-0.5">Hồ sơ</span>
        </button>
      </nav>

      {/* Review Local Helper Modal Dialog */}
      {reviewModalOpen && reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  Đánh giá Local Helper
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chia sẻ trải nghiệm của bạn cùng <span className="font-semibold text-slate-800">{reviewBooking.guideName}</span> trong chuyến đi <span className="font-semibold text-slate-800">"{reviewBooking.title}"</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Đánh giá sao
                </label>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-[32px] cursor-pointer"
                        style={{
                          color: star <= (hoverRating || rating) ? '#F59E0B' : '#CBD5E1',
                          fontVariationSettings: star <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-amber-600 ml-2">
                    {['', '1 - Rất tệ', '2 - Tệ', '3 - Bình thường', '4 - Tốt', '5 - Rất tuyệt vời'][hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nhận xét
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận của bạn... Bạn ấn tượng nhất điều gì về chuyến đi này?"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005A71] focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Error Alert if any */}
              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !comment.trim()}
                  className="py-2.5 px-6 bg-[#005A71] hover:bg-[#004B5E] text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submittingReview ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <span>Gửi đánh giá</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
