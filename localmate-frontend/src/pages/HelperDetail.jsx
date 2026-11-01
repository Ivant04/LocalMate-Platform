import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { formatVND, formatRateVND } from '../utils/formatCurrency';

export default function HelperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setGuide({
            ...data,
            name: data.fullName || data.name || 'Local Helper',
            fullName: data.fullName || data.name || 'Local Helper',
            email: data.email || '',
            city: data.city || data.location || 'Việt Nam',
            country: data.country || 'Việt Nam',
            title: data.title || 'Người dẫn đường bản địa',
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 0,
            hostedHours: data.hostedHours || `${(data.reviewsCount || 1) * 4}+`,
            languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || 'Tiếng Việt, Tiếng Anh'),
            price: data.price !== undefined ? parseFloat(data.price) : (data.hourlyRate !== undefined ? parseFloat(data.hourlyRate) : 62500),
            expertises: Array.isArray(data.expertises) ? data.expertises : (data.skills || ['LOCAL EXPERT']),
            img: data.img || data.avatar || data.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            bio: data.bio || 'Local Helper giàu kinh nghiệm, sẵn sàng đồng hành cùng bạn khám phá văn hóa bản địa đích thực.',
            experiences: data.experiences || [],
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
          });
        } else {
          setGuide(null);
        }
      } catch (err) {
        console.error('Error fetching helper detail:', err);
        setGuide(null);
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
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${targetId}/schedule`);
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
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${targetId}/schedule?date=${date}`);
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
  
  const rawRate = guide?.price !== undefined ? parseFloat(guide.price) : 62500;
  const hourlyRate = (rawRate > 0 && rawRate < 1000) ? Math.round(rawRate * 25000) : Math.round(rawRate);
  const baseCost = Math.round(hourlyRate * hours * people);
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
      alert("Vui lòng đăng nhập để đặt Local Helper!");
      navigate('/login');
      return;
    }

    if (isHelperOffline) {
      alert("Helper hiện đang NGOẠI TUYẾN và tạm thời không nhận yêu cầu đặt tour mới.");
      return;
    }
    if (conflictingSlot) {
      alert(`Helper đã có lịch bận từ ${conflictingSlot.startTime} đến ${conflictingSlot.endTime}. Vui lòng chọn khung giờ khác.`);
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
        tourName: guide.title || `Trải nghiệm cùng ${gName}`,
        city: guide.city || 'Đà Nẵng, Việt Nam',
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
      alert("Vui lòng đăng nhập để gửi yêu cầu tour!");
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
        tourName: guide.title || 'Tour Khám Phá Bản Địa Tùy Chỉnh',
        city: guide.city || 'Đà Nẵng, Việt Nam',
        pricePerHour: hourlyRate
      }
    });
  };

  const handleMessageHelper = () => {
    const storedUser = localStorage.getItem('localmate_user');
    if (!storedUser) {
      alert("Vui lòng đăng nhập để nhắn tin cho Local Helper!");
      navigate('/login');
      return;
    }
    let currentUserObj = null;
    try {
      currentUserObj = JSON.parse(storedUser);
    } catch {
      currentUserObj = null;
    }

    const gEmail = resolveGuideEmail();
    if (currentUserObj?.email && currentUserObj.email.toLowerCase().trim() === gEmail.toLowerCase().trim()) {
      alert("Đây là tài khoản Helper của chính bạn! Bạn không thể tự nhắn tin cho mình.");
      return;
    }

    const gName = guide?.fullName || guide?.name || 'Local Guide';
    const gAvatar = guide?.avatar || guide?.avatarUrl || guide?.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    navigate(`/chat?target=${encodeURIComponent(gEmail)}`, {
      state: {
        guideEmail: gEmail,
        guideName: gName,
        guideAvatar: gAvatar,
        tourName: guide?.title || `Trải nghiệm cùng ${gName}`,
        city: guide?.city || 'Việt Nam',
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 flex justify-center items-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-teal-700 font-bold text-sm">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          Loading Local Helper details...
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">person_off</span>
        <h2 className="text-xl font-bold text-gray-800">Local Helper Not Found</h2>
        <p className="text-xs text-gray-500 mt-2 max-w-md">The requested local helper profile could not be found in the database.</p>
        <button
          onClick={() => navigate('/search')}
          className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Browse All Helpers
        </button>
      </div>
    );
  }

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
                <span className="font-label-bold text-label-bold uppercase">Đã xác thực</span>
              </div>
              <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full w-fit">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <span className="font-label-bold text-label-bold uppercase">Helper xuất sắc</span>
              </div>
              {/* Availability Status Badge */}
              {(!guide.availabilityStatus || guide.availabilityStatus === 'AVAILABLE') && (
                <div className="flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">SẴN SÀNG</span>
                </div>
              )}
              {guide.availabilityStatus === 'BUSY' && (
                <div className="flex items-center gap-2 bg-amber-500/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">ĐANG BẬN (Xem lịch)</span>
                </div>
              )}
              {guide.availabilityStatus === 'OFFLINE' && (
                <div className="flex items-center gap-2 bg-slate-600/90 text-white px-3 py-1 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="font-label-bold text-label-bold uppercase tracking-wider">NGOẠI TUYẾN</span>
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
              <p className="font-label-bold text-label-bold text-on-surface-variant mt-1">{guide.reviewsCount} Đánh giá</p>
            </div>
            
            <div className="h-12 w-[1px] bg-border-subtle self-center"></div>
            <div className="text-center flex flex-col justify-center">
              <p className="font-headline-md text-headline-md text-primary font-bold">{guide.hostedHours}</p>
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Giờ dẫn tour</p>
            </div>
            
            <div className="h-12 w-[1px] bg-border-subtle self-center"></div>
            <div className="text-center flex flex-col justify-center">
              <p className="font-headline-md text-headline-md text-primary font-bold">Ngôn ngữ</p>
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
              { id: 'info', label: 'Thông tin' },
              { id: 'experience', label: 'Kinh nghiệm' },
              { id: 'availability', label: 'Lịch trình' },
              { id: 'reviews', label: 'Đánh giá' }
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
            <h2 className="font-headline-md text-headline-md font-bold mb-4">Giới thiệu về {guide.name ? guide.name.split(' ')[0] : 'Helper'}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {guide.bio}
            </p>
          </section>
          
          {/* Experience Section */}
          <section id="experience" className="bg-surface-container-low p-8 rounded-3xl border border-border-subtle scroll-mt-36">
            <h2 className="font-headline-md text-headline-md font-bold mb-6">Kinh nghiệm thực tế</h2>
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
                <h2 className="font-headline-md text-headline-md font-bold">Lịch trình &amp; Khung giờ</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Chọn ngày còn trống bên dưới để đồng bộ vào phiếu đặt tour của bạn.
                </p>
              </div>
              <div className="shrink-0">
                {isHelperOffline ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> NGOẠI TUYẾN
                  </span>
                ) : guide?.availabilityStatus === 'BUSY' ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> ĐANG BẬN (Xem lịch)
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> SẴN SÀNG
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm space-y-6">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-headline-sm text-lg font-bold text-on-surface">
                    {`Tháng ${currentMonth.getMonth() + 1}, ${currentMonth.getFullYear()}`}
                  </span>
                  {normalizedWorkingDays.length > 0 && (
                    <span className="text-xs text-on-surface-variant ml-2 font-medium">
                      • Ngày làm việc: {normalizedWorkingDays.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handlePrevMonth} 
                    className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border-subtle"
                    title="Tháng trước"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleNextMonth} 
                    className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border-subtle"
                    title="Tháng sau"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
              
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-on-surface-variant uppercase pb-2 border-b border-border-subtle/60">
                <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
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
                        title="Helper hiện đang ngoại tuyến"
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
                        title={`Helper nghỉ vào ${item.dayName}`}
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
                        title="Ngày được chọn cho chuyến đi"
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
                        title="Đã có một số lịch bận trong ngày này. Nhấp để xem chi tiết."
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
                      title="Trống cả ngày. Nhấp để chọn."
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
                  <span className="font-semibold text-primary">Ngày đã chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-surface-container-low border border-border-subtle rounded"></div>
                  <span>Trống cả ngày</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  </div>
                  <span>Có một số giờ bận</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 line-through">
                    -
                  </div>
                  <span className="text-slate-500">Nghỉ / Ngoại tuyến</span>
                </div>
              </div>

              {/* Selected Date Summary & Booking Sync Card */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                    <span className="font-label-bold text-label-bold text-on-surface">
                      Đã chọn: {formattedSelectedDate}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {isHelperOffline 
                      ? 'Helper đang ngoại tuyến. Tạm khóa nhận lịch mới.' 
                      : busySlots.length > 0 
                      ? `Helper có ${busySlots.length} lịch bận vào ngày này. Vui lòng kiểm tra khung giờ trống trên thẻ đặt tour.` 
                      : 'Helper hoàn toàn trống lịch vào ngày này!'}
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
                  Điền giờ đặt tour
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>
          
          {/* Reviews Section */}
          <section id="reviews" className="space-y-8 scroll-mt-36">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md font-bold">
                Đánh giá từ khách hàng ({guide.reviewsCount || 0})
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
                <div className="text-body-sm text-on-surface-variant font-medium">Điểm đánh giá trung bình</div>
                <div className="text-label-bold text-primary mt-1 font-semibold">{guide.reviewsCount || 0} Đánh giá xác thực</div>
              </div>
              
              <div className="flex-1 space-y-3">
                {[5, 4, 3, 2, 1].map(star => {
                  const revs = guide.reviews || [];
                  const countForStar = revs.filter(r => r.rating === star).length;
                  const pct = revs.length > 0 ? Math.round((countForStar / revs.length) * 100) : (star === 5 ? 100 : 0);
                  return (
                    <div key={star} className="flex items-center gap-4 text-on-surface">
                      <span className="w-12 text-body-sm text-right font-label-bold">{star} sao</span>
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
                        <p className="font-label-bold text-label-bold text-primary mb-1 text-xs">Phản hồi từ {guide.name ? guide.name.split(' ')[0] : 'Helper'}</p>
                        <p className="font-body-md text-on-surface-variant text-xs">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-border-subtle">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                  <p className="text-sm font-semibold text-slate-700">Chưa có đánh giá nào từ khách hàng</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Hãy đặt tour cùng {guide.name || 'Helper này'} và là người đầu tiên chia sẻ cảm nhận!
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
              <span className="text-headline-md font-bold text-primary">{formatRateVND(hourlyRate)}</span>
            </div>
            {/* Status indicator on card */}
            <div>
              {isHelperOffline ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                  NGOẠI TUYẾN
                </span>
              ) : guide?.availabilityStatus === 'BUSY' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ĐANG BẬN (Xem lịch)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SẴN SÀNG
                </span>
              )}
            </div>
          </div>

          {/* Offline warning banner */}
          {isHelperOffline && (
            <div className="mb-4 p-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0 mt-0.5">do_not_disturb_on</span>
              <div>
                <p className="font-bold text-slate-800">Helper hiện đang ngoại tuyến</p>
                <p className="text-slate-600 mt-0.5">Helper hiện tạm không nhận yêu cầu đặt tour mới. Bạn vẫn có thể xem hồ sơ và các đánh giá.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">NGÀY KHỞI HÀNH</label>
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
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">GIỜ BẮT ĐẦU</label>
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
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">THỜI LƯỢNG</label>
                <select 
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
                >
                  {[2, 3, 4, 6, 8].map(h => (
                    <option key={h} value={h}>{h} giờ</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Time Slot preview */}
            <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1 border border-border-subtle">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  Khung giờ đã chọn:
                </span>
                <span className="font-bold text-primary">{startTime} - {formattedEndTime}</span>
              </div>

              {/* Busy slots on date */}
              {busySlots.length > 0 ? (
                <div className="pt-2 border-t border-border-subtle/50 text-[11px]">
                  <span className="text-slate-500 font-medium block mb-1">Các khung giờ bận ngày {date}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {busySlots.map((slot, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        {slot.startTime} - {slot.endTime} (Đã có hẹn)
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Helper trống tất cả khung giờ trong ngày này</span>
                </div>
              )}
            </div>

            {/* Conflict Alert */}
            {conflictingSlot && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <span className="material-symbols-outlined text-[17px]">warning</span>
                  Phát hiện trùng lịch trình!
                </div>
                <p>Helper đã có lịch bận từ <strong>{conflictingSlot.startTime}</strong> đến <strong>{conflictingSlot.endTime}</strong>. Vui lòng chọn giờ hoặc ngày khác.</p>
              </div>
            )}
            
            <div>
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">SỐ LƯỢNG KHÁCH</label>
              <select 
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
                className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 6, 8].map(p => (
                  <option key={p} value={p}>{p} khách</option>
                ))}
              </select>
            </div>
            
            {/* Price Calculations */}
            <div className="border-t border-border-subtle pt-4 space-y-2">
              <div className="flex justify-between font-body-md text-on-surface-variant">
                <span>{formatVND(hourlyRate)} x {hours} giờ x {people} khách</span>
                <span>{formatVND(baseCost)}</span>
              </div>
              <div className="flex justify-between font-body-md text-on-surface-variant">
                <span>Phí dịch vụ nền tảng (10%)</span>
                <span>{formatVND(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-label-bold text-label-bold text-on-surface border-t border-border-subtle pt-2">
                <span>Tổng cộng</span>
                <span className="text-primary font-bold">{formatVND(totalCost)}</span>
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
                ? 'Helper đang ngoại tuyến' 
                : conflictingSlot 
                ? 'Bị trùng giờ bận (Chọn giờ khác)' 
                : 'Đặt tour ngay (Giữ chỗ 15p)'}
            </button>
            
            <button 
              type="button"
              onClick={handleRequestFormSubmit}
              className="w-full border border-primary text-primary py-3.5 rounded-xl font-label-bold text-label-bold text-center block hover:bg-primary/5 transition-all"
            >
              Yêu cầu tour tùy chỉnh
            </button>

            <button 
              type="button"
              onClick={handleMessageHelper}
              className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-container border border-border-subtle hover:border-primary text-on-surface hover:text-primary py-3.5 rounded-xl font-label-bold text-label-bold text-center transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
              Nhắn tin cho {guide?.fullName || guide?.name || 'Helper'}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
