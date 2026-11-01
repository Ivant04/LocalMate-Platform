import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function HelperRequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { guideName } = location.state || { guideName: "Linh Nguyen" };

  // Current logged in user
  const storedUser = localStorage.getItem('localmate_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để gửi yêu cầu tour!");
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [nationality, setNationality] = useState('Việt Nam');
  const [contactNumber, setContactNumber] = useState(currentUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [destination, setDestination] = useState(location.state?.city || '');
  const [areas, setAreas] = useState('');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [travelersCount, setTravelersCount] = useState('1 Người');
  const [travelStyle, setTravelStyle] = useState('Thư giãn');
  
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
    const tourTitle = `Tour Tùy Chỉnh: ${destination} (${areas})`;

    const bookingPayload = {
      travelerId: currentUser?.id || null,
      helperId: location.state?.guideId || null,
      tourName: tourTitle,
      bookingDate: arrival,
      durationHours: 6,
      meetLocation: meetingLocation,
      specialRequests: `Số khách: ${travelersCount}. Phong cách: ${travelStyle}. Nhu cầu: ${Object.keys(requirements).filter(k => requirements[k]).join(', ')}. Ghi chú: ${otherReqs}`,
      totalPrice: 1500000,
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    };

    try {
      await fetch(`${API_BASE_URL}/api/v1/bookings?travelerEmail=${encodeURIComponent(travelerEmail)}&helperEmail=${encodeURIComponent(guideEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
    } catch (err) {
      console.error('Error saving custom request:', err);
    }

    alert(`Yêu cầu của bạn đã được gửi tới ${guideName}! Helper sẽ kiểm tra lịch trình và sớm nhắn tin cho bạn.`);
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
            <span className="font-label-bold text-label-bold text-primary">Chọn Helper</span>
          </div>
          <div className="absolute top-5 left-0 w-full h-[2px] bg-outline-variant -z-10"></div>
          <div className="absolute top-5 left-0 w-[33%] h-[2px] bg-primary -z-10"></div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="font-label-bold text-label-bold text-primary">Đặt lịch</span>
          </div>
          <div className="absolute top-5 left-0 w-[66%] h-[2px] bg-primary -z-10"></div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-primary text-primary font-bold mb-2">3</div>
            <span className="font-label-bold text-label-bold text-primary font-bold">Chi tiết yêu cầu</span>
          </div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-outline-variant text-outline-variant font-bold mb-2">4</div>
            <span className="font-label-bold text-label-bold text-on-surface-variant">Xác nhận</span>
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
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Thông tin cơ bản</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Họ và tên</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Ví dụ: Nguyễn Văn A" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Quốc tịch</label>
                  <input 
                    type="text" 
                    required 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Ví dụ: Việt Nam" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Số điện thoại liên hệ</label>
                  <input 
                    type="tel" 
                    required 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="0912 345 678" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Zalo / Telegram / WhatsApp (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Số Zalo hoặc @username" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Trip Information */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">map</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Thông tin chuyến đi</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Điểm đến (Thành phố)</label>
                  <input 
                    type="text" 
                    required 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Ví dụ: Đà Nẵng, Việt Nam" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Khu vực muốn tham quan</label>
                  <input 
                    type="text" 
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Ví dụ: Bán đảo Sơn Trà, Ngũ Hành Sơn" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Ngày đến</label>
                    <input 
                      type="date" 
                      required 
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Ngày về</label>
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
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Giờ hẹn gặp</label>
                    <input 
                      type="time" 
                      required 
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-bold text-label-bold text-on-surface-variant block">Địa điểm gặp mặt</label>
                    <input 
                      type="text" 
                      required 
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="Sảnh khách sạn, Quán cafe, v.v." 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Service Requirements */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">handyman</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Nhu cầu &amp; Hỗ trợ</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                {[
                  { key: 'translation', label: 'Phiên dịch & Hướng dẫn' },
                  { key: 'recommendations', label: 'Gợi ý điểm đến / ăn uống' },
                  { key: 'food', label: 'Ẩm thực bản địa' },
                  { key: 'transport', label: 'Phương tiện đi lại' },
                  { key: 'shopping', label: 'Hướng dẫn mua sắm' },
                  { key: 'culture', label: 'Trải nghiệm văn hóa' },
                  { key: 'nightlife', label: 'Đời sống đêm' },
                  { key: 'emergency', label: 'Hỗ trợ khẩn cấp' },
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
                    placeholder="Yêu cầu cụ thể khác của bạn..." 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Trip Details */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-lg">luggage</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Chi tiết nhóm đi</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Số lượng thành viên</label>
                  <select 
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(e.target.value)}
                    className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface text-on-surface outline-none cursor-pointer"
                  >
                    <option>1 Người</option>
                    <option>2 Người</option>
                    <option>3 - 4 Người</option>
                    <option>5+ Người (Đoàn)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-bold text-label-bold text-on-surface-variant block">Phong cách du lịch</label>
                  <div className="flex gap-2 p-1 bg-surface-container rounded-xl">
                    {[
                      { key: 'Relaxed', label: 'Thư giãn' },
                      { key: 'Active', label: 'Năng động' },
                      { key: 'Budget', label: 'Tiết kiệm' },
                      { key: 'Luxury', label: 'Cao cấp' }
                    ].map(style => (
                      <button 
                        key={style.key}
                        type="button"
                        onClick={() => setTravelStyle(style.label)}
                        className={`flex-1 py-2 text-body-sm font-label-bold rounded-lg transition-all ${
                          travelStyle === style.label 
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {style.label}
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
              Gửi yêu cầu tới {guideName}
            </button>
          </form>
        </div>

        {/* Right Side Info Widget */}
        <aside className="lg:col-span-4 bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-subtle shadow-sm min-w-0 break-words">
          <h3 className="font-headline-md text-headline-md font-bold mb-4 text-on-surface">Hướng dẫn gửi yêu cầu</h3>
          <p className="font-body-md text-on-surface-variant mb-6">
            Bạn đang gửi yêu cầu thiết kế tour riêng tới **{guideName}**. Helper sẽ nghiên cứu lịch trình và phản hồi kế hoạch chi tiết cho bạn.
          </p>
          <div className="flex gap-4 items-center border-t border-border-subtle pt-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h4 className="font-label-bold text-label-bold text-on-surface">Cần trợ giúp?</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Đội ngũ hỗ trợ LocalMate luôn sẵn sàng 24/7 để đồng hành cùng bạn.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
