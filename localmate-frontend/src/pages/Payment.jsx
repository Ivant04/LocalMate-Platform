import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConversationId } from '../utils/chatUtils';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load current user from localStorage
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert("Please sign in to proceed with booking!");
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(stored);
      if (!u) {
        alert("Please sign in to proceed with booking!");
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
  const bookingDetails = {
    guideId: stateData.guideId || '',
    guideEmail: stateData.guideEmail || '',
    guideName: stateData.guideName || 'Local Guide',
    guideAvatar: stateData.guideAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    tourName: stateData.tourName || 'Authentic Local Guided Tour',
    city: stateData.city || 'Central Vietnam',
    date: stateData.date || '2026-10-05',
    hours: stateData.hours || 4,
    people: stateData.people || 2,
    pricePerHour: stateData.pricePerHour || 12,
    totalCost: stateData.totalCost || 105
  };

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || 'My Duyen');
  const [email, setEmail] = useState(currentUser?.email || 'myduyen@localmate.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+84 988 776 655');
  const [meetingLocation, setMeetingLocation] = useState('Novotel Danang Premier Han River (Main Lobby)');
  const [specialRequests, setSpecialRequests] = useState('Group of 2, interested in authentic street food and watching Dragon Bridge fire performance.');
  const [paymentMethod, setPaymentMethod] = useState('payos'); // 'payos' | 'momo' | 'card' | 'cash'

  // Card details simulation
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');

  // Update contact info when currentUser loads
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

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
      startTime: bookingDetails.startTime || '14:00',
      endTime: bookingDetails.endTime || '18:00',
      durationHours: Number(bookingDetails.hours),
      meetLocation: meetingLocation.trim(),
      specialRequests: specialRequests.trim(),
      totalPrice: Number(bookingDetails.totalCost) * 25000, // Stored in VND
      status: 'PENDING',
      paymentStatus: (paymentMethod === 'cash' || paymentMethod === 'payos') ? 'UNPAID' : 'PAID'
    };

    try {
      const queryParams = new URLSearchParams();
      if (email) queryParams.append('travelerEmail', email.trim());
      if (bookingDetails.guideEmail) queryParams.append('helperEmail', bookingDetails.guideEmail.trim());

      const res = await fetch(`http://localhost:8080/api/v1/bookings?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setIsProcessing(false);
        const msg = errorData.message || (res.status === 409 
          ? "Time conflict! The helper is already booked during this time interval. Please choose another time slot."
          : "Could not submit booking request. Please check helper status.");
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
        const msgText = `Hello ${bookingDetails.guideName}! I have submitted a booking request for "${bookingDetails.tourName}" on ${bookingDetails.date} from ${bookingPayload.startTime} to ${bookingPayload.endTime}. Please accept within 15 minutes!`;
        
        await fetch('http://localhost:8080/api/v1/messages', {
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
        const amountInVnd = Number(bookingDetails.totalCost) * 25000;
        const payosRes = await fetch('http://localhost:8080/api/v1/payment/payos/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: savedBooking.id || bookingId,
            amount: amountInVnd,
            description: `Tour ${bookingId.substring(0, 8)}`,
            buyerName: fullName,
            buyerEmail: email
          })
        });

        if (payosRes.ok) {
          const payosData = await payosRes.json();
          if (payosData.checkoutUrl) {
            window.location.href = payosData.checkoutUrl;
            return;
          }
        }
        
        const errData = await payosRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to initialize PayOS payment checkout.');
      }

      setTimeout(() => {
        setIsProcessing(false);
        setBookingSuccess(true);
      }, 900);

    } catch (err) {
      console.error('Error creating booking or initializing payment:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || "Network error connecting to booking server. Please retry.");
    }
  };

  const vndEquivalent = (bookingDetails.totalCost * 25000).toLocaleString('vi-VN');

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 selection:bg-cyan-700 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        
        {/* Stepper Header */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-slate-900">
                Confirm & Secure Your Booking
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Complete your payment details to confirm your guided experience with verified Local Mates.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>100% Protected by LocalMate Shield</span>
            </div>
          </div>

          <div className="flex items-center gap-4 max-w-xl">
            <div className="flex items-center gap-2 text-cyan-800 font-semibold text-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <span>Select Tour</span>
            </div>
            <div className="flex-grow h-0.5 bg-cyan-600"></div>

            <div className="flex items-center gap-2 text-cyan-800 font-bold text-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-cyan-100">
                2
              </div>
              <span>Checkout & Payment</span>
            </div>
            <div className="flex-grow h-0.5 bg-slate-200"></div>

            <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
              <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span>Confirmation</span>
            </div>
          </div>
        </section>

        {/* Main 2-Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Details & Payment Methods (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              
              {/* Section 1: Contact Details */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-lg font-bold text-slate-900">
                      1. Traveler Contact Information
                    </h2>
                    <p className="text-xs text-slate-500">Your local guide will use these details to coordinate with you.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. My Duyen"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. myduyen@localmate.com"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+84 988 776 655"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Meeting Point / Pickup Location <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      placeholder="e.g. Hotel Lobby, Airport Gate, or Street Address"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Special Requests & Preferences (Optional)
                    </label>
                    <textarea 
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Dietary requirements (vegetarian, seafood allergy), mobility preferences, photography spots, etc."
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
                      2. Choose Payment Method
                    </h2>
                    <p className="text-xs text-slate-500">Fast, encrypted, and secure local and international options.</p>
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
                        <p className="font-semibold text-sm text-slate-900">PayOS (VietQR / Chuyển khoản ngân hàng 24/7)</p>
                        <p className="text-xs text-slate-500">Quét mã VietQR bằng mọi app ngân hàng (VCB, MB, Techcombank, VPBank...)</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-700 bg-cyan-100/60 px-2 py-0.5 rounded">RECOMMENDED</span>
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
                        <p className="font-semibold text-sm text-slate-900">MoMo E-Wallet</p>
                        <p className="text-xs text-slate-500">Scan & pay instantly via MoMo app on your phone</p>
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
                          <p className="font-semibold text-sm text-slate-900">Credit / Debit Card</p>
                          <p className="text-xs text-slate-500">Visa, Mastercard, JCB, or American Express</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 text-xs text-slate-400 font-semibold">
                        <span>VISA</span> • <span>MC</span>
                      </div>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Card Number</label>
                          <input 
                            type="text" 
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Expiry (MM/YY)</label>
                          <input 
                            type="text" 
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">CVV / CVC</label>
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
                        <p className="font-semibold text-sm text-slate-900">Pay in Cash upon Meeting</p>
                        <p className="text-xs text-slate-500">Pay directly to your Local Guide in VND / USD during the tour</p>
                      </div>
                    </div>
                  </label>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                  <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
                  <span>End-to-end 256-bit SSL encrypted transaction with bank-grade safety.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {paymentMethod === 'payos' ? 'Redirecting to PayOS VietQR Checkout...' : 'Securing Your Booking in MongoDB...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      {paymentMethod === 'payos' ? 'qr_code_2' : 'check_circle'}
                    </span>
                    <span>
                      {paymentMethod === 'payos' 
                        ? `Pay with PayOS VietQR (${vndEquivalent} VND)`
                        : `Confirm & Pay $${bookingDetails.totalCost} USD (${vndEquivalent} VND)`}
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
                Booking Summary
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
                    <span className="text-xs font-semibold text-slate-800">4.9 • Top Rated Guide</span>
                  </div>
                </div>
              </div>

              {/* Experience Details List */}
              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">SELECTED EXPERIENCE</p>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{bookingDetails.tourName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">SCHEDULE DATE</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.date}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">DURATION</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.hours} Hours</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">NUMBER OF GUESTS</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{bookingDetails.people} Travelers</p>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Rate (${bookingDetails.pricePerHour}/hr x {bookingDetails.hours}h x {bookingDetails.people}p)</span>
                  <span className="font-semibold text-slate-900">
                    ${bookingDetails.pricePerHour * bookingDetails.hours * bookingDetails.people}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>LocalMate Shield Protection (10%)</span>
                  <span className="font-semibold text-slate-900">
                    ${Math.round(bookingDetails.pricePerHour * bookingDetails.hours * bookingDetails.people * 0.1)}
                  </span>
                </div>
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Total Due</span>
                    <span className="text-[11px] text-slate-400">Includes all taxes &amp; service fees</span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-xl font-bold text-cyan-800 block">
                      ${bookingDetails.totalCost} USD
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      ≈ {vndEquivalent} VND
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantee badge */}
              <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100/80 flex items-start gap-2.5 text-xs text-cyan-900">
                <span className="material-symbols-outlined text-[18px] text-cyan-700 shrink-0 mt-0.5">verified</span>
                <p className="leading-relaxed">
                  <strong>Free Cancellation:</strong> Full refund if cancelled 48 hours prior to start time.
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
                Request Sent • Awaiting Helper
              </span>
              <h3 className="font-headline-md text-2xl font-bold text-slate-900 mt-3">
                Booking Request Submitted!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Request sent to <strong>{bookingDetails.guideName}</strong>. If the helper does not accept within <strong>15 minutes</strong>, the request will automatically expire.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-bold text-cyan-800 font-mono">{confirmedBookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Local Guide:</span>
                <span className="font-bold text-slate-800">{bookingDetails.guideName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Experience:</span>
                <span className="font-bold text-slate-800">{bookingDetails.tourName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Schedule:</span>
                <span className="font-bold text-slate-800">
                  {bookingDetails.date} • {bookingDetails.startTime || '14:00'} - {bookingDetails.endTime || '18:00'} ({bookingDetails.hours}h)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-700">PENDING (15 min response limit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Meeting Point:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{meetingLocation}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total Authorized:</span>
                <span className="font-bold text-slate-800 text-sm">${bookingDetails.totalCost} USD ({vndEquivalent} VND)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => navigate('/traveler', { state: { ...bookingDetails } })}
                className="py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                View in Dashboard
              </button>
              <button 
                onClick={() => navigate('/chat', { state: { ...bookingDetails } })}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Message Guide
              </button>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Return to Homepage
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
