import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConversationId } from '../utils/chatUtils';
import { API_BASE_URL } from '../config/api';
import { formatVND } from '../utils/formatCurrency';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load current user from localStorage
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert("Vui lòng đăng nhập để tiếp tục đặt lịch!");
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(stored);
      if (!u) {
        alert("Vui lòng đăng nhập để tiếp tục đặt lịch!");
        navigate('/login');
        return;
      }
      setCurrentUser(u);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  // Retrieve booking details from state, or provide realistic defaults
  const stateData = location.state || {};
  const rawPricePerHour = Number(stateData.pricePerHour) || 100000;
  const pricePerHourVND = rawPricePerHour < 1000 ? rawPricePerHour * 25000 : rawPricePerHour;

  const hours = Number(stateData.hours) || 4;
  const people = Number(stateData.people) || 2;
  const defaultTotal = Math.round(pricePerHourVND * hours * people * 1.1);

  const rawTotalCost = Number(stateData.totalCost) || defaultTotal;
  const totalCostVND = rawTotalCost < 1000 ? Math.round(rawTotalCost * 25000) : Math.round(rawTotalCost);

  const bookingDetails = {
    guideId: stateData.guideId || '',
    guideEmail: stateData.guideEmail || '',
    guideName: stateData.guideName || 'Local Guide',
    guideAvatar: stateData.guideAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    tourName: stateData.tourName || 'Tour khám phá cùng người bản địa',
    city: stateData.city || 'Miền Trung, Việt Nam',
    date: stateData.date || '2026-10-20',
    startTime: stateData.startTime || '14:00',
    endTime: stateData.endTime || '18:00',
    hours: hours,
    people: people,
    pricePerHour: pricePerHourVND,
    totalCost: totalCostVND
  };

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('payos'); // 'payos' | 'momo' | 'card' | 'cash'

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Card details simulation
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Handle Payment & Booking Submission to MongoDB
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const bookingPayload = {
      travelerId: currentUser?.id || null,
      helperId: bookingDetails.guideId,
      tourName: bookingDetails.tourName,
      bookingDate: bookingDetails.date,
      startTime: bookingDetails.startTime,
      endTime: bookingDetails.endTime,
      durationHours: Number(bookingDetails.hours),
      meetLocation: meetingLocation.trim(),
      specialRequests: specialRequests.trim(),
      totalPrice: totalCostVND, // Stored in VND
      status: 'PENDING',
      paymentStatus: (paymentMethod === 'cash' || paymentMethod === 'payos') ? 'UNPAID' : 'PAID'
    };

    try {
      const queryParams = new URLSearchParams();
      if (email) queryParams.append('travelerEmail', email.trim());
      if (bookingDetails.guideEmail) queryParams.append('helperEmail', bookingDetails.guideEmail.trim());

      const res = await fetch(`${API_BASE_URL}/api/v1/bookings?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setIsProcessing(false);
        const msg = errorData.message || (res.status === 409 
          ? "Trùng lịch! Local Helper đã có lịch hẹn trong khung giờ này. Vui lòng chọn khung giờ khác."
          : "Không thể tạo yêu cầu đặt lịch. Vui lòng thử lại sau.");
        setErrorMessage(msg);
        alert(msg);
        return;
      }

      const savedBooking = await res.json();
      const bookingId = savedBooking.id || `LM-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedBookingId(bookingId);

      // Initial chat notification message
      try {
        const guideEmailClean = bookingDetails.guideEmail ? bookingDetails.guideEmail.trim() : 'minh.danang@localmate.com';
        const senderEmailClean = (email || 'myduyen@localmate.com').trim();
        const convId = getConversationId(senderEmailClean, guideEmailClean);
        const msgText = `Xin chào ${bookingDetails.guideName}! Tôi đã gửi yêu cầu đặt tour "${bookingDetails.tourName}" vào ngày ${bookingDetails.date} từ ${bookingPayload.startTime} đến ${bookingPayload.endTime}. Rất mong bạn sớm xác nhận nhé!`;
        
        await fetch(`${API_BASE_URL}/api/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            senderId: senderEmailClean,
            receiverId: guideEmailClean,
            content: msgText,
            createdAt: new Date().toISOString()
          })
        });
      } catch (chatErr) {
        console.warn('Could not send initial booking chat message:', chatErr);
      }

      // If user selected PayOS VietQR
      if (paymentMethod === 'payos') {
        const payosRes = await fetch(`${API_BASE_URL}/api/v1/payment/payos/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: savedBooking.id || bookingId,
            amount: totalCostVND,
            description: `Tour ${String(bookingId).slice(-6)}`,
            buyerName: fullName,
            buyerEmail: email
          })
        });

        const payosData = await payosRes.json().catch(() => ({}));
        if (payosRes.ok && payosData.checkoutUrl) {
          window.location.href = payosData.checkoutUrl;
          return;
        }
        
        throw new Error(payosData.message || 'Không thể khởi tạo cổng thanh toán PayOS.');
      }

      setTimeout(() => {
        setIsProcessing(false);
        setBookingSuccess(true);
      }, 900);

    } catch (err) {
      console.error('Error creating booking or initializing payment:', err);
      setIsProcessing(false);
      const msg = err.message || "Lỗi kết nối đến máy chủ đặt lịch. Vui lòng thử lại.";
      setErrorMessage(msg);
      alert(msg);
    }
  };

  const baseCost = Math.round(bookingDetails.pricePerHour * bookingDetails.hours * bookingDetails.people);
  const platformFee = Math.round(baseCost * 0.1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 selection:bg-cyan-700 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        
        {/* Stepper Header */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-slate-900">
                Xác nhận &amp; Thanh toán Đặt lịch
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Hoàn tất thông tin thanh toán để xác nhận trải nghiệm cùng Local Helper bản địa đã được xác minh.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>100% Bảo vệ bởi LocalMate Shield</span>
            </div>
          </div>

          <div className="flex items-center gap-4 max-w-xl">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <span>Chọn Tour</span>
            </div>
            <div className="flex-grow h-0.5 bg-teal-600"></div>

            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-teal-100">
                2
              </div>
              <span>Thanh toán &amp; Ký quỹ</span>
            </div>
            <div className="flex-grow h-0.5 bg-slate-200"></div>

            <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span>Hoàn tất &amp; Giữ chỗ</span>
            </div>
          </div>
        </section>

        {/* Main 2-Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Details & Payment Methods (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
                <span>{errorMessage}</span>
              </div>
            )}
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              
              {/* Section 1: Contact Details */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-lg font-bold text-slate-900">
                      1. Thông tin liên hệ Du khách
                    </h2>
                    <p className="text-xs text-slate-500">Local Helper sẽ sử dụng thông tin này để liên hệ và đón bạn đúng giờ.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Mỹ Duyên"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ví dụ: myduyen@example.com"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Số điện thoại / Zalo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0988 776 655"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Điểm hẹn / Địa chỉ đón <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      placeholder="Ví dụ: Sảnh khách sạn Novotel Đà Nẵng, Cổng sân bay, hoặc địa chỉ cụ thể"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Yêu cầu đặc biệt &amp; Ghi chú thêm (Tùy chọn)
                    </label>
                    <textarea 
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Chế độ ăn uống (ăn chay, dị ứng hải sản), nhu cầu di chuyển xe máy/ô tô, địa điểm chụp ảnh yêu thích..."
                      className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Method */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-lg font-bold text-slate-900">
                      2. Chọn phương thức thanh toán
                    </h2>
                    <p className="text-xs text-slate-500">Thanh toán bảo mật, hỗ trợ chuyển khoản ngân hàng Việt Nam 24/7 và tiền mặt.</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  
                  {/* PayOS VietQR */}
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'payos' 
                      ? 'border-cyan-700 bg-cyan-50/30 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={paymentMethod === 'payos'} 
                        onChange={() => setPaymentMethod('payos')}
                        className="w-4 h-4 text-cyan-700 focus:ring-cyan-600"
                      />
                      <div className="w-12 h-10 bg-cyan-800 rounded-lg p-1 flex flex-col items-center justify-center shadow-xs text-white shrink-0">
                        <span className="material-symbols-outlined text-[19px]">qr_code_scanner</span>
                        <span className="text-[8px] font-black tracking-tighter leading-none mt-0.5">VIETQR</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">PayOS (Quét mã VietQR / Chuyển khoản 24/7)</p>
                        <p className="text-xs text-slate-500">Quét mã bằng mọi ứng dụng ngân hàng (VCB, MB, Techcombank, VPBank, TPBank...)</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-700 bg-cyan-100/60 px-2 py-0.5 rounded">KHUYÊN DÙNG</span>
                  </label>

                  {/* MoMo */}
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'momo' 
                      ? 'border-cyan-700 bg-cyan-50/30 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={paymentMethod === 'momo'} 
                        onChange={() => setPaymentMethod('momo')}
                        className="w-4 h-4 text-cyan-700 focus:ring-cyan-600"
                      />
                      <div className="w-12 h-10 bg-[#A50064] rounded-lg p-1 flex items-center justify-center shadow-xs">
                        <span className="text-white font-bold text-xs tracking-tighter">MoMo</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Ví điện tử MoMo</p>
                        <p className="text-xs text-slate-500">Quét mã và thanh toán tức thì qua ứng dụng MoMo trên điện thoại</p>
                      </div>
                    </div>
                  </label>

                  {/* Credit / Debit Card */}
                  <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-cyan-700 bg-cyan-50/30 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'card'} 
                          onChange={() => setPaymentMethod('card')}
                          className="w-4 h-4 text-cyan-700 focus:ring-cyan-600"
                        />
                        <div className="w-12 h-10 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-cyan-700 text-[24px]">credit_card</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">Thẻ quốc tế / Nội địa (Visa, Mastercard, JCB)</p>
                          <p className="text-xs text-slate-500">Bảo mật thẻ theo chuẩn quốc tế 3D-Secure</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 text-xs text-slate-400 font-semibold">
                        <span>VISA</span> • <span>MC</span>
                      </div>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Số thẻ</label>
                          <input 
                            type="text" 
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Hạn sử dụng (MM/YY)</label>
                          <input 
                            type="text" 
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Mã bảo mật CVV / CVC</label>
                          <input 
                            type="password" 
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-600"
                          />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Cash on Tour */}
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-cyan-700 bg-cyan-50/30 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={paymentMethod === 'cash'} 
                        onChange={() => setPaymentMethod('cash')}
                        className="w-4 h-4 text-cyan-700 focus:ring-cyan-600"
                      />
                      <div className="w-12 h-10 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-emerald-600 text-[24px]">local_atm</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Thanh toán tiền mặt khi gặp mặt</p>
                        <p className="text-xs text-slate-500">Thanh toán trực tiếp cho Local Helper bằng tiền mặt VNĐ vào đầu buổi trải nghiệm</p>
                      </div>
                    </div>
                  </label>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                  <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
                  <span>Giao dịch được mã hóa SSL 256-bit chuẩn an toàn ngân hàng.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full btn-primary py-4 text-base font-bold shadow-md disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {paymentMethod === 'payos' ? 'Đang chuyển hướng tới cổng PayOS VietQR...' : 'Đang xử lý yêu cầu đặt lịch...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      {paymentMethod === 'payos' ? 'qr_code_2' : 'check_circle'}
                    </span>
                    <span>
                      {paymentMethod === 'payos' 
                        ? `Thanh toán VietQR (${formatVND(totalCostVND)})`
                        : `Xác nhận & Đặt lịch (${formatVND(totalCostVND)})`}
                    </span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right Column: Order Summary Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-headline-md text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Tóm tắt đặt lịch
              </h3>

              {/* Guide Card Preview */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <img 
                  alt={bookingDetails.guideName} 
                  className="w-14 h-14 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 shrink-0" 
                  src={bookingDetails.guideAvatar} 
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 truncate">{bookingDetails.guideName}</span>
                    <span className="material-symbols-outlined text-cyan-700 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{bookingDetails.city}</p>
                  <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-semibold text-slate-800">4.9 • Helper được đánh giá cao</span>
                  </div>
                </div>
              </div>

              {/* Experience Details List */}
              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">TRẢI NGHIỆM ĐÃ CHỌN</p>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{bookingDetails.tourName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">NGÀY TRẢI NGHIỆM</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.date}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">THỜI LƯỢNG</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.hours} Giờ</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">SỐ LƯỢNG KHÁCH</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.people} Người</p>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Giá cơ bản ({formatVND(bookingDetails.pricePerHour)}/giờ x {bookingDetails.hours}h x {bookingDetails.people} người)</span>
                  <span className="font-semibold text-slate-900">
                    {formatVND(baseCost)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bảo vệ LocalMate Shield (10%)</span>
                  <span className="font-semibold text-slate-900">
                    {formatVND(platformFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Tổng thanh toán</span>
                    <span className="text-[11px] text-slate-400">Đã bao gồm tất cả thuế &amp; phí dịch vụ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-xl font-bold text-cyan-800 block">
                      {formatVND(totalCostVND)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantee badge */}
              <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100/80 flex items-start gap-2.5 text-xs text-cyan-900">
                <span className="material-symbols-outlined text-[18px] text-cyan-700 shrink-0 mt-0.5">verified</span>
                <p className="leading-relaxed">
                  <strong>Miễn phí hủy:</strong> Hoàn tiền 100% nếu hủy trước thời gian bắt đầu 48 giờ.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Success Modal */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">
                hourglass_top
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
                Đã gửi yêu cầu • Chờ phản hồi
              </span>
              <h3 className="font-headline-md text-2xl font-bold text-slate-900 mt-3">
                Đã gửi yêu cầu đặt lịch!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Yêu cầu đã được gửi tới <strong>{bookingDetails.guideName}</strong>. Nếu Local Helper không xác nhận trong vòng <strong>15 phút</strong>, yêu cầu sẽ tự động hết hạn.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Mã đặt lịch:</span>
                <span className="font-bold text-cyan-800 font-mono">{confirmedBookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Local Helper:</span>
                <span className="font-bold text-slate-800">{bookingDetails.guideName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trải nghiệm:</span>
                <span className="font-bold text-slate-800">{bookingDetails.tourName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lịch trình yêu cầu:</span>
                <span className="font-bold text-slate-800">
                  {bookingDetails.date} • {bookingDetails.startTime} - {bookingDetails.endTime} ({bookingDetails.hours} giờ)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-amber-700">CHỜ PHẢN HỒI (Tối đa 15 phút)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm đón:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{meetingLocation}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Tổng tiền:</span>
                <span className="font-bold text-slate-800 text-sm">{formatVND(totalCostVND)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => navigate('/traveler', { state: { ...bookingDetails } })}
                className="py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                Xem bảng điều khiển
              </button>
              <button 
                onClick={() => navigate('/chat', { state: { ...bookingDetails } })}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Nhắn tin với Helper
              </button>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer block mx-auto"
            >
              Quay lại Trang chủ
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
