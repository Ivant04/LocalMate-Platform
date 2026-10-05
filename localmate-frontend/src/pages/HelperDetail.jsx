import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MOCK_GUIDES_DETAILS = {
  linh: {
    name: "Linh Nguyen",
    city: "Hue, Da Nang",
    country: "Vietnam",
    title: "Local Culinary & Architectural Specialist",
    rating: 4.9,
    reviewsCount: 128,
    hostedHours: "500+",
    languages: "English, Japanese",
    price: 12,
    expertises: ["HIKING", "FOODIE", "HISTORY"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlHOAy4qPmwMMy6WbW741tOMbZbMwSoENJhOs5pp-zFO8_Lbb2yc9Hzpasvivg7OcsJjbqJbDVuClk6PYdJLPp5KwXuc3meIxiX6iTtp5IlvL2uxKO3yefk4xLBpyH9doDtXImY0IemaO4OLVSWv7oxlmNDd-ao_2wntUo0RQOn3GWCr4r4Rlya6PdnmPbjDjlkEOt2IJ1-m5OFjHp16WAsUry3BOzv2jg5sqLssMyoLe9xXB2ujP3Q1WMZkxNDOhIBXcRQilwt70hRw",
    bio: "Born and raised in Hue, I am fluent in both English and Japanese. I specialize in helping travelers discover authentic local culture, hidden gems, traditional cuisine, and unique experiences that most tourists never get to see.",
    experiences: [
      {
        title: "Architectural Tour Specialist",
        desc: "Lead specialized Imperial Citadel and royal tombs walking tours for over 5 years, focusing on structural innovation and historical context."
      },
      {
        title: "Local Culinary Guide",
        desc: "Curated 'Taste of Hue' street food tours, partnering with family-owned noodle shops and traditional sweet soup vendors."
      }
    ],
    reviews: [
      {
        author: "James Wilson",
        rating: 5,
        date: "2 weeks ago",
        text: "Linh was incredible! She took us to a tiny food stall inside the Dong Ba market that served the best Bun Bo Hue we ever had. Her knowledge of Hue's history was mind-blowing.",
        reply: "Thanks James! It was a pleasure showing you around the market. Hope you come back to Vietnam soon!"
      },
      {
        author: "Yuki Tanaka",
        rating: 5,
        date: "1 month ago",
        text: "リンさんは日本語がとても上手で、説明も丁寧でした。歴史的な背景まで詳しく教えていただき、素晴らしい時間を過ごせました。おすすめです！",
        reply: "田中様、嬉しいお言葉ありがとうございます！またベトナムにいらした際はぜひ声をかけてください。"
      }
    ]
  },
  khang: {
    name: "Tuan Tran",
    city: "Da Nang",
    country: "Vietnam",
    title: "Nature Hike & Linguistic Translator Specialist",
    rating: 4.7,
    reviewsCount: 82,
    hostedHours: "350+",
    languages: "English, French",
    price: 10,
    expertises: ["HIKING", "TRANSLATION", "ADVENTURE"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuACEkTfhQ0z-qk-5cA4Se3xjwcqfvUcvE5_D9IVVi9AA5xErnPwONyVSZjPH22AN_FUarmTEAv5puUyvk1TWorMjbzF7mN3_-7X0ELZB4V95NElMaPP6h0WiJeXDeXv7Zzcy6RJzEwNEl_BbCsWG6Wluvp8SN-s7iv29LDWv3dfDXO5ohXEl3nrBo44sB8DeOBU94Eca8kEuysATBnc3bgKA8Vl6E2aLcyDXNMd-saAnqWQ1st8yootEedGdPfb_N2BfJ07UKgZB2ZMRQ",
    bio: "Hi, I am Khang! I have been hosting visitors in Da Nang for over 5 years. I love showing visitors around the Marble Mountains, Son Tra Peninsula, and local culinary hotspots. Fluent in French and English.",
    experiences: [
      {
        title: "Son Tra Peninsula Trekking Guide",
        desc: "Organized nature hikes to spot rare Red-shanked Douc Langurs and visit hidden coastlines."
      },
      {
        title: "Linguistic Interpreter",
        desc: "Assisted foreign investors and expats with housing searches and local market negotiations."
      }
    ],
    reviews: [
      {
        author: "Jean-Pierre",
        rating: 5,
        date: "3 weeks ago",
        text: "Khang parle un excellent français. Sa visite des montagnes de marbre était passionnante et pleine d'anecdotes historiques. Je recommande vivement !",
        reply: "Merci Jean-Pierre ! C'était un plaisir de faire cette visite avec vous."
      }
    ]
  }
};

export default function HelperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guide, setGuide] = useState(MOCK_GUIDES_DETAILS[id] || MOCK_GUIDES_DETAILS.linh);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/v1/helpers/${id}`);
        if (res.ok) {
          const data = await res.json();
          const fallback = MOCK_GUIDES_DETAILS[id] || MOCK_GUIDES_DETAILS.linh;
          setGuide({
            ...fallback,
            ...data,
            languages: Array.isArray(data.languages) ? data.languages.join(', ') : data.languages || fallback.languages,
            experiences: data.experiences || fallback.experiences,
            reviews: data.reviews || fallback.reviews,
            hostedHours: data.hostedHours || `${(data.reviewsCount || 40) * 4}+`,
          });
        }
      } catch (err) {
        console.error('Error fetching helper detail:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchGuide();
    }
  }, [id]);

  const [activeTab, setActiveTab] = useState('info');
  
  // Booking Form State
  const [date, setDate] = useState('2026-10-03');
  const [startTime, setStartTime] = useState('14:00');
  const [hours, setHours] = useState(4);
  const [people, setPeople] = useState(2);
  const [busySlots, setBusySlots] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Calendar month state & all bookings
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 9, 1));
  const [allBusySlots, setAllBusySlots] = useState([]);

  // Fetch all helper busy bookings for calendar overview
  useEffect(() => {
    const fetchAllBookings = async () => {
      if (!guide?.id && !id) return;
      const targetId = guide?.userId || guide?.id || id;
      try {
        const res = await fetch(`http://localhost:8080/api/v1/helpers/${targetId}/schedule`);
        if (res.ok) {
          const data = await res.json();
          setAllBusySlots(data.busySlots || []);
        }
      } catch (err) {
        console.error('Error fetching all helper schedule:', err);
      }
    };
    fetchAllBookings();
  }, [guide?.id, guide?.userId, id]);

  // Fetch Helper Schedule for selected date
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!guide?.id && !id) return;
      const targetId = guide?.userId || guide?.id || id;
      setLoadingSchedule(true);
      try {
        const res = await fetch(`http://localhost:8080/api/v1/helpers/${targetId}/schedule?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setBusySlots(data.busySlots || []);
          if (data.availabilityStatus) {
            setGuide(prev => ({ ...prev, availabilityStatus: data.availabilityStatus }));
          }
        }
      } catch (err) {
        console.error('Error fetching helper schedule:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [guide?.id, guide?.userId, id, date]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateInputChange = (e) => {
    const val = e.target.value;
    setDate(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentMonth(new Date(y, m, 1));
        }
      }
    }
  };

  const handleSelectDate = (item) => {
    if (isHelperOffline) return;
    if (!item.isWorkDay) return;
    setDate(item.dateStr);
    if (!item.isCurrentMonth) {
      const parts = item.dateStr.split('-');
      setCurrentMonth(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
    }
  };

  const normalizeDay = (d) => {
    if (!d) return '';
    const s = d.toLowerCase().trim();
    if (s === 'monday' || s.startsWith('mon') || s.includes('hai') || s.includes('t2') || s === 'thứ 2' || s === 'thu 2' || s === '2') return 'Monday';
    if (s === 'tuesday' || s.startsWith('tue') || s.includes('ba') || s.includes('t3') || s === 'thứ 3' || s === 'thu 3' || s === '3') return 'Tuesday';
    if (s === 'wednesday' || s.startsWith('wed') || s.includes('tư') || s.includes('t4') || s === 'thứ 4' || s === 'thu 4' || s.includes('thu tu') || s === '4') return 'Wednesday';
    if (s === 'thursday' || s.startsWith('thu') || s.includes('năm') || s.includes('nam') || s.includes('t5') || s === 'thứ 5' || s === 'thu 5' || s === '5') return 'Thursday';
    if (s === 'friday' || s.startsWith('fri') || s.includes('sáu') || s.includes('sau') || s.includes('t6') || s === 'thứ 6' || s === 'thu 6' || s === '6') return 'Friday';
    if (s === 'saturday' || s.startsWith('sat') || s.includes('bảy') || s.includes('bay') || s.includes('t7') || s === 'thứ 7' || s === 'thu 7' || s === '7') return 'Saturday';
    if (s === 'sunday' || s.startsWith('sun') || s.includes('nhật') || s.includes('nhat') || s.includes('cn')) return 'Sunday';
    return d;
  };

  const normalizedWorkingDays = (guide?.availabilityDays || []).map(normalizeDay);

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month trailing days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dayNum: dNum,
        dateStr,
        isCurrentMonth: false,
        isWorkDay: false,
        hasBusy: false,
        isSelected: date === dateStr
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayDate.getDay()];
      
      const isWorkDay = !normalizedWorkingDays.length || 
        normalizedWorkingDays.some(ad => ad.toLowerCase() === dayName.toLowerCase());
      
      const hasBusy = allBusySlots.some(s => s.bookingDate === dateStr);
      const isSelected = date === dateStr;

      days.push({
        dayNum: d,
        dateStr,
        dayName,
        isCurrentMonth: true,
        isWorkDay,
        hasBusy,
        isSelected
      });
    }

    // Next month trailing days to complete rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dayNum: n,
        dateStr,
        isCurrentMonth: false,
        isWorkDay: false,
        hasBusy: false,
        isSelected: date === dateStr
      });
    }

    return days;
  };

  const formattedSelectedDate = (() => {
    try {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return date;
    }
  })();

  // Conflict calculation
  const parseMin = (t) => {
    if (!t || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const startMinutes = parseMin(startTime);
  const endMinutes = startMinutes + hours * 60;
  const formattedEndTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  const conflictingSlot = busySlots.find(slot => {
    const sMin = parseMin(slot.startTime || '09:00');
    const eMin = parseMin(slot.endTime || '13:00');
    return startMinutes < eMin && endMinutes > sMin;
  });

  const isHelperOffline = (guide?.availabilityStatus || 'AVAILABLE') === 'OFFLINE';
  
  const hourlyRate = guide?.price || 10;
  const baseCost = hourlyRate * hours * people;
  const serviceFee = Math.round(baseCost * 0.1);
  const totalCost = baseCost + serviceFee;

  const resolveGuideEmail = () => {
    if (guide.email) return guide.email;
    const n = (guide.fullName || guide.name || '').toLowerCase();
    if (n.includes('kevin')) return 'kevin.nguyen@localmate.com';
    if (n.includes('huong')) return 'huong.dang@localmate.com';
    if (n.includes('tuan') || n.includes('khang')) return 'tuan.tran@localmate.com';
    if (n.includes('elena')) return 'elena.nguyen@localmate.com';
    if (n.includes('linh')) return 'linh.hanoi@localmate.com';
    if (n.includes('minh')) return 'minh.danang@localmate.com';
    return 'kevin.nguyen@localmate.com';
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const storedUser = localStorage.getItem('localmate_user');
    if (!storedUser) {
      alert("Please sign in to book a Local Helper!");
      navigate('/login');
      return;
    }

    if (isHelperOffline) {
      alert("Helper is currently OFFLINE and cannot accept bookings at this time.");
      return;
    }
    if (conflictingSlot) {
      alert(`Helper is busy from ${conflictingSlot.startTime} to ${conflictingSlot.endTime}. Please pick another time.`);
      return;
    }

    const gEmail = resolveGuideEmail();
    const gName = guide.fullName || guide.name || 'Local Guide';
    const gAvatar = guide.avatar || guide.avatarUrl || guide.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';
    navigate('/payment', {
      state: {
        guideId: guide.userId || guide.id || id,
        guideEmail: gEmail,
        guideName: gName,
        guideAvatar: gAvatar,
        tourName: guide.title || `${gName}'s Guided Experience`,
        city: guide.city || 'Da Nang, Vietnam',
        date,
        startTime,
        endTime: formattedEndTime,
        hours,
        people,
        totalCost,
        pricePerHour: hourlyRate
      }
    });
  };

  const handleRequestFormSubmit = () => {
    const storedUser = localStorage.getItem('localmate_user');
    if (!storedUser) {
      alert("Please sign in to send a trip request!");
      navigate('/login');
      return;
    }

    const gEmail = resolveGuideEmail();
    const gName = guide.fullName || guide.name || 'Local Guide';
    const gAvatar = guide.avatar || guide.avatarUrl || guide.img;
    navigate(`/request/${id || 'linh'}`, {
      state: {
        guideId: guide.userId || guide.id || id,
        guideEmail: gEmail,
        guideName: gName,
        guideAvatar: gAvatar,
        tourName: guide.title || 'Custom Local Tour',
        city: guide.city || 'Da Nang, Vietnam',
        pricePerHour: hourlyRate
      }
    });
  };

  const handleMessageHelper = () => {
    const storedUser = localStorage.getItem('localmate_user');
    if (!storedUser) {
      alert("Please sign in to message this Local Helper!");
      navigate('/login');
      return;
    }
    const gEmail = resolveGuideEmail();
    navigate(`/chat?target=${encodeURIComponent(gEmail)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
      
      {/* Hero Profile Section */}
      <section className="mb-8">
        <div className="relative h-64 md:h-96 w-full rounded-3xl overflow-hidden shadow-xl mb-6">
          <img 
            className="w-full h-full object-cover" 
            alt={guide.name}
            src={guide.img} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 md:left-10 text-white">
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full w-fit">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label-bold text-label-bold uppercase">Verified Expert</span>
              </div>
              <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full w-fit">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <span className="font-label-bold text-label-bold uppercase">Top Rated Helper</span>
              </div>
              {/* Availability Status Badge */}
              {(!guide.availabilityStatus || guide.availabilityStatus === 'AVAILABLE') && (
                <div className="flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">AVAILABLE</span>
                </div>
              )}
              {guide.availabilityStatus === 'BUSY' && (
                <div className="flex items-center gap-2 bg-amber-500/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">BUSY (Check Schedule)</span>
                </div>
              )}
              {guide.availabilityStatus === 'OFFLINE' && (
                <div className="flex items-center gap-2 bg-slate-600/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">OFFLINE</span>
                </div>
              )}
            </div>
            <h1 className="font-headline-xl text-headline-xl font-bold">{guide.name}</h1>
            <p className="font-body-lg text-body-lg text-white/90">{guide.title} • {guide.city}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border-subtle pb-6">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="font-headline-md text-headline-md text-primary font-bold">{guide.rating}</p>
              <div className="flex text-status-warning justify-center">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="font-label-bold text-label-bold text-on-surface-variant mt-1">{guide.reviewsCount} Reviews</p>
            </div>
            
            <div className="h-12 w-[1px] bg-border-subtle self-center"></div>
            <div className="text-center flex flex-col justify-center">
              <p className="font-headline-md text-headline-md text-primary font-bold">{guide.hostedHours}</p>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Hours Hosted</p>
            </div>
            
            <div className="h-12 w-[1px] bg-border-subtle self-center"></div>
            <div className="text-center flex flex-col justify-center">
              <p className="font-headline-md text-headline-md text-primary font-bold">Languages</p>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">{guide.languages}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(guide.expertises || []).map(tag => (
              <div key={tag} className="bg-secondary/10 px-4 py-2 rounded-xl">
                <span className="font-label-bold text-label-bold text-secondary">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main layout: Grid col-12 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Tabs Navigation */}
          <div className="sticky top-20 bg-surface/90 backdrop-blur-md z-40 border-b border-border-subtle mb-8 flex gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'info', label: 'Info' },
              { id: 'experience', label: 'Experience' },
              { id: 'availability', label: 'Availability' },
              { id: 'reviews', label: 'Reviews' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`font-label-bold text-label-bold py-4 transition-colors relative ${
                  activeTab === tab.id ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && <span className="active-tab-indicator absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></span>}
              </button>
            ))}
          </div>
          
          {/* Info Section */}
          <section id="info" className="scroll-mt-36">
            <h2 className="font-headline-md text-headline-md font-bold mb-4">About {guide.name ? guide.name.split(' ')[0] : 'Guide'}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {guide.bio}
            </p>
          </section>
          
          {/* Experience Section */}
          <section id="experience" className="bg-surface-container-low p-8 rounded-3xl border border-border-subtle scroll-mt-36">
            <h2 className="font-headline-md text-headline-md font-bold mb-6">Experience</h2>
            <div className="space-y-6">
              {(guide.experiences || []).map((exp, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary max-h-[40px]">
                    <span className="material-symbols-outlined">
                      {idx === 0 ? 'architecture' : 'restaurant'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-label-bold text-label-bold text-on-surface">{exp.title}</h3>
                    <p className="text-on-surface-variant text-body-md mt-1">{exp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Availability Section */}
          <section id="availability" className="scroll-mt-36">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold">Availability & Schedule</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Select an available date below to sync with your booking request.
                </p>
              </div>
              <div className="shrink-0">
                {isHelperOffline ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> OFFLINE
                  </span>
                ) : guide?.availabilityStatus === 'BUSY' ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> BUSY (Check slots)
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AVAILABLE
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm space-y-6">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-headline-sm text-lg font-bold text-on-surface">
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  {normalizedWorkingDays.length > 0 && (
                    <span className="text-xs text-on-surface-variant ml-2 font-medium">
                      • Working: {normalizedWorkingDays.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handlePrevMonth} 
                    className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border-subtle"
                    title="Previous Month"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleNextMonth} 
                    className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border-subtle"
                    title="Next Month"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
              
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-on-surface-variant uppercase pb-2 border-b border-border-subtle/60">
                <div>MO</div><div>TU</div><div>WE</div><div>TH</div><div>FR</div><div>SA</div><div>SU</div>
              </div>
              
              {/* Calendar Days 7-Col Grid */}
              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return (
                      <div key={idx} className="aspect-square flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm font-medium select-none">
                        {item.dayNum}
                      </div>
                    );
                  }

                  if (isHelperOffline) {
                    return (
                      <div 
                        key={idx} 
                        title="Helper is currently offline and not taking bookings"
                        className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-sm cursor-not-allowed select-none"
                      >
                        {item.dayNum}
                      </div>
                    );
                  }

                  if (!item.isWorkDay) {
                    return (
                      <div 
                        key={idx} 
                        title={`Helper is off duty on ${item.dayName}`}
                        className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-600 text-sm cursor-not-allowed select-none line-through"
                      >
                        {item.dayNum}
                      </div>
                    );
                  }

                  if (item.isSelected) {
                    return (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDate(item)}
                        className="aspect-square flex flex-col items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-md ring-2 ring-primary ring-offset-2 scale-105 transition-all z-10"
                        title="Selected Date for your booking"
                      >
                        <span>{item.dayNum}</span>
                        <span className="w-1.5 h-1.5 bg-white rounded-full mt-0.5"></span>
                      </button>
                    );
                  }

                  if (item.hasBusy) {
                    return (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDate(item)}
                        className="aspect-square flex flex-col items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 font-bold text-sm transition-all"
                        title="Limited spots: Helper has booked slots on this day. Click to view schedule."
                      >
                        <span>{item.dayNum}</span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-0.5"></span>
                      </button>
                    );
                  }

                  return (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(item)}
                      className="aspect-square flex flex-col items-center justify-center rounded-xl bg-primary-container/20 hover:bg-primary text-primary hover:text-white border border-primary/30 font-bold text-sm transition-all shadow-sm"
                      title="Available full day. Click to select for booking."
                    >
                      <span>{item.dayNum}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="pt-3 border-t border-border-subtle/50 flex flex-wrap gap-4 sm:gap-6 text-xs text-on-surface">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded flex items-center justify-center">✓</div>
                  <span className="font-semibold text-primary">Selected Date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-surface-container-low border border-border-subtle rounded"></div>
                  <span>Available Full Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  </div>
                  <span>Limited Spots (Booked intervals)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 line-through">
                    -
                  </div>
                  <span className="text-slate-500">Day Off / Offline</span>
                </div>
              </div>

              {/* Selected Date Summary & Booking Sync Card */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                    <span className="font-label-bold text-label-bold text-on-surface">
                      Selected: {formattedSelectedDate}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {isHelperOffline 
                      ? 'Helper is offline. Booking requests are currently disabled.' 
                      : busySlots.length > 0 
                      ? `Helper has ${busySlots.length} booked slot(s) on this date. Check available times on the booking card.` 
                      : 'Helper has full availability on this date!'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('booking-card');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  Set Time in Booking Card
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>
          
          {/* Reviews Section */}
          <section id="reviews" className="space-y-8 scroll-mt-36">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md font-bold">
                Customer Reviews ({guide.reviewsCount || 0})
              </h2>
            </div>
            
            {/* Rating Summary */}
            <div className="bg-surface-container-lowest dark:bg-surface-dark p-8 rounded-3xl border border-border-subtle shadow-sm flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center justify-center md:border-r border-border-subtle md:pr-10 min-w-44">
                <div className="text-headline-xl font-bold text-primary flex items-center gap-1">
                  <span>{guide.rating != null ? Number(guide.rating).toFixed(1) : '5.0'}</span>
                  <span className="text-lg text-slate-400 font-normal">/ 5</span>
                </div>
                <div className="flex text-status-warning mb-2 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span 
                      key={s} 
                      className="material-symbols-outlined text-[20px]" 
                      style={{ fontVariationSettings: s <= Math.round(guide.rating || 5) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <div className="text-body-sm text-on-surface-variant font-medium">Average Rating</div>
                <div className="text-label-bold text-primary mt-1 font-semibold">{guide.reviewsCount || 0} Verified Reviews</div>
              </div>
              
              <div className="flex-1 space-y-3">
                {[5, 4, 3, 2, 1].map(star => {
                  const revs = guide.reviews || [];
                  const countForStar = revs.filter(r => r.rating === star).length;
                  const pct = revs.length > 0 ? Math.round((countForStar / revs.length) * 100) : (star === 5 ? 100 : 0);
                  return (
                    <div key={star} className="flex items-center gap-4 text-on-surface">
                      <span className="w-12 text-body-sm text-right font-label-bold">{star} star</span>
                      <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="w-12 text-body-sm text-on-surface-variant text-right font-mono">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Reviews List */}
            <div className="space-y-4">
              {(guide.reviews && guide.reviews.length > 0) ? (
                guide.reviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="bg-white dark:bg-surface-dark border border-border-subtle p-6 rounded-2xl shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {rev.avatar ? (
                          <img 
                            src={rev.avatar} 
                            alt={rev.author} 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#005A71]/10 text-[#005A71] flex items-center justify-center font-bold text-sm shadow-sm">
                            {rev.author ? rev.author.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-label-bold text-label-bold text-on-surface font-semibold">{rev.author}</h4>
                          <p className="text-body-sm text-on-surface-variant text-xs">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span 
                            key={s} 
                            className="material-symbols-outlined text-[18px]" 
                            style={{ fontVariationSettings: s <= (rev.rating || 5) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="font-body-md text-on-surface-variant italic mb-2 leading-relaxed text-sm">
                      "{rev.text || rev.comment}"
                    </p>
                    
                    {rev.reply && (
                      <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle mt-3">
                        <p className="font-label-bold text-label-bold text-primary mb-1 text-xs">Reply from {guide.name ? guide.name.split(' ')[0] : 'Guide'}</p>
                        <p className="font-body-md text-on-surface-variant text-xs">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-border-subtle">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                  <p className="text-sm font-semibold text-slate-700">No customer reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Book a tour with {guide.name || 'this helper'} and be the first to share your experience!
                  </p>
                </div>
              )}
            </div>
          </section>
          
        </div>

        {/* Right Column Booking Card (4 cols) */}
        <div id="booking-card" className="lg:col-span-4 sticky top-28 bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-subtle shadow-lg scroll-mt-28">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-headline-md font-bold text-primary">${hourlyRate}</span>
              <span className="text-on-surface-variant font-label-bold text-label-bold ml-1">/ hour</span>
            </div>
            {/* Status indicator on card */}
            <div>
              {isHelperOffline ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                  OFFLINE
                </span>
              ) : guide?.availabilityStatus === 'BUSY' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  BUSY (Check slots)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AVAILABLE
                </span>
              )}
            </div>
          </div>

          {/* Offline warning banner */}
          {isHelperOffline && (
            <div className="mb-4 p-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0 mt-0.5">do_not_disturb_on</span>
              <div>
                <p className="font-bold text-slate-800">Helper is Currently Offline</p>
                <p className="text-slate-600 mt-0.5">This helper is not accepting new booking requests at the moment. You can still browse their profile and reviews.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">DATE</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={handleDateInputChange}
                className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
              />
            </div>

            {/* Start Time & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">START TIME</label>
                <select 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
                >
                  {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">DURATION</label>
                <select 
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
                >
                  {[2, 3, 4, 6, 8].map(h => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Time Slot preview */}
            <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1 border border-border-subtle">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  Selected Schedule:
                </span>
                <span className="font-bold text-primary">{startTime} - {formattedEndTime}</span>
              </div>

              {/* Busy slots on date */}
              {busySlots.length > 0 ? (
                <div className="pt-2 border-t border-border-subtle/50 text-[11px]">
                  <span className="text-slate-500 font-medium block mb-1">Booked intervals on {date}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {busySlots.map((slot, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        {slot.startTime} - {slot.endTime} (Busy)
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Helper has open availability for all slots on this date</span>
                </div>
              )}
            </div>

            {/* Conflict Alert */}
            {conflictingSlot && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <span className="material-symbols-outlined text-[17px]">warning</span>
                  Schedule Conflict Detected!
                </div>
                <p>Helper is already booked from <strong>{conflictingSlot.startTime}</strong> to <strong>{conflictingSlot.endTime}</strong>. Please select another start time or date.</p>
              </div>
            )}
            
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">TRAVELERS</label>
              <select 
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
                className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 6, 8].map(p => (
                  <option key={p} value={p}>{p} people</option>
                ))}
              </select>
            </div>
            
            {/* Price Calculations */}
            <div className="border-t border-border-subtle pt-4 space-y-2">
              <div className="flex justify-between font-body-md text-on-surface-variant">
                <span>${hourlyRate} x {hours} hrs x {people} travelers</span>
                <span>${baseCost}</span>
              </div>
              <div className="flex justify-between font-body-md text-on-surface-variant">
                <span>Service Fee (10%)</span>
                <span>${serviceFee}</span>
              </div>
              <div className="flex justify-between font-label-bold text-label-bold text-on-surface border-t border-border-subtle pt-2">
                <span>Total</span>
                <span className="text-primary font-bold">${totalCost}</span>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isHelperOffline || Boolean(conflictingSlot)}
              className={`w-full py-4 rounded-xl font-label-bold text-label-bold text-center block shadow-md transition-all ${
                isHelperOffline
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : conflictingSlot
                  ? 'bg-amber-100 text-amber-800 cursor-not-allowed border border-amber-300'
                  : 'bg-primary-container text-on-primary-container hover:bg-primary active:scale-[0.98]'
              }`}
            >
              {isHelperOffline 
                ? 'Helper is Offline' 
                : conflictingSlot 
                ? 'Time Slot Conflicted (Pick Another)' 
                : 'Send Booking Request (15m Timeout)'}
            </button>
            
            <button 
              type="button"
              onClick={handleRequestFormSubmit}
              className="w-full border border-primary text-primary py-3.5 rounded-xl font-label-bold text-label-bold text-center block hover:bg-primary/5 transition-all"
            >
              Custom Trip Request
            </button>

            <button 
              type="button"
              onClick={handleMessageHelper}
              className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-container border border-border-subtle hover:border-primary text-on-surface hover:text-primary py-3.5 rounded-xl font-label-bold text-label-bold text-center transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
              Message {guide.name ? guide.name.split(' ')[0] : 'Helper'}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
