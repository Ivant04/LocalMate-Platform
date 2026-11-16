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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 w-full overflow-hidden">
      
      {/* Progress Indicator */}
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative min-w-[500px]">
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-700 text-white font-bold mb-2 shadow-xs">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="text-xs font-bold text-teal-800">1. Chọn Helper</span>
          </div>
          <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-200 -z-10"></div>
          <div className="absolute top-5 left-0 w-[66%] h-[2px] bg-teal-600 -z-10"></div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-700 text-white font-bold mb-2 shadow-xs">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="text-xs font-bold text-teal-800">2. Lên lịch trình</span>
          </div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-teal-700 text-teal-800 font-bold mb-2 shadow-xs">3</div>
            <span className="text-xs font-bold text-teal-800">3. Chi tiết yêu cầu</span>
          </div>
          
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-slate-300 text-slate-400 font-bold mb-2">4</div>
            <span className="text-xs font-medium text-slate-500">4. Xác nhận &amp; Ký quỹ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Container */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Section 1: Basic Information */}
            <div className="card-bento p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-teal-700 p-2 bg-teal-50 rounded-xl text-xl">person</span>
                <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản của bạn</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Họ và tên</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field" 
                    placeholder="Ví dụ: Nguyễn Văn A" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Quốc tịch</label>
                  <input 
                    type="text" 
                    required 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="input-field" 
                    placeholder="Ví dụ: Việt Nam" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Số điện thoại liên hệ</label>
                  <input 
                    type="tel" 
                    required 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="input-field" 
                    placeholder="0912 345 678" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Zalo / WhatsApp (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="input-field" 
                    placeholder="Số Zalo hoặc tài khoản liên lạc" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Trip Information */}
            <div className="card-bento p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-teal-700 p-2 bg-teal-50 rounded-xl text-xl">map</span>
                <h2 className="text-lg font-bold text-slate-900">Thông tin chuyến đi</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Điểm đến (Thành phố)</label>
                  <input 
                    type="text" 
                    required 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input-field" 
                    placeholder="Ví dụ: Đà Nẵng, Việt Nam" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Khu vực muốn tham quan</label>
                  <input 
                    type="text" 
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    className="input-field" 
                    placeholder="Ví dụ: Bán đảo Sơn Trà, Ngũ Hành Sơn" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Ngày đến</label>
                    <input 
                      type="date" 
                      required 
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="input-field cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Ngày về</label>
                    <input 
                      type="date" 
                      required 
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="input-field cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Giờ hẹn gặp</label>
                    <input 
                      type="time" 
                      required 
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="input-field cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Địa điểm gặp mặt</label>
                    <input 
                      type="text" 
                      required 
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="input-field" 
                      placeholder="Sảnh khách sạn, Quán cafe, v.v." 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Service Requirements */}
            <div className="card-bento p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-teal-700 p-2 bg-teal-50 rounded-xl text-xl">handyman</span>
                <h2 className="text-lg font-bold text-slate-900">Nhu cầu &amp; Hỗ trợ từ Helper</h2>
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
                  <label key={req.key} className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input 
                      type="checkbox" 
                      checked={requirements[req.key]}
                      onChange={() => handleRequirementChange(req.key)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500 cursor-pointer" 
                    />
                    <span className="text-xs font-medium text-slate-700 group-hover:text-teal-800 transition-colors">{req.label}</span>
                  </label>
                ))}
                
                <div className="col-span-full mt-3">
                  <input 
                    type="text" 
                    value={otherReqs}
                    onChange={(e) => setOtherReqs(e.target.value)}
                    className="input-field" 
                    placeholder="Yêu cầu cụ thể khác của bạn..." 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Trip Details */}
            <div className="card-bento p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-teal-700 p-2 bg-teal-50 rounded-xl text-xl">luggage</span>
                <h2 className="text-lg font-bold text-slate-900">Chi tiết nhóm đi</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Số lượng thành viên</label>
                  <select 
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option>1 Người</option>
                    <option>2 Người</option>
                    <option>3 - 4 Người</option>
                    <option>5+ Người (Đoàn)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Phong cách du lịch</label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
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
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          travelStyle === style.label 
                            ? 'bg-white text-teal-800 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
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
              className="w-full btn-primary py-4 text-sm font-bold shadow-md"
            >
              Gửi yêu cầu thiết kế tour tới {guideName}
            </button>
          </form>
        </div>

        {/* Right Side Info Widget */}
        <aside className="lg:col-span-4 card-bento p-6 sm:p-7 sticky top-24">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-teal-700 text-lg">info</span>
            <h3 className="font-bold text-base text-slate-900">Hướng dẫn gửi yêu cầu</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Bạn đang gửi yêu cầu thiết kế tour riêng tới <strong className="text-slate-800">{guideName}</strong>. Helper sẽ nghiên cứu lịch trình và phản hồi kế hoạch chi tiết cho bạn qua tin nhắn.
          </p>
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 mb-6 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[16px] text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              Bảo đảm Ký quỹ 100%
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Bạn chỉ thanh toán sau khi Helper chấp thuận lịch trình. Toàn bộ tiền được bảo vệ bởi Quỹ Escrow an toàn.
            </p>
          </div>
          <div className="flex gap-3.5 items-center border-t border-slate-100 pt-5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">support_agent</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Cần trợ giúp trực tiếp?</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Đội ngũ hỗ trợ LocalMate luôn sẵn sàng 24/7 để đồng hành cùng bạn.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
