import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // Live timer tick for request expiration countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [calendarNotes, setCalendarNotes] = useState([
    { day: 30, text: "City Tour (9AM)", type: "primary" },
    { day: 30, text: "Food Walk (2PM)", type: "secondary" },
    { day: 2, text: "Maintenance", type: "warning" }
  ]);

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

          // Dynamically map confirmed bookings to calendar notes
          const dynamicNotes = confirmed.map(b => {
            let day = 15;
            if (b.date && b.date.includes('-')) {
              const parts = b.date.split('-');
              day = parseInt(parts[2], 10) || 15;
            }
            return {
              day: day,
              text: `${b.travelerName || 'Tour'} (${b.time || 'Tour'})`,
              type: 'primary'
            };
          });

          setCalendarNotes([
            { day: 30, text: "City Tour (9AM)", type: "primary" },
            { day: 30, text: "Food Walk (2PM)", type: "secondary" },
            { day: 2, text: "Maintenance", type: "warning" },
            ...dynamicNotes
          ]);
        }
      } catch (err) {
        console.error('Error fetching helper requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [currentUser]);

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

        // Calculate day for calendar
        let day = 15;
        if (acceptedItem.date && acceptedItem.date.includes('-')) {
          const parts = acceptedItem.date.split('-');
          day = parseInt(parts[2], 10) || 15;
        }
        setCalendarNotes(prev => [
          ...prev,
          { day: day, text: `${travelerName} (${acceptedItem.time || 'Tour'})`, type: "primary" }
        ]);
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

  return (
    <div className="flex min-h-screen bg-background-light text-on-surface">
      
      {/* SideNavBar - Shared Component - Desktop Only */}
      <aside className="hidden lg:flex flex-col h-full sticky top-0 py-6 overflow-y-auto bg-surface-container-low border-r border-border-subtle w-64 shrink-0 justify-between">
        <div className="px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shrink-0">
              {currentUser?.avatarUrl ? (
                <img alt={displayName} className="w-full h-full object-cover" src={currentUser.avatarUrl} />
              ) : (
                <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-label-bold text-label-bold text-primary font-bold truncate">{displayName}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Local Helper Profile</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full py-2 px-4 rounded-xl bg-primary text-on-primary font-label-bold text-sm hover:opacity-90 transition-all"
          >
            Edit Profile
          </button>
          
          <nav className="mt-8 space-y-2">
            <button className="w-full bg-secondary-container text-on-secondary-container rounded-xl px-4 py-3 flex items-center gap-3 text-left">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <span className="font-label-bold text-label-bold">Dashboard</span>
            </button>
            <button onClick={() => navigate('/reviews')} className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left">
              <span className="material-symbols-outlined">stars</span>
              <span className="font-label-bold text-label-bold">Reviews</span>
            </button>
            <button onClick={() => navigate('/chat')} className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="font-label-bold text-label-bold">Messages</span>
            </button>
          </nav>
        </div>
        
        <div className="px-6 border-t border-border-subtle pt-4">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full text-on-surface-variant hover:bg-surface-variant/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-bold text-label-bold">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Dashboard Overview</h1>
              
              {/* Helper Status Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleChangeStatus('AVAILABLE')}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    helperStatus === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-sm'
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
                      ? 'bg-amber-500 text-white shadow-sm'
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
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${helperStatus === 'OFFLINE' ? 'bg-slate-300' : 'bg-slate-400'}`}></span>
                  OFFLINE
                </button>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Status: <span className="font-bold text-primary">{helperStatus}</span> • {
                helperStatus === 'AVAILABLE' ? 'Ready to accept bookings' :
                helperStatus === 'BUSY' ? 'Busy with scheduled tours (allows bookings outside busy hours)' :
                'Offline (will not receive new booking requests)'
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-subtle shadow-sm min-w-[110px]">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">RATING</span>
              <div className="flex items-center gap-1">
                <span className="font-headline-md text-headline-md text-primary font-bold">4.9</span>
                <span className="material-symbols-outlined text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-subtle shadow-sm min-w-[120px]">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL EARNED</span>
              <span className="font-headline-md text-headline-md text-primary font-bold">
                ${1240 + confirmedTours.reduce((sum, t) => {
                  const val = Number(t.price) || 0;
                  return sum + (val > 1000 ? Math.round(val / 25000) : val);
                }, 0)}
              </span>
            </div>

            {/* My Hourly Rate Card */}
            <div className="relative flex flex-col items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-subtle shadow-sm min-w-[135px] group hover:border-primary/50 transition-all">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">HOURLY RATE</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-headline-md text-headline-md text-primary font-bold">${hourlyRate}</span>
                <span className="text-xs font-semibold text-on-surface-variant">/ hr</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputRate(hourlyRate);
                  setIsEditingPrice(true);
                }}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark hover:underline transition-colors cursor-pointer bg-primary/10 px-2 py-0.5 rounded-md"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
                <span>Change Rate</span>
              </button>
            </div>
          </div>
        </section>

        {/* Price Update Success Banner */}
        {priceSuccessMsg && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm animate-fadeIn">
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
          
          {/* Availability Calendar (8 cols) */}
          <div className="md:col-span-8 bg-white dark:bg-surface-dark rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Availability & Schedule</h2>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-surface-variant rounded-full transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="p-2 hover:bg-surface-variant rounded-full transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto no-scrollbar">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-7 mb-4">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                    <div key={d} className="text-center font-label-bold text-label-bold text-on-surface-variant">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 grid-rows-5 gap-2 h-96">
                  {/* Calendar Days */}
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between opacity-50">
                    <span className="font-body-sm text-body-sm">28</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between">
                    <span className="font-body-sm text-body-sm">29</span>
                  </div>
                  
                  {/* Main scheduled day */}
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between border-2 border-primary">
                    <span className="font-body-sm text-body-sm font-bold text-primary">30</span>
                    <div className="space-y-1">
                      {calendarNotes.filter(n => n.day === 30).map((note, i) => (
                        <div key={i} className={`text-[10px] p-1 rounded font-bold truncate ${
                          note.type === 'primary' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {note.text}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between">
                    <span className="font-body-sm text-body-sm">1</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between">
                    <span className="font-body-sm text-body-sm">2</span>
                    {calendarNotes.filter(n => n.day === 2).map((note, i) => (
                      <div key={i} className="bg-status-warning/20 text-tertiary text-[10px] p-1 rounded font-bold truncate">
                        {note.text}
                      </div>
                    ))}
                  </div>
                  
                  {/* Rest of the cells */}
                  {[...Array(26)].map((_, idx) => {
                    const dayNum = idx + 3;
                    const matches = calendarNotes.filter(n => n.day === dayNum);
                    return (
                      <div key={idx} className="bg-surface-container-low rounded-lg p-2 flex flex-col justify-between">
                        <span className="font-body-sm text-body-sm">{dayNum}</span>
                        {matches.length > 0 && (
                          <div className="space-y-1">
                            {matches.map((m, k) => (
                              <div key={k} className="bg-primary-container text-on-primary-container text-[10px] p-1 rounded font-bold truncate">
                                {m.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings & Requests (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Weekly Earnings Chart */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-subtle shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-border-subtle">
                <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Weekly Earnings</h2>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-2 h-40 mb-6 mt-4">
                  {/* Simple Visual Bar Chart */}
                  {[
                    { label: 'M', h: '40%' },
                    { label: 'T', h: '60%' },
                    { label: 'W', h: '85%' },
                    { label: 'T', h: '30%' },
                    { label: 'F', h: '95%' },
                    { label: 'S', h: '20%' },
                    { label: 'S', h: '10%' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-secondary-container rounded-t-md hover:bg-secondary transition-all" style={{ height: bar.h }}></div>
                      <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">Pending Tour Requests</h3>
                <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">
                  {requests.length} Pending
                </span>
              </div>
              
              {requests.length > 0 ? (
                requests.map(req => {
                  const remaining = getTimeRemaining(req.expiresAt);
                  const isExpired = remaining === 'Expired';

                  return (
                    <div key={req.id} className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-subtle shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-label-bold text-label-bold text-on-surface">{req.travelerName}</h4>
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
                          <p className="text-body-sm text-on-surface-variant">{req.phone || req.email || 'Verified Traveler'}</p>
                        </div>
                        <span className="text-primary font-bold font-headline-md">
                          {req.price > 1000 ? `${Number(req.price).toLocaleString()} VND` : `$${req.price}`}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-body-sm text-on-surface-variant bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="font-label-bold text-on-surface">{req.tourName}</p>
                        <p className="flex items-center gap-1 text-slate-600">
                          <span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
                          <span>{req.date} • {req.time}</span>
                        </p>
                        {req.location && (
                          <p className="flex items-center gap-1 text-slate-600">
                            <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                            <span>{req.location}</span>
                          </p>
                        )}
                        {req.requests && (
                          <p className="text-xs italic text-slate-500">"{req.requests}"</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-border-subtle">
                        <button 
                          onClick={() => handleAccept(req.id, req.travelerName, req.tourName)}
                          disabled={isExpired || processingBookingId === req.id}
                          className={`flex-1 py-2 rounded-xl font-label-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                            isExpired || processingBookingId === req.id
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-primary text-on-primary hover:shadow-md active:scale-95'
                          }`}
                        >
                          {processingBookingId === req.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[17px]">check_circle</span>
                              <span>Accept Request</span>
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDecline(req.id, req.travelerName)}
                          className="flex-1 bg-surface-container-high/40 text-on-surface-variant py-2 rounded-xl font-label-bold text-sm hover:bg-surface-container-high/60 transition-all"
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
                          className="p-2 border border-border-subtle rounded-xl text-on-surface-variant hover:bg-surface-container transition-all"
                          title="Chat with Traveler"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 bg-white dark:bg-surface-dark border border-border-subtle rounded-xl text-center text-on-surface-variant text-body-sm">
                  No pending tour requests!
                </div>
              )}
            </div>

            {/* Confirmed Upcoming Tours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">Confirmed Tours</h3>
                <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  {confirmedTours.length} Active
                </span>
              </div>

              {confirmedTours.length > 0 ? (
                confirmedTours.map(tour => (
                  <div key={tour.id} className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-border-subtle shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img 
                          src={tour.travelerAvatar} 
                          alt={tour.travelerName} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{tour.travelerName}</h4>
                          <p className="text-xs text-slate-500">{tour.email || 'Verified Traveler'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        CONFIRMED
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1">
                      <p className="font-bold text-slate-700">{tour.tourName}</p>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        <span>{tour.date} • {tour.time}</span>
                      </div>
                      {tour.location && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          <span>{tour.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-primary font-bold text-base">
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
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        Chat with Traveler
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-white dark:bg-surface-dark border border-dashed border-border-subtle rounded-xl text-center text-on-surface-variant text-xs">
                  No confirmed tours yet
                </div>
              )}
            </div>

          </div>
          
        </div>

        {/* Edit Hourly Rate Modal */}
        {isEditingPrice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full shadow-2xl border border-border-subtle p-6 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Update Hourly Rate</h3>
                    <p className="text-xs text-on-surface-variant">Set your booking price per hour</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Travelers booking your custom tours will be charged based on this hourly rate. Changes take effect immediately across Search Results and Explore pages.
                </p>

                {/* Input with Currency Prefix & Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Hourly Price (USD)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-xl text-primary">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={inputRate}
                      onChange={(e) => setInputRate(e.target.value)}
                      className="w-full pl-9 pr-16 py-3 bg-surface-container-low rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 text-xl font-bold text-on-surface outline-none transition-all"
                      placeholder="15"
                      autoFocus
                    />
                    <span className="absolute right-4 font-bold text-sm text-on-surface-variant">/ hour</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="block text-[11px] font-semibold text-on-surface-variant mb-2">QUICK PRESETS</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[10, 12, 15, 20, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInputRate(preset)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          Number(inputRate) === preset
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-variant border-border-subtle'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Estimate Example */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Estimated 3-hour tour (1 person):</span>
                    <span className="font-bold text-primary">${(Number(inputRate) || 0) * 3}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Estimated 4-hour tour (2 people):</span>
                    <span className="font-bold text-primary">${(Number(inputRate) || 0) * 4 * 2}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  disabled={savingPrice}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle font-bold text-xs text-on-surface hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrice(inputRate)}
                  disabled={savingPrice || !inputRate}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
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
