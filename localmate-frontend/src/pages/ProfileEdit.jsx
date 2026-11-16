import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { formatVND, formatRateVND } from '../utils/formatCurrency';
import Sidebar from '../components/Sidebar';

export default function ProfileEdit() {
  const navigate = useNavigate();

  // Current logged-in user state
  const [currentUser, setCurrentUser] = useState(null);

  // Sub-tabs: 'basic' | 'security' | 'notifications' | 'preferences'
  const [activeTab, setActiveTab] = useState('basic');

  // Form Fields - Basic Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('1995-08-15');
  const [gender, setGender] = useState('male');
  const [nationality, setNationality] = useState('VN');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Security Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Preferences
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Language & Currency Preferences
  const [prefLang, setPrefLang] = useState('vi');
  const [prefCurrency, setPrefCurrency] = useState('VND');

  // Helper hourly rate in VND
  const [hourlyRate, setHourlyRate] = useState(100000);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Hồ sơ cá nhân đã được đồng bộ thành công.');

  // Load user from localStorage and backend
  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert("Vui lòng đăng nhập để xem và chỉnh sửa hồ sơ của bạn!");
      navigate('/login');
      return;
    }

    let user = null;
    try {
      user = JSON.parse(stored);
      setCurrentUser(user);
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phone) {
        setPhoneNumber(user.phone.replace('+84', '').replace('+1', '').replace('+44', '').replace('+81', '').trim());
      }
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
      if (user.address) setAddress(user.address);
      if (user.bio) setBio(user.bio);
      if (user.birthDate) setBirthDate(user.birthDate);
      if (user.gender) setGender(user.gender);
      if (user.nationality) setNationality(user.nationality);
      if (user.prefLang) setPrefLang(user.prefLang);
      if (user.prefCurrency) setPrefCurrency(user.prefCurrency);
      if (user.notifBookings !== undefined) setNotifBookings(user.notifBookings);
      if (user.notifMessages !== undefined) setNotifMessages(user.notifMessages);
      if (user.notifPromos !== undefined) setNotifPromos(user.notifPromos);
      if (user.hourlyRate !== undefined) {
        const r = Number(user.hourlyRate) || 100000;
        setHourlyRate(r < 1000 ? r * 25000 : r);
      }
    } catch (err) {
      console.error('Error loading stored user:', err);
    }

    if (user?.email || user?.id) {
      const queryParams = new URLSearchParams();
      if (user.email) queryParams.set('email', user.email);
      if (user.id) queryParams.set('id', user.id);

      fetch(`${API_BASE_URL}/api/v1/users/profile?${queryParams.toString()}`)
        .then(res => res.ok ? res.json() : null)
        .then(freshUser => {
          if (freshUser) {
            setCurrentUser(prev => ({ ...(prev || {}), ...freshUser }));
            if (freshUser.fullName) setFullName(freshUser.fullName);
            if (freshUser.email) setEmail(freshUser.email);
            if (freshUser.phone) {
              setPhoneNumber(freshUser.phone.replace('+84', '').replace('+1', '').replace('+44', '').replace('+81', '').trim());
            }
            if (freshUser.avatarUrl) setAvatarUrl(freshUser.avatarUrl);
            if (freshUser.address) setAddress(freshUser.address);
            if (freshUser.bio) setBio(freshUser.bio);
            if (freshUser.birthDate) setBirthDate(freshUser.birthDate);
            if (freshUser.gender) setGender(freshUser.gender);
            if (freshUser.nationality) setNationality(freshUser.nationality);
            if (freshUser.prefLang) setPrefLang(freshUser.prefLang);
            if (freshUser.prefCurrency) setPrefCurrency(freshUser.prefCurrency);
            if (freshUser.notifBookings !== undefined) setNotifBookings(freshUser.notifBookings);
            if (freshUser.notifMessages !== undefined) setNotifMessages(freshUser.notifMessages);
            if (freshUser.notifPromos !== undefined) setNotifPromos(freshUser.notifPromos);
            if (freshUser.hourlyRate !== undefined) {
              const r = Number(freshUser.hourlyRate) || 100000;
              setHourlyRate(r < 1000 ? r * 25000 : r);
            }

            // update localStorage with fresh info
            const merged = { ...(user || {}), ...freshUser };
            localStorage.setItem('localmate_user', JSON.stringify(merged));
          }
        })
        .catch(err => console.warn('Could not fetch latest profile:', err));
    }
  }, [navigate]);

  // Profile completion calculation
  const calculateCompletion = () => {
    let score = 25; // email
    if (fullName && fullName.length > 2) score += 15;
    if (phoneNumber && phoneNumber.length > 5) score += 15;
    if (birthDate) score += 10;
    if (address && address.length > 5) score += 15;
    if (bio && bio.length > 10) score += 10;
    if (avatarUrl) score += 10;
    return Math.min(score, 100);
  };

  const completionPercentage = calculateCompletion();

  // Avatar upload with smart canvas compression
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Dung lượng tệp vượt quá giới hạn 50MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300');
  };

  // Submit Profile Changes
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const storedUser = JSON.parse(localStorage.getItem('localmate_user') || '{}');
    const activeEmail = email || currentUser?.email || storedUser.email;
    const activeId = currentUser?.id || currentUser?._id || storedUser.id || storedUser._id;

    const fullPhone = `${countryCode} ${phoneNumber}`.trim();
    const parsedRate = Number(hourlyRate);
    const finalRate = parsedRate < 1000 ? parsedRate * 25000 : parsedRate;

    const payload = {
      id: activeId,
      email: activeEmail,
      fullName,
      phone: fullPhone,
      avatarUrl,
      birthDate,
      gender,
      nationality,
      address,
      bio,
      location: address || currentUser?.location || 'Việt Nam',
      hourlyRate: finalRate > 0 ? finalRate : 100000,
      prefLang,
      prefCurrency,
      notifBookings,
      notifMessages,
      notifPromos,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMsg = 'Không thể cập nhật hồ sơ cá nhân!';
        try {
          const errorData = await res.json();
          if (errorData && errorData.message) errorMsg = errorData.message;
        } catch {
          const text = await res.text().catch(() => '');
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }

      const savedUser = await res.json();
      const updatedUser = {
        ...(currentUser || {}),
        ...savedUser,
        token: currentUser?.token || storedUser.token,
      };

      localStorage.setItem('localmate_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      window.dispatchEvent(new Event('storage'));

      setIsSaving(false);
      setSaveSuccess(true);
      setShowToast(true);
      setToastMessage('Hồ sơ cá nhân đã được lưu thành công vào cơ sở dữ liệu!');

      setTimeout(() => setSaveSuccess(false), 2500);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      setIsSaving(false);
      alert('Không thể lưu hồ sơ: ' + err.message);
    }
  };

  // Submit Password Change
  const handleSubmitSecurity = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser?.id,
          email: currentUser?.email,
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Cập nhật mật khẩu thất bại!');
      }

      setIsSaving(false);
      setSaveSuccess(true);
      setShowToast(true);
      setToastMessage('Mật khẩu tài khoản đã được cập nhật thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSaveSuccess(false), 2500);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      setIsSaving(false);
      alert(err.message);
    }
  };

  const isHelper = currentUser?.roles?.includes('ROLE_HELPER');
  const dashboardLink = isHelper ? '/helper-dashboard' : '/traveler';
  const roleLabel = isHelper ? 'Local Helper' : 'Du khách khám phá';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 selection:bg-teal-700 selection:text-white">
      
      {/* SideNavBar - Desktop Only */}
      <Sidebar activePage="profile" />

      {/* Main Content Canvas */}
      <main className="flex-1 min-h-screen overflow-y-auto relative bg-slate-50">
        <div className="p-6 md:p-10 max-w-[1280px] mx-auto w-full space-y-8">
          
          {/* Toast Alert Banner */}
          {showToast && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 shadow-sm transition-all duration-300 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="font-bold text-teal-900 font-semibold">Cập nhật thông tin thành công!</p>
                  <p className="text-xs text-teal-700">{toastMessage}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowToast(false)}
                className="text-teal-600 hover:text-teal-900 p-1 rounded-lg transition-colors cursor-pointer" 
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          )}

          {/* Header & Breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 mb-2 uppercase tracking-wider text-xs font-bold text-slate-400">
                <span className="cursor-pointer hover:underline" onClick={() => navigate(dashboardLink)}>Cài đặt tài khoản</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-teal-700 font-bold">Hồ sơ cá nhân</span>
              </nav>
              <h1 className="text-2xl md:text-3xl text-slate-900 font-black tracking-tight">Chỉnh sửa hồ sơ cá nhân</h1>
              <p className="text-sm text-slate-500 mt-1">
                Quản lý và cập nhật thông tin cá nhân của bạn để có trải nghiệm an toàn, minh bạch trên LocalMate.
              </p>
            </div>

            {/* Profile Completion Gauge Widget */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-800 shrink-0">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path 
                    className="text-slate-100" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.2"
                  />
                  <path 
                    className="text-teal-700 transition-all duration-700" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeDasharray={`${completionPercentage}, 100`} 
                    strokeLinecap="round" 
                    strokeWidth="3.2"
                  />
                </svg>
                <span className="absolute text-[11px] text-slate-800 font-black">{completionPercentage}%</span>
              </div>
              <div className="leading-tight">
                <p className="text-xs text-slate-900 font-bold">Mức độ hoàn thiện</p>
                <p className="text-[12px] text-teal-700 font-semibold">
                  {completionPercentage >= 80 ? 'Rất tốt (Gần hoàn tất)' : 'Cần thêm thông tin'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Grid: Tabs and Main Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full overflow-hidden">
            
            {/* Sub-Navigation Side Column */}
            <aside className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none w-full min-w-0">
              <button 
                onClick={() => setActiveTab('basic')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-sm shrink-0 transition-all text-left w-full cursor-pointer ${
                  activeTab === 'basic' 
                    ? 'bg-teal-700 text-white font-bold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'basic' ? "'FILL' 1" : "'FILL' 0" }}>badge</span>
                <span>Thông tin cơ bản</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-sm shrink-0 transition-all text-left w-full cursor-pointer ${
                  activeTab === 'security' 
                    ? 'bg-teal-700 text-white font-bold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                <span>Bảo mật &amp; Mật khẩu</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-sm shrink-0 transition-all text-left w-full cursor-pointer ${
                  activeTab === 'notifications' 
                    ? 'bg-teal-700 text-white font-bold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                <span>Cài đặt thông báo</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-sm shrink-0 transition-all text-left w-full cursor-pointer ${
                  activeTab === 'preferences' 
                    ? 'bg-teal-700 text-white font-bold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                <span>Ngôn ngữ &amp; Tiền tệ</span>
              </button>

              {/* Identity Verification Badge Card */}
              <div className="hidden lg:flex flex-col mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-teal-700 mb-2">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="font-bold text-sm">Tài khoản đã xác minh</span>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Căn cước công dân và thông tin định danh đã được hệ thống phê duyệt an toàn.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  Huy hiệu: {roleLabel}
                </div>
              </div>
            </aside>

            {/* Main Content Area Based on Active Tab */}
            <section className="lg:col-span-9 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-8 min-w-0 max-w-full overflow-hidden">
              
              {/* TAB 1: BASIC INFORMATION */}
              {activeTab === 'basic' && (
                <>
                  {/* 1. Avatar & Badges Section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
                    <div className="relative shrink-0 group">
                      <img 
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-sm border-2 border-slate-100" 
                        alt={fullName} 
                        src={avatarUrl} 
                      />
                      <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1.5 rounded-full shadow-md flex items-center justify-center ring-2 ring-white" title="Hồ sơ đã xác minh">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className="badge-info">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                          {roleLabel}
                        </span>
                        <span className="badge-success">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Đã xác minh danh tính
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <label className="btn-primary text-xs !py-2 !px-3.5 cursor-pointer" htmlFor="avatar-input">
                          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                          <span>Đổi ảnh đại diện</span>
                          <input 
                            accept="image/png, image/jpeg, image/webp" 
                            className="hidden" 
                            id="avatar-input" 
                            type="file" 
                            onChange={handleAvatarChange}
                          />
                        </label>
                        <button 
                          onClick={handleRemoveAvatar}
                          className="btn-danger text-xs !py-2 !px-3" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span>Gỡ ảnh</span>
                        </button>
                      </div>
                      
                      <p className="text-[12px] text-slate-400 mt-3 leading-normal">
                        Hỗ trợ định dạng JPG, PNG hoặc WEBP. Dung lượng tối đa 50MB. Độ phân giải gợi ý 400x400px.
                      </p>
                    </div>
                  </div>

                  {/* 2. Form Fields Grid */}
                  <form onSubmit={handleSubmitProfile} className="space-y-6" id="profile-edit-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="block text-sm text-slate-800 font-bold">
                          Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            className="input-field pr-10" 
                            name="fullName" 
                            placeholder="Nhập họ và tên đầy đủ" 
                            required 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute right-3.5 top-3 text-slate-400 text-[20px]">person</span>
                        </div>
                        <p className="text-[12px] text-slate-500">Tên này sẽ hiển thị công khai trên hồ sơ và yêu cầu đặt tour.</p>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm text-slate-800 font-bold">
                            Địa chỉ Email <span className="text-rose-500">*</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Đã xác minh
                          </span>
                        </div>
                        <div className="relative">
                          <input 
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 text-sm cursor-not-allowed outline-none font-medium" 
                            name="email" 
                            readOnly 
                            type="email" 
                            value={email}
                          />
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-teal-700 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <p className="text-[12px] text-slate-500">Email dùng để đăng nhập và nhận thông báo chuyến đi.</p>
                      </div>

                      {/* Phone Number with Country Code */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm text-slate-800 font-bold">
                            Số điện thoại <span className="text-rose-500">*</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Hợp lệ
                          </span>
                        </div>
                        <div className="flex rounded-xl shadow-xs border border-slate-200 bg-white focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                          <select 
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="h-11 bg-transparent text-slate-800 border-none focus:ring-0 pl-3 pr-6 text-sm shrink-0 cursor-pointer outline-none font-medium"
                          >
                            <option value="+84">🇻🇳 +84</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+81">🇯🇵 +81</option>
                          </select>
                          <input 
                            className="w-full h-11 bg-transparent text-slate-900 border-none focus:ring-0 px-3 text-sm placeholder-slate-400 outline-none font-medium" 
                            name="phoneNumber" 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                          <div className="flex items-center pr-3">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">call</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-slate-500">Dùng để liên hệ trao đổi điểm hẹn và hỗ trợ trong chuyến đi.</p>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="block text-sm text-slate-800 font-bold">
                          Ngày sinh
                        </label>
                        <div className="relative">
                          <input 
                            className="input-field" 
                            name="birthDate" 
                            type="date" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                          />
                        </div>
                        <p className="text-[12px] text-slate-500">Phải từ 18 tuổi trở lên để thực hiện đặt tour độc lập.</p>
                      </div>

                      {/* Gender (Pill Radios) */}
                      <div className="space-y-2">
                        <label className="block text-sm text-slate-800 font-bold">
                          Giới tính
                        </label>
                        <div className="grid grid-cols-3 gap-3 h-11 items-center">
                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-bold ${
                            gender === 'male'
                              ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'male'} 
                              onChange={() => setGender('male')}
                              className="text-teal-700 focus:ring-teal-700 border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="male"
                            />
                            <span>Nam</span>
                          </label>

                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-bold ${
                            gender === 'female'
                              ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'female'} 
                              onChange={() => setGender('female')}
                              className="text-teal-700 focus:ring-teal-700 border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="female"
                            />
                            <span>Nữ</span>
                          </label>

                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-bold ${
                            gender === 'other'
                              ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'other'} 
                              onChange={() => setGender('other')}
                              className="text-teal-700 focus:ring-teal-700 border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="other"
                            />
                            <span>Khác</span>
                          </label>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <label className="block text-sm text-slate-800 font-bold">
                          Quốc tịch &amp; Ngôn ngữ giao tiếp
                        </label>
                        <div className="relative">
                          <select 
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            className="input-field pr-10 appearance-none cursor-pointer" 
                            name="nationality"
                          >
                            <option value="VN">Việt Nam (Tiếng Việt, Tiếng Anh)</option>
                            <option value="US">Hoa Kỳ (English)</option>
                            <option value="FR">Pháp (Français, English)</option>
                            <option value="KR">Hàn Quốc (한국어, English)</option>
                            <option value="JP">Nhật Bản (日本語, English)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-slate-400 text-[20px] pointer-events-none">translate</span>
                        </div>
                        <p className="text-[12px] text-slate-500">Giúp Local Helper giao tiếp bằng ngôn ngữ bạn thấy thoải mái nhất.</p>
                      </div>

                      {/* Address Field */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm text-slate-800 font-bold">
                          Địa chỉ nơi ở
                        </label>
                        <div className="relative">
                          <input 
                            className="input-field pl-11" 
                            name="address" 
                            placeholder="Nhập đường, quận/huyện, thành phố" 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[20px]">location_on</span>
                        </div>
                      </div>

                      {/* Short Bio Field */}
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm text-slate-800 font-bold">
                            Giới thiệu bản thân &amp; Phong cách du lịch
                          </label>
                          <span className="text-[11px] text-slate-400 font-semibold">{bio.length} / 300 ký tự</span>
                        </div>
                        <div className="relative">
                          <textarea 
                            className="w-full p-4 rounded-xl bg-white text-slate-900 border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm placeholder-slate-400 resize-none leading-relaxed outline-none font-medium" 
                            maxLength={300} 
                            name="bio" 
                            placeholder="Chia sẻ về sở thích khám phá, món ăn yêu thích hoặc những địa điểm bạn muốn trải nghiệm cùng người bản địa..." 
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                          />
                        </div>
                        <p className="text-[12px] text-slate-500">
                          Gợi ý: Chia sẻ sở thích cụ thể giúp Local Helper lên lịch trình cá nhân hóa hấp dẫn hơn.
                        </p>
                      </div>

                      {/* Local Helper Hourly Rate Section (Helper only) */}
                      {isHelper && (
                        <div className="space-y-3 md:col-span-2 p-5 rounded-2xl bg-teal-50/70 border border-teal-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-teal-700 text-xl">payments</span>
                              <label className="block text-sm text-slate-900 font-bold">
                                Mức giá mỗi giờ của Local Helper (VNĐ)
                              </label>
                            </div>
                            <span className="text-xs font-bold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-lg">
                              Đang áp dụng trên hệ thống
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Mức giá tính cho mỗi giờ hướng dẫn du khách. Tổng chi phí tour sẽ được tự động tính theo mức giá này.
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-[240px]">
                              <input
                                type="number"
                                step="10000"
                                min="10000"
                                max="50000000"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="w-full h-11 pl-4 pr-16 rounded-xl bg-white text-slate-900 font-bold text-base border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                              />
                              <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400">₫ / giờ</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[50000, 100000, 150000, 200000, 250000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setHourlyRate(preset)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                    Number(hourlyRate) === preset
                                      ? 'bg-teal-700 text-white border-teal-700'
                                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  {formatVND(preset).replace(' ₫', 'k')}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom Action Buttons Dock */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <span className="material-symbols-outlined text-[16px] text-teal-700">info</span>
                        <span>Thay đổi sẽ được đồng bộ ngay lập tức trên toàn hệ thống.</span>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => navigate(dashboardLink)}
                          className="btn-outline w-1/2 sm:w-auto" 
                          type="button"
                        >
                          Hủy
                        </button>
                        
                        <button 
                          disabled={isSaving}
                          className="btn-primary w-1/2 sm:w-auto" 
                          id="save-button" 
                          type="submit"
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Đang lưu...</span>
                            </>
                          ) : saveSuccess ? (
                            <>
                              <span className="material-symbols-outlined text-[18px]">done_all</span>
                              <span>Đã lưu!</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">check</span>
                              <span>Lưu thay đổi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {/* TAB 2: SECURITY & PASSWORD */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Đổi mật khẩu tài khoản</h3>
                    <p className="text-sm text-slate-500 mt-1">Thay đổi mật khẩu định kỳ giúp tăng cường tính bảo mật cho tài khoản của bạn.</p>
                  </div>

                  <form onSubmit={handleSubmitSecurity} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">Mật khẩu hiện tại</label>
                      <input 
                        type="password" 
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="input-field"
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary"
                      >
                        {isSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: NOTIFICATION SETTINGS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Cài đặt thông báo</h3>
                    <p className="text-sm text-slate-500 mt-1">Lựa chọn các loại thông báo và thông tin cập nhật bạn muốn nhận qua email hoặc hệ thống.</p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifBookings}
                        onChange={() => setNotifBookings(!notifBookings)}
                        className="w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-700 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Thông báo đặt tour &amp; cập nhật lịch trình</p>
                        <p className="text-xs text-slate-500 mt-0.5">Nhận thông báo ngay khi có yêu cầu đặt tour mới, thay đổi giờ hẹn hoặc hủy lịch.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifMessages}
                        onChange={() => setNotifMessages(!notifMessages)}
                        className="w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-700 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Tin nhắn trực tiếp</p>
                        <p className="text-xs text-slate-500 mt-0.5">Nhận thông báo khi có tin nhắn mới từ du khách hoặc Local Helper.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifPromos}
                        onChange={() => setNotifPromos(!notifPromos)}
                        className="w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-700 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Ưu đãi &amp; Khuyến mãi du lịch</p>
                        <p className="text-xs text-slate-500 mt-0.5">Nhận gợi ý tour chọn lọc và mã giảm giá theo mùa.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: LANGUAGE & CURRENCY */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Ngôn ngữ &amp; Tiền tệ ưu tiên</h3>
                    <p className="text-sm text-slate-500 mt-1">Cấu hình ngôn ngữ hiển thị mặc định và đơn vị tiền tệ khi duyệt LocalMate.</p>
                  </div>

                  <div className="space-y-5 max-w-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">Ngôn ngữ hiển thị</label>
                      <select 
                        value={prefLang}
                        onChange={(e) => setPrefLang(e.target.value)}
                        className="input-field cursor-pointer"
                      >
                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                        <option value="en">English (US)</option>
                        <option value="fr">Français (French)</option>
                        <option value="ja">日本語 (Japanese)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">Đơn vị tiền tệ</label>
                      <select 
                        value={prefCurrency}
                        onChange={(e) => setPrefCurrency(e.target.value)}
                        className="input-field cursor-pointer"
                      >
                        <option value="VND">VND (₫) - Đồng Việt Nam</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="JPY">JPY (¥) - Japanese Yen</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </section>

          </div>

        </div>
      </main>

      {/* BottomNavBar (Responsive for Mobile screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-white px-2 py-3 pb-safe shadow-lg border-t border-slate-200">
        <button 
          onClick={() => navigate('/')} 
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="text-[11px] font-semibold mt-0.5">Khám phá</span>
        </button>
        <button 
          onClick={() => navigate(dashboardLink)} 
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined">event_note</span>
          <span className="text-[11px] font-semibold mt-0.5">Lịch đặt</span>
        </button>
        <button 
          onClick={() => navigate('/chat')} 
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[11px] font-semibold mt-0.5">Tin nhắn</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center bg-teal-50 text-teal-800 rounded-full px-4 py-1 scale-95 font-bold"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="text-[11px] font-bold mt-0.5">Hồ sơ</span>
        </button>
      </nav>

    </div>
  );
}
