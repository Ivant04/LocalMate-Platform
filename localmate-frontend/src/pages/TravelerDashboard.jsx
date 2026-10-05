import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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
        alert("Please sign in to view your trip details!");
        navigate('/login');
        return;
      }

      if (user?.email) {
        try {
          const res = await fetch(`http://localhost:8080/api/v1/users/profile?email=${encodeURIComponent(user.email)}`);
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
  }, []);

  // Live timer tick for request expiration countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return 'Expired';
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

        const res = await fetch(`http://localhost:8080/api/v1/bookings/my-bookings?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((b) => ({
            id: b.id,
            title: b.tourName || 'Local Guided Tour',
            price: b.totalPrice ? `$${b.totalPrice > 1000 ? Math.round(b.totalPrice / 25000) : b.totalPrice}` : '$95',
            date: b.bookingDate || 'Scheduled Soon',
            time: (b.startTime && b.endTime) ? `${b.startTime} - ${b.endTime} (${b.durationHours || 4}h)` : (b.durationHours ? `${b.durationHours} Hours` : 'Flexible Duration'),
            startTime: b.startTime,
            endTime: b.endTime,
            sentAt: b.sentAt,
            expiresAt: b.expiresAt,
            location: b.meetLocation || 'Da Nang, Vietnam',
            guideName: b.guideName || b.helperName || 'Local Guide',
            guideEmail: b.guideEmail || '',
            guideAvatar: b.guideAvatar || b.helperAvatar || '',
            status: b.status || 'PENDING',
            img: b.guideAvatar || b.helperAvatar || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600",
            helperId: b.helperId,
            reviewed: b.reviewed || false,
            reviewRating: b.reviewRating,
            reviewComment: b.reviewComment,
            reviewCreatedAt: b.reviewCreatedAt
          }));
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
      const newBooking = {
        id: `booking-${Date.now()}`,
        title: location.state.tourName || `Custom Tour with ${location.state.guideName}`,
        price: `$${location.state.totalCost || 100}`,
        date: location.state.date || new Date().toISOString().split('T')[0],
        time: `${location.state.hours || 3} Hours`,
        location: location.state.city || 'City Center',
        guideName: location.state.guideName,
        status: "CONFIRMED",
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

  // Mark tour as completed
  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm("Has this experience completed? Click OK to mark it as Completed and review your Local Helper.")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/bookings/${bookingId}/complete`, { method: 'POST' });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED' } : b));
        alert("Booking marked as COMPLETED! You can now write a review for your guide.");
      } else {
        alert("Could not update booking status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  // Submit Review to Backend
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking || submittingReview) return;
    if (!comment.trim()) {
      setReviewError("Please write a comment sharing your experience.");
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

      const res = await fetch('http://localhost:8080/api/v1/reviews', {
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
        alert("Thank you! Your review has been saved and published to the guide's profile.");
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Network error connecting to review server.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Cancel booking with MongoDB backend sync
  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/v1/bookings/${id}/cancel`, {
        method: 'POST'
      });
    } catch (err) {
      console.error(err);
    }

    setBookings(prev => prev.filter(b => b.id !== id));
    alert("Your booking has been cancelled.");
  };

  const displayName = currentUser?.fullName || 'Traveler';
  const displayAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  const roleLabel = currentUser?.roles?.includes('ROLE_HELPER') ? 'Local Helper Profile' : 'Traveler Explorer';

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
              <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-slate-900">Traveler Dashboard</h2>
              <p className="font-body-md text-sm text-slate-500 mt-1">Explore, book and manage your local experiences.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
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
                      <span className="font-label-bold text-xs text-slate-800 font-semibold">4.9 Explorer</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="font-label-caps text-[11px] text-slate-500 font-semibold uppercase tracking-wider">TOTAL TRIPS</p>
                    <p className="font-headline-md text-xl text-slate-900 font-bold mt-0.5">{bookings.length + 1}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="font-label-caps text-[11px] text-slate-500 font-semibold uppercase tracking-wider">SAVED GUIDES</p>
                    <p className="font-headline-md text-xl text-slate-900 font-bold mt-0.5">12</p>
                  </div>
                </div>
              </div>

              {/* Recent Messages Preview */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-label-bold text-xs text-slate-900 uppercase tracking-wider font-bold">Recent Messages</h3>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="text-cyan-700 font-label-bold text-xs hover:underline font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  <div 
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                  >
                    <div className="relative shrink-0">
                      <img 
                        className="w-10 h-10 rounded-full object-cover shadow-sm" 
                        alt="Kevin Nguyen." 
                        src="https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/76ae7360c1ce53020a70263e5af5ab3c" 
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-label-bold text-xs text-slate-900 font-semibold truncate">Kevin Nguyen.</p>
                        <span className="text-[10px] text-slate-400">2m ago</span>
                      </div>
                      <p className="font-body-sm text-xs text-slate-500 truncate mt-0.5">Looking forward to our Hoi An food walk tomorrow!</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                  >
                    <div className="relative shrink-0">
                      <img 
                        className="w-10 h-10 rounded-full object-cover shadow-sm" 
                        alt="Elena Nguyen." 
                        src="https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/c2766862a165675fe1d55091f3325e1a" 
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-label-bold text-xs text-slate-900 font-semibold truncate">Elena Nguyen.</p>
                        <span className="text-[10px] text-slate-400">1h ago</span>
                      </div>
                      <p className="font-body-sm text-xs text-slate-500 truncate mt-0.5">The sunset boat tour departs at 5 PM sharp.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2.5">
                <h4 className="font-label-bold text-xs text-slate-900 uppercase tracking-wider font-bold mb-3">Quick Actions</h4>
                <button 
                  onClick={() => navigate('/search')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-100 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-cyan-700">travel_explore</span>
                    <span>Find Local Guides</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>

                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-100 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-cyan-700">manage_accounts</span>
                    <span>Update Profile Details</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

            </section>

            {/* Right Column (8 cols) - Upcoming Bookings */}
            <section className="md:col-span-8 space-y-6">
              
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-slate-900">My Bookings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your tour bookings and rate your experiences with Local Mates.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/search')}
                    className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs shadow-sm active:scale-95 transition-all font-semibold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Explore New Tours
                  </button>
                </div>
              </div>

              {/* Bookings Status Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'all' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Bookings ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'active' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Upcoming / Active ({bookings.filter(b => b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'CONFIRMED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'completed' ? 'bg-[#005A71] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Completed ({bookings.filter(b => b.status === 'COMPLETED').length})
                </button>
              </div>

              {loadingBookings ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-700 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-xs text-slate-500">Loading your bookings...</p>
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
                  }).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-cyan-600/40 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:h-auto md:min-h-44">
                        
                        {/* Booking Image with strictly fixed frame */}
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
                            {booking.status}
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

                            {/* Status-specific banners */}
                            {booking.status === 'COMPLETED' && (
                              booking.reviewed ? (
                                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 mb-3">
                                  <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                      <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                      ✓ Reviewed
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
                                    Tour Completed! Share your review to help other travelers.
                                  </span>
                                </div>
                              )
                            )}

                            {booking.status === 'EXPIRED' && (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1 mb-3">
                                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                                  <span className="material-symbols-outlined text-[16px]">timer_off</span>
                                  Request Expired • Helper Did Not Respond
                                </div>
                                <p className="text-[11px] text-rose-700 leading-relaxed">
                                  The helper did not respond within the 15-minute response window. This booking is not transferred automatically. Please return to the directory and choose another local guide.
                                </p>
                              </div>
                            )}

                            {booking.status === 'PENDING' && (
                              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 mb-3">
                                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                                  <span className="material-symbols-outlined text-[16px] text-amber-600">hourglass_top</span>
                                  Waiting for {booking.guideName} to accept...
                                </span>
                                {booking.expiresAt && (
                                  <span className="font-bold text-amber-900 text-[11px] bg-amber-100/70 px-2 py-0.5 rounded-full">
                                    {getTimeRemaining(booking.expiresAt) === 'Expired' ? 'Expired' : `Expires in ${getTimeRemaining(booking.expiresAt)}`}
                                  </span>
                                )}
                              </div>
                            )}

                            {booking.status === 'DECLINED' && (
                              <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-700 mb-3">
                                <span className="font-semibold">{booking.guideName}</span> was unable to accept this request. Please explore other available guides.
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 pt-2 flex-wrap">
                            {/* Write Review Button for COMPLETED bookings (Only when not reviewed yet) */}
                            {booking.status === 'COMPLETED' && !booking.reviewed && (
                              <button 
                                onClick={() => {
                                  setReviewBooking(booking);
                                  setRating(5);
                                  setComment('');
                                  setReviewError('');
                                  setReviewModalOpen(true);
                                }}
                                className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                Write Review
                              </button>
                            )}

                            {/* Mark Tour as Completed Button for ACCEPTED/CONFIRMED bookings */}
                            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                              <button 
                                onClick={() => handleCompleteBooking(booking.id)}
                                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                                title="Mark tour as finished to write a review for your guide"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Complete Tour
                              </button>
                            )}

                            {booking.status === 'EXPIRED' || booking.status === 'DECLINED' ? (
                              <button 
                                onClick={() => navigate('/search')}
                                className="py-2 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[16px]">explore</span>
                                Find Another Guide
                              </button>
                            ) : (booking.status !== 'COMPLETED') ? (
                              <button 
                                onClick={() => handleCancelBooking(booking.id)}
                                className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-label-bold text-xs font-semibold transition-all active:scale-95"
                              >
                                Cancel Request
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
                                  totalCost: booking.price
                                } 
                              })}
                              className="py-2 px-5 rounded-xl border border-cyan-600/40 hover:bg-cyan-50 text-cyan-800 font-label-bold text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                              Message Guide
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-400">calendar_today</span>
                  <p className="text-sm font-semibold text-slate-700">No bookings found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You don't have any scheduled bookings at the moment.
                  </p>
                  <button 
                    onClick={() => navigate('/search')}
                    className="mt-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Browse Local Guides
                  </button>
                </div>
              )}

            </section>

          </div>

          {/* History & Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Recent Activity History */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-label-bold text-xs text-slate-900 uppercase tracking-wider font-bold mb-4">Recent Activity History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-slate-400 font-label-caps text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-2">EXPERIENCE</th>
                      <th className="py-2.5 px-2">LOCATION</th>
                      <th className="py-2.5 px-2">DATE</th>
                      <th className="py-2.5 px-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 text-slate-900 font-medium">Hue Imperial Citadel Cultural Walk</td>
                      <td className="py-3 px-2 text-slate-500">Hue, Vietnam</td>
                      <td className="py-3 px-2 text-slate-500">Sep 12, 2026</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 text-slate-900 font-medium">Hoi An Lantern Workshop & Street Eats</td>
                      <td className="py-3 px-2 text-slate-500">Hoi An, Vietnam</td>
                      <td className="py-3 px-2 text-slate-500">Aug 28, 2026</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
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
                <h4 className="font-headline-md text-base font-bold text-slate-900 mb-1.5">Want to Earn as a Local Guide?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Share your local expertise, showcase hidden gems, and earn competitive hourly rates.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full mt-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-label-bold text-xs font-semibold shadow-sm transition-all text-center"
              >
                Apply as Local Helper
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
          <span className="text-[11px] font-semibold mt-0.5">Explore</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center bg-cyan-50 text-cyan-800 rounded-full px-4 py-1 scale-95"
        >
          <span className="material-symbols-outlined text-cyan-700 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          <span className="text-[11px] font-semibold mt-0.5">Bookings</span>
        </button>
        <button 
          onClick={() => navigate('/chat')}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span className="text-[11px] font-semibold mt-0.5">Chat</span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="text-[11px] font-semibold mt-0.5">Profile</span>
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
                  Review Local Helper
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Share your experience with <span className="font-semibold text-slate-800">{reviewBooking.guideName}</span> for <span className="font-semibold text-slate-800">"{reviewBooking.title}"</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
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
                    {['', '1 - Very Bad', '2 - Bad', '3 - Average', '4 - Good', '5 - Excellent'][hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Comment
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your experience... What did you like most about this tour?"
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
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !comment.trim()}
                  className="py-2.5 px-6 bg-[#005A71] hover:bg-[#004B5E] text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingReview ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>Submit Review</span>
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
