import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function HelperRequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { guideName } = location.state || { guideName: "Linh Nguyen" };

  // Current logged in user
  const storedUser = localStorage.getItem('localmate_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!currentUser) {
      alert("Please sign in to send a trip request!");
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [nationality, setNationality] = useState('Vietnam');
  const [contactNumber, setContactNumber] = useState(currentUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [destination, setDestination] = useState('Da Nang, Vietnam');
  const [areas, setAreas] = useState('Son Tra Peninsula, Marble Mountains');
  const [arrival, setArrival] = useState('2026-10-03');
  const [departure, setDeparture] = useState('2026-10-05');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingLocation, setMeetingLocation] = useState('Hotel Lobby');
  const [travelersCount, setTravelersCount] = useState('2 People');
  const [travelStyle, setTravelStyle] = useState('Active');
  
  const [requirements, setRequirements] = useState({
    translation: true,
    recommendations: true,
    food: true,
    transport: false,
    shopping: false,
    culture: true,
    nightlife: false,
    emergency: false,
  });
  const [otherReqs, setOtherReqs] = useState('');

  const handleRequirementChange = (key) => {
    setRequirements({ ...requirements, [key]: !requirements[key] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const guideEmail = location.state?.guideEmail || 'minh.danang@localmate.com';
    const travelerEmail = currentUser?.email || 'myduyen@localmate.com';
    const tourTitle = `Custom Experience: ${destination} (${areas})`;

    const bookingPayload = {
      travelerId: currentUser?.id || null,
      helperId: location.state?.guideId || null,
      tourName: tourTitle,
      bookingDate: arrival,
      durationHours: 6,
      meetLocation: meetingLocation,
      specialRequests: `Guests: ${travelersCount}. Style: ${travelStyle}. Needs: ${Object.keys(requirements).filter(k => requirements[k]).join(', ')}. Note: ${otherReqs}`,
      totalPrice: 1500000,
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    };

    try {
      await fetch(`http://localhost:8080/api/v1/bookings?travelerEmail=${encodeURIComponent(travelerEmail)}&helperEmail=${encodeURIComponent(guideEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
    } catch (err) {
      console.error('Error saving custom request:', err);
    }

    alert(`Your custom request has been sent to ${guideName}! They will review it and message you shortly.`);
    navigate('/traveler');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 w-full overflow-hidden">
      
      {/* Progress Indicator */}
      <div className="mb-12 overflow-x-auto pb-2">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative min-w-[500px]">
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="font-label-bold text-label-bold text-primary">Select Helper</span>
          </div>
          <div className="absolute top-5 left-0 w-full h-[2px] bg-outline-variant -z-10"></div>
          <div className="absolute top-5 left-0 w-[33%] h-[2px] bg-primary -z-10"></div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="font-label-bold text-label-bold text-primary">Booking</span>
          </div>
          <div className="absolute top-5 left-0 w-[66%] h-[2px] bg-primary -z-10"></div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-primary text-primary font-bold mb-2">3</div>
            <span className="font-label-bold text-label-bold text-primary font-bold">Request Details</span>
          </div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-outline-variant text-outline-variant font-bold mb-2">4</div>
            <span className="font-label-bold text-label-bold text-on-surface-variant">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Form Container */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Section 1: Basic Information */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">person</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="e.g. Sarah Jenkins" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Nationality</label>
                  <input 
                    type="text" 
                    required 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="e.g. United Kingdom" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Contact Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="+44 20 7946 0958" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">WhatsApp/Telegram (Optional)</label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="@sarah_j" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Trip Information */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">map</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Trip Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Destination City</label>
                  <input 
                    type="text" 
                    required 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="e.g. Da Nang, Vietnam" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Areas to Visit</label>
                  <input 
                    type="text" 
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="e.g. Son Tra Peninsula, Marble Mountains" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Arrival</label>
                    <input 
                      type="date" 
                      required 
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Departure</label>
                    <input 
                      type="date" 
                      required 
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Meeting Time</label>
                    <input 
                      type="time" 
                      required 
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Meeting Location</label>
                    <input 
                      type="text" 
                      required 
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="Hotel Lobby, Cafe, etc." 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Service Requirements */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">handyman</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Service Requirements</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                {[
                  { key: 'translation', label: 'Translation' },
                  { key: 'recommendations', label: 'Recommendations' },
                  { key: 'food', label: 'Food & Drink' },
                  { key: 'transport', label: 'Transport' },
                  { key: 'shopping', label: 'Shopping Guide' },
                  { key: 'culture', label: 'Culture Tour' },
                  { key: 'nightlife', label: 'Nightlife' },
                  { key: 'emergency', label: 'Emergency Aid' },
                ].map(req => (
                  <label key={req.key} className="flex items-center gap-3 cursor-pointer group select-none">
                    <input 
                      type="checkbox" 
                      checked={requirements[req.key]}
                      onChange={() => handleRequirementChange(req.key)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                    />
                    <span className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">{req.label}</span>
                  </label>
                ))}
                
                <div className="col-span-full mt-4">
                  <input 
                    type="text" 
                    value={otherReqs}
                    onChange={(e) => setOtherReqs(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Other specific requirements..." 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Trip Details */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">luggage</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Trip Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Number of Travelers</label>
                  <select 
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(e.target.value)}
                    className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
                  >
                    <option>1 Person</option>
                    <option>2 People</option>
                    <option>3-4 People</option>
                    <option>5+ People (Group)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Travel Style</label>
                  <div className="flex gap-2 p-1 bg-surface-container rounded-xl">
                    {['Relaxed', 'Active', 'Budget', 'Luxury'].map(style => (
                      <button 
                        key={style}
                        type="button"
                        onClick={() => setTravelStyle(style)}
                        className={`flex-1 py-2 text-body-sm font-label-bold rounded-lg transition-all ${
                          travelStyle === style 
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primary-container text-on-primary-container hover:bg-primary py-4 rounded-xl font-label-bold text-label-bold text-center block shadow-md transition-all active:scale-[0.98]"
            >
              Submit Request to {guideName}
            </button>
          </form>
        </div>

        {/* Right Side Info Widget */}
        <aside className="lg:col-span-4 bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-subtle shadow-sm min-w-0 break-words">
          <h3 className="font-headline-md text-headline-md font-bold mb-4 text-on-surface">Request Guide</h3>
          <p className="font-body-md text-on-surface-variant mb-6">
            You are submitting a customized request to **{guideName}**. They will review your trip details and build a tailored itinerary for you.
          </p>
          <div className="flex gap-4 items-center border-t border-border-subtle pt-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h4 className="font-label-bold text-label-bold text-on-surface">Need Help?</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Our support team is online 24/7 to assist with your tour planning.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
