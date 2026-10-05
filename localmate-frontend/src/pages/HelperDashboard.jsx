import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function HelperDashboard() {
  const navigate = useNavigate();

  // Current logged in Helper
  const [currentUser, setCurrentUser] = useState(null);
  const [helperStatus, setHelperStatus] = useState('AVAILABLE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Helper Hourly Rate state
  const [hourlyRate, setHourlyRate] = useState(15);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [inputRate, setInputRate] = useState(15);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccessMsg, setPriceSuccessMsg] = useState('');

  // Real requests and bookings state from MongoDB
  const [requests, setRequests] = useState([]);
  const [confirmedTours, setConfirmedTours] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Real review stats from MongoDB
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });

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
      alert("Please sign in with a Local Helper account!");
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
          const res = await fetch(`http://localhost:8080/api/v1/helpers/${u.id || u.email}`);
          if (res.ok) {
            const data = await res.json();
            if (data.availabilityStatus) {
              setHelperStatus(data.availabilityStatus);
            }
            if (data.hourlyRate !== undefined || data.price !== undefined) {
              const r = Number(data.hourlyRate || data.price) || 15;
              setHourlyRate(r);
              setInputRate(r);
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

  // Update helper hourly rate ($/hr)
  const handleSavePrice = async (newPrice) => {
    const rateToSave = Number(newPrice);
    if (!rateToSave || rateToSave <= 0 || rateToSave > 1000) {
      alert("Please enter a valid hourly rate between $1 and $1,000/hr.");
      return;
    }
    setSavingPrice(true);
    try {
      const targetId = currentUser?.id || currentUser?.email || 'minh.danang@localmate.com';
      const res = await fetch(`http://localhost:8080/api/v1/helpers/${targetId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: rateToSave })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedRate = Number(data.hourlyRate || data.price) || rateToSave;
        setHourlyRate(updatedRate);
        setInputRate(updatedRate);
        setIsEditingPrice(false);
        setPriceSuccessMsg(`Hourly rate updated to $${updatedRate}/hr successfully!`);
        setTimeout(() => setPriceSuccessMsg(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to update price.");
      }
    } catch (err) {
      console.error('Error updating price:', err);
      alert("Error connecting to server.");
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
      const res = await fetch(`http://localhost:8080/api/v1/helpers/${targetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setHelperStatus(newStatus);
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert("Error connecting to server.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper for computing countdown string
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return 'Expired';
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
        const res = await fetch(`http://localhost:8080/api/v1/bookings/helper-requests?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter for pending requests (unexpired)
          const pending = data.filter(d => d.status === 'PENDING');
          const confirmed = data.filter(d => d.status === 'CONFIRMED' || d.status === 'ACCEPTED');
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
        const res = await fetch(`http://localhost:8080/api/v1/reviews/helper/${encodeURIComponent(target)}`);
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

    fetchRequests();
    fetchReviews();
  }, [currentUser]);

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
      const res = await fetch(`http://localhost:8080/api/v1/bookings/${id}/accept`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Could not accept booking request. Please refresh and try again.");
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
      alert(`Booking accepted successfully! Tour "${tourName}" with ${travelerName} is now confirmed. A notification message has been sent to the traveler via chat.`);
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert("Network error connecting to booking server.");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleDecline = async (id, travelerName) => {
    if (window.confirm(`Are you sure you want to decline the request from ${travelerName}?`)) {
      try {
        await fetch(`http://localhost:8080/api/v1/bookings/${id}/decline`, { method: 'POST' });
      } catch (err) {
        console.error(err);
      }
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const displayName = currentUser?.fullName || 'Local Helper';

  // Real Total Earnings Calculation from confirmed bookings
  const realTotalEarnings = confirmedTours.reduce((sum, t) => {
    const val = Number(t.price || t.totalPrice) || 0;
    return sum + (val > 1000 ? Math.round(val / 25000) : val);
  }, 0);

  // Real Weekly Earnings by Day of Week
  const weeklyDayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeklyEarnings = [0, 0, 0, 0, 0, 0, 0];

  confirmedTours.forEach(tour => {
    if (tour.date) {
      const dt = new Date(tour.date);
      if (!isNaN(dt.getTime())) {
        const dayIdx = (dt.getDay() + 6) % 7; // Monday = 0
        const val = Number(tour.price || tour.totalPrice) || 0;
        const usd = val > 1000 ? Math.round(val / 25000) : val;
        weeklyEarnings[dayIdx] += usd;
      }
    }
  });

  const maxWeeklyEarnings = Math.max(...weeklyEarnings, 50);
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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
              
              {/* Helper Status Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleChangeStatus('AVAILABLE')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    helperStatus === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'AVAILABLE' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></span>
                  AVAILABLE
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus('BUSY')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    helperStatus === 'BUSY'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'BUSY' ? 'bg-white' : 'bg-amber-500'}`}></span>
                  BUSY
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus('OFFLINE')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    helperStatus === 'OFFLINE'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'OFFLINE' ? 'bg-slate-300' : 'bg-slate-400'}`}></span>
                  OFFLINE
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Status: <strong className="text-teal-700">{helperStatus}</strong> • {
                helperStatus === 'AVAILABLE' ? 'Ready to accept booking requests from travelers' :
                helperStatus === 'BUSY' ? 'Currently on schedule conducting tours' :
                'Offline (temporarily not taking new bookings)'
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Real Review Rating Card */}
            <div 
              onClick={() => navigate('/reviews')}
              className="flex flex-col items-center bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[110px] cursor-pointer hover:border-cyan-400 transition-colors"
              title="View all your reviews"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">RATING</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {reviewStats.reviewCount > 0 ? Number(reviewStats.averageRating).toFixed(1) : (currentUser?.rating ? Number(currentUser.rating).toFixed(1) : '5.0')}
                </span>
                <span className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {reviewStats.reviewCount} reviews
              </span>
            </div>

            {/* Real Total Earnings Card */}
            <div className="flex flex-col items-center bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">TOTAL EARNINGS</span>
              <span className="text-2xl font-extrabold text-teal-700">
                ${realTotalEarnings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {confirmedTours.length} confirmed tours
              </span>
            </div>

            {/* My Hourly Rate Card */}
            <div className="relative flex flex-col items-center justify-between bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[135px] group hover:border-teal-500 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">HOURLY RATE</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-2xl font-extrabold text-slate-900">${hourlyRate}</span>
                <span className="text-xs font-semibold text-slate-400">/ hr</span>
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
                <span>Change Rate</span>
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
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Availability Calendar (8 cols) - 100% Real Dynamic Month & Bookings */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-lg">calendar_month</span>
                {currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1.5">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  title="Next month"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto no-scrollbar">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-7 mb-3">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
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
                                {t.travelerName}: {t.time || 'Booked'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="bg-slate-50/80 rounded-xl p-2 min-h-[75px] border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-700">{item.dayNum}</span>
                        <span className="text-[10px] text-slate-300 font-medium">Available</span>
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
                  Weekly Earnings
                </h2>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  ${thisWeekTotal} this week
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
                              ${amt}
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
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Tour Requests</h3>
                <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                  {requests.length} Pending
                </span>
              </div>
              
              {requests.length > 0 ? (
                requests.map(req => {
                  const remaining = getTimeRemaining(req.expiresAt);
                  const isExpired = remaining === 'Expired';

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
                                {isExpired ? 'Expired' : `Expires in ${remaining}`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{req.phone || req.email || 'Verified Traveler'}</p>
                        </div>
                        <span className="text-teal-700 font-extrabold text-base">
                          {req.price > 1000 ? `${Number(req.price).toLocaleString()} VND` : `$${req.price}`}
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
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => handleAccept(req.id, req.travelerName, req.tourName)}
                          disabled={isExpired || processingBookingId === req.id}
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            isExpired || processingBookingId === req.id
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-2xs active:scale-95'
                          }`}
                        >
                          {processingBookingId === req.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Accept Request</span>
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDecline(req.id, req.travelerName)}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl font-bold text-xs transition-all"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => navigate('/chat', {
                            state: {
                              travelerEmail: req.email,
                              travelerName: req.travelerName,
                              travelerAvatar: req.travelerAvatar,
                              tourName: req.tourName,
                              date: req.date,
                              totalCost: req.price
                            }
                          })}
                          className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
                          title="Chat with Traveler"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-400 text-xs shadow-2xs">
                  No pending tour requests!
                </div>
              )}
            </div>

            {/* Confirmed Upcoming Tours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Tours</h3>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                  {confirmedTours.length} Active
                </span>
              </div>

              {confirmedTours.length > 0 ? (
                confirmedTours.map(tour => (
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
                          <p className="text-xs text-slate-400">{tour.email || 'Verified Traveler'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        CONFIRMED
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
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-teal-700 font-extrabold text-base">
                        {tour.price > 1000 ? `${Number(tour.price).toLocaleString()} VND` : `$${tour.price}`}
                      </span>
                      <button
                        onClick={() => navigate('/chat', {
                          state: {
                            travelerEmail: tour.email,
                            travelerName: tour.travelerName,
                            travelerAvatar: tour.travelerAvatar,
                            tourName: tour.tourName,
                            date: tour.date,
                            totalCost: tour.price
                          }
                        })}
                        className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        Chat with Traveler
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs shadow-2xs">
                  No confirmed tours yet
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
                    <h3 className="font-bold text-base text-slate-900">Update Hourly Rate</h3>
                    <p className="text-xs text-slate-500">Set your booking price per hour</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Travelers booking your custom tours will be charged based on this hourly rate. Changes take effect immediately across Search Results and Explore pages.
                </p>

                {/* Input with Currency Prefix & Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Hourly Price (USD)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-xl text-teal-700">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={inputRate}
                      onChange={(e) => setInputRate(e.target.value)}
                      className="w-full pl-9 pr-16 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-xl font-bold text-slate-900 outline-none transition-all"
                      placeholder="15"
                      autoFocus
                    />
                    <span className="absolute right-4 font-bold text-sm text-slate-400">/ hour</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="block text-[11px] font-bold uppercase text-slate-400 mb-2">QUICK PRESETS</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[10, 12, 15, 20, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInputRate(preset)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          Number(inputRate) === preset
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Estimate Example */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Estimated 3-hour tour (1 person):</span>
                    <span className="font-bold text-teal-700">${(Number(inputRate) || 0) * 3}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Estimated 4-hour tour (2 people):</span>
                    <span className="font-bold text-teal-700">${(Number(inputRate) || 0) * 4 * 2}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  disabled={savingPrice}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrice(inputRate)}
                  disabled={savingPrice || !inputRate}
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {savingPrice ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Save New Rate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
    </div>
  );
}
