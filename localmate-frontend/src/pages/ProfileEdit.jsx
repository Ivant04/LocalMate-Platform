import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

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
  const [prefLang, setPrefLang] = useState('en');
  const [prefCurrency, setPrefCurrency] = useState('USD');

  // Helper hourly rate
  const [hourlyRate, setHourlyRate] = useState(15);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Personal profile synchronized successfully.');

  // Load user from localStorage and backend
  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert("Please sign in to view and edit your profile!");
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
      if (user.hourlyRate !== undefined) setHourlyRate(user.hourlyRate);
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
            if (freshUser.hourlyRate !== undefined) setHourlyRate(freshUser.hourlyRate);

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
        alert('File size exceeds the 50MB limit!');
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
      location: address || currentUser?.location || 'Vietnam',
      hourlyRate: Number(hourlyRate) || 15,
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
        let errorMsg = 'Failed to update personal profile!';
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
      setToastMessage('Personal profile saved successfully to database!');

      setTimeout(() => setSaveSuccess(false), 2500);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      setIsSaving(false);
      alert('Failed to save profile: ' + err.message);
    }
  };

  // Submit Password Change
  const handleSubmitSecurity = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Please enter your current password!');
      return;
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Confirmation password does not match!');
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
        throw new Error(data.message || 'Password update failed!');
      }

      setIsSaving(false);
      setSaveSuccess(true);
      setShowToast(true);
      setToastMessage('Account password updated successfully!');
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
  const roleLabel = isHelper ? 'Local Helper Profile' : 'Traveler Explorer';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-cyan-700 selection:text-white">
      
      {/* SideNavBar - Desktop Only */}
      <aside className="hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] py-6 overflow-y-auto bg-white border-r border-slate-200 w-64 shadow-sm shrink-0">

        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <img 
              alt={fullName} 
              className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200" 
              src={avatarUrl} 
            />
            <div className="min-w-0">
              <p className="font-label-bold text-label-bold text-slate-800 truncate font-semibold">{fullName}</p>
              <p className="font-body-sm text-xs text-slate-500 truncate">{roleLabel}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(dashboardLink)}
            className="mt-3 w-full py-2 px-4 rounded-lg bg-cyan-50 text-[#0E7490] border border-cyan-100 font-label-bold text-xs hover:bg-cyan-100 transition-all font-semibold"
          >
            Back to Dashboard
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          <button 
            onClick={() => navigate(dashboardLink)}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">dashboard</span>
            <span className="font-label-bold text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate(dashboardLink)}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">calendar_today</span>
            <span className="font-label-bold text-sm">Bookings</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chat_bubble</span>
            <span className="font-label-bold text-sm">Messages</span>
          </button>
          {isHelper && (
            <button 
              onClick={() => navigate('/reviews')}
              className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">stars</span>
              <span className="font-label-bold text-sm">Reviews</span>
            </button>
          )}
          {/* Active Profile Item */}
          <button 
            className="w-full bg-cyan-50 text-[#0E7490] border border-cyan-100/60 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all text-left font-semibold"
          >
            <span className="material-symbols-outlined text-[#0E7490] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="font-label-bold text-sm">Profile</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4 px-2">
          <button 
            onClick={() => setActiveTab('security')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">settings</span>
            <span className="font-label-bold text-sm">Settings</span>
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 transition-all text-left"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">help_outline</span>
            <span className="font-label-bold text-sm">Help</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 min-h-screen overflow-y-auto relative bg-[#F8FAFC]">
        <div className="p-6 md:p-10 max-w-[1280px] mx-auto w-full space-y-8">
          
          {/* Toast Alert Banner */}
          {showToast && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 shadow-sm transition-all duration-300 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-teal-900 font-semibold">Information updated successfully!</p>
                  <p className="font-body-sm text-body-sm text-teal-700">{toastMessage}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowToast(false)}
                className="text-teal-600 hover:text-teal-900 p-1 rounded-lg transition-colors" 
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          )}

          {/* Header & Breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 mb-2 font-label-caps text-label-caps text-slate-400 uppercase tracking-wider text-xs">
                <span className="cursor-pointer hover:underline" onClick={() => navigate(dashboardLink)}>Account Settings</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#0E7490] font-bold">Personal Profile</span>
              </nav>
              <h1 className="font-headline-lg text-2xl md:text-3xl text-slate-900 font-bold">Edit Personal Profile</h1>
              <p className="font-body-md text-sm text-slate-500 mt-1">
                Manage and update your personal details for a safe, verified, and personalized experience on LocalMate.
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
                    className="text-teal-600 transition-all duration-700" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeDasharray={`${completionPercentage}, 100`} 
                    strokeLinecap="round" 
                    strokeWidth="3.2"
                  />
                </svg>
                <span className="absolute font-label-bold text-[11px] text-slate-800 font-bold">{completionPercentage}%</span>
              </div>
              <div className="leading-tight">
                <p className="font-label-bold text-xs text-slate-900 font-bold">Completion Level</p>
                <p className="font-body-sm text-[12px] text-teal-600 font-semibold">
                  {completionPercentage >= 80 ? 'Very Good (Almost Complete)' : 'Needs more details'}
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold text-sm shadow-sm shrink-0 transition-all text-left w-full ${
                  activeTab === 'basic' 
                    ? 'bg-[#0E7490] text-white font-semibold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'basic' ? "'FILL' 1" : "'FILL' 0" }}>badge</span>
                <span>Basic Information</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold text-sm shadow-sm shrink-0 transition-all text-left w-full ${
                  activeTab === 'security' 
                    ? 'bg-[#0E7490] text-white font-semibold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                <span>Security & Password</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold text-sm shadow-sm shrink-0 transition-all text-left w-full ${
                  activeTab === 'notifications' 
                    ? 'bg-[#0E7490] text-white font-semibold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                <span>Notification Settings</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold text-sm shadow-sm shrink-0 transition-all text-left w-full ${
                  activeTab === 'preferences' 
                    ? 'bg-[#0E7490] text-white font-semibold' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                <span>Language & Currency</span>
              </button>

              {/* Identity Verification Badge Card */}
              <div className="hidden lg:flex flex-col mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-teal-700 mb-2">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="font-label-bold text-sm font-semibold">Verified Account</span>
                </div>
                <p className="font-body-sm text-[13px] text-slate-500 leading-relaxed">
                  Your government-issued ID and passport were verified on Jan 12, 2025.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  Badge: {roleLabel}
                </div>
              </div>
            </aside>

            {/* Main Content Area Based on Active Tab */}
            <section className="lg:col-span-9 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8 min-w-0 max-w-full overflow-hidden">
              
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
                      <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1.5 rounded-full shadow-md flex items-center justify-center ring-2 ring-white" title="Profile Verified">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-[#0E7490] text-xs font-semibold tracking-wide flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                          {roleLabel}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold tracking-wide flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Identity Verified
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E7490] hover:bg-cyan-800 text-white font-label-bold text-sm shadow-sm transition-all" htmlFor="avatar-input">
                          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                          <span>Change Photo</span>
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
                          className="px-3 py-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 font-label-bold text-sm transition-all flex items-center gap-1" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span>Remove</span>
                        </button>
                      </div>
                      
                      <p className="font-body-sm text-[12px] text-slate-400 mt-3 leading-normal">
                        Supports JPG, PNG, or WEBP. Max file size 50MB. Recommended resolution 400x400px.
                      </p>
                    </div>
                  </div>

                  {/* 2. Form Fields Grid */}
                  <form onSubmit={handleSubmitProfile} className="space-y-6" id="profile-edit-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                          Full Name <span className="text-amber-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full h-12 px-4 rounded-xl bg-white text-slate-900 border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all text-sm placeholder-slate-400 outline-none" 
                            name="fullName" 
                            placeholder="Enter your full name" 
                            required 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute right-3.5 top-3 text-slate-400 text-[20px]">person</span>
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">This name will be displayed publicly on booking requests and profile.</p>
                      </div>

                      {/* Email Address (Verified & Readonly) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                            Email Address <span className="text-amber-500">*</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Verified
                          </span>
                        </div>
                        <div className="relative">
                          <input 
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 text-sm cursor-not-allowed outline-none" 
                            name="email" 
                            readOnly 
                            type="email" 
                            value={email}
                          />
                          <span className="material-symbols-outlined absolute right-3.5 top-3 text-teal-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">Email used for signing in and trip notifications.</p>
                      </div>

                      {/* Phone Number with Country Code */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                            Phone Number <span className="text-amber-500">*</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            Valid Number
                          </span>
                        </div>
                        <div className="flex rounded-xl shadow-sm border border-slate-300 bg-white focus-within:border-[#0E7490] focus-within:ring-2 focus-within:ring-[#0E7490]/20 transition-all">
                          <select 
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="h-12 bg-transparent text-slate-800 border-none focus:ring-0 pl-3 pr-6 text-sm shrink-0 cursor-pointer outline-none"
                          >
                            <option value="+84">🇻🇳 +84</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+81">🇯🇵 +81</option>
                          </select>
                          <input 
                            className="w-full h-12 bg-transparent text-slate-900 border-none focus:ring-0 px-3 text-sm placeholder-slate-400 outline-none" 
                            name="phoneNumber" 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                          <div className="flex items-center pr-3">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">call</span>
                          </div>
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">Used by local helpers to coordinate tour logistics and meeting points.</p>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full h-12 px-4 rounded-xl bg-white text-slate-900 border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all text-sm outline-none" 
                            name="birthDate" 
                            type="date" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                          />
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">Must be at least 18 years old to make independent tour bookings.</p>
                      </div>

                      {/* Gender (Pill Radios) */}
                      <div className="space-y-2">
                        <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                          Gender
                        </label>
                        <div className="grid grid-cols-3 gap-3 h-12 items-center">
                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-semibold ${
                            gender === 'male'
                              ? 'border-[#0E7490] bg-cyan-50 text-[#0E7490] shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'male'} 
                              onChange={() => setGender('male')}
                              className="text-[#0E7490] focus:ring-[#0E7490] border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="male"
                            />
                            <span>Male</span>
                          </label>

                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-semibold ${
                            gender === 'female'
                              ? 'border-[#0E7490] bg-cyan-50 text-[#0E7490] shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'female'} 
                              onChange={() => setGender('female')}
                              className="text-[#0E7490] focus:ring-[#0E7490] border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="female"
                            />
                            <span>Female</span>
                          </label>

                          <label className={`flex items-center justify-center gap-2 h-full rounded-xl cursor-pointer border transition-all text-sm font-semibold ${
                            gender === 'other'
                              ? 'border-[#0E7490] bg-cyan-50 text-[#0E7490] shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input 
                              checked={gender === 'other'} 
                              onChange={() => setGender('other')}
                              className="text-[#0E7490] focus:ring-[#0E7490] border-slate-300" 
                              name="gender" 
                              type="radio" 
                              value="other"
                            />
                            <span>Other</span>
                          </label>
                        </div>
                      </div>

                      {/* Nationality / Preferred Languages */}
                      <div className="space-y-2">
                        <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                          Nationality & Preferred Languages
                        </label>
                        <div className="relative">
                          <select 
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-white text-slate-900 border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all text-sm pr-10 appearance-none cursor-pointer outline-none" 
                            name="nationality"
                          >
                            <option value="VN">Vietnam (Vietnamese, English)</option>
                            <option value="US">United States (English)</option>
                            <option value="FR">France (Français, English)</option>
                            <option value="KR">South Korea (한국어, English)</option>
                            <option value="JP">Japan (日本語, English)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-3 text-slate-400 text-[20px] pointer-events-none">translate</span>
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">Helps local guides communicate in your preferred languages.</p>
                      </div>

                      {/* Address Field (Full span) */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                          Residential Address
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full h-12 px-4 rounded-xl bg-white text-slate-900 border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all text-sm placeholder-slate-400 pl-11 outline-none" 
                            name="address" 
                            placeholder="Enter street address, district, city" 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">location_on</span>
                        </div>
                      </div>

                      {/* Short Bio Field (Full span) */}
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-label-bold text-sm text-slate-800 font-semibold">
                            About You (Bio / Travel Interests)
                          </label>
                          <span className="font-label-caps text-[11px] text-slate-400">{bio.length} / 300 characters</span>
                        </div>
                        <div className="relative">
                          <textarea 
                            className="w-full p-4 rounded-xl bg-white text-slate-900 border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all text-sm placeholder-slate-400 resize-none leading-relaxed outline-none" 
                            maxLength={300} 
                            name="bio" 
                            placeholder="Share a little about your travel style, favorite cuisines, or hidden gems you want to discover with local companions..." 
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                          />
                        </div>
                        <p className="font-body-sm text-[12px] text-slate-500">
                          Tip: Sharing specific interests helps Local Mates curate personalized itineraries.
                        </p>
                      </div>

                      {/* Local Helper Hourly Rate Section (Helper only) */}
                      {isHelper && (
                        <div className="space-y-3 md:col-span-2 p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#0E7490] text-xl">payments</span>
                              <label className="block font-label-bold text-sm text-slate-900 font-bold">
                                Local Helper Hourly Rate (USD)
                              </label>
                            </div>
                            <span className="text-xs font-bold text-[#0E7490] bg-cyan-100/70 px-2.5 py-1 rounded-lg">
                              Live on Explore & Search
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Set your hourly rate for guiding and accompanying travelers. Booking totals are calculated from this rate.
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-[200px]">
                              <span className="absolute left-3.5 top-3 font-bold text-lg text-[#0E7490]">$</span>
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="w-full h-12 pl-8 pr-14 rounded-xl bg-white text-slate-900 font-bold text-base border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all outline-none"
                              />
                              <span className="absolute right-3.5 top-3.5 text-xs font-semibold text-slate-400">/ hour</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[10, 12, 15, 20, 25].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setHourlyRate(preset)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    Number(hourlyRate) === preset
                                      ? 'bg-[#0E7490] text-white border-[#0E7490]'
                                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  ${preset}
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
                        <span className="material-symbols-outlined text-[16px] text-teal-600">info</span>
                        <span>Changes will be synchronized across the platform immediately.</span>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => navigate(dashboardLink)}
                          className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-label-bold text-sm transition-all" 
                          type="button"
                        >
                          Cancel
                        </button>
                        
                        <button 
                          disabled={isSaving}
                          className={`w-1/2 sm:w-auto px-7 py-2.5 rounded-xl text-white font-label-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            saveSuccess 
                              ? 'bg-teal-600 shadow-teal-900/10' 
                              : 'bg-[#0E7490] hover:bg-cyan-800 shadow-cyan-900/10'
                          }`} 
                          id="save-button" 
                          type="submit"
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Saving...</span>
                            </>
                          ) : saveSuccess ? (
                            <>
                              <span className="material-symbols-outlined text-[18px]">done_all</span>
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">check</span>
                              <span>Save Changes</span>
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
                    <h3 className="font-headline-md text-xl font-bold text-slate-900">Change Account Password</h3>
                    <p className="text-sm text-slate-500 mt-1">Updating your password regularly helps enhance account security.</p>
                  </div>

                  <form onSubmit={handleSubmitSecurity} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 text-sm outline-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-[#0E7490] text-white font-semibold text-sm hover:bg-cyan-800 transition-all flex items-center gap-2 shadow-sm"
                      >
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: NOTIFICATION SETTINGS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="font-headline-md text-xl font-bold text-slate-900">Notification Preferences</h3>
                    <p className="text-sm text-slate-500 mt-1">Choose which updates and alerts you wish to receive via email or SMS.</p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifBookings}
                        onChange={() => setNotifBookings(!notifBookings)}
                        className="w-5 h-5 rounded border-slate-300 text-[#0E7490] focus:ring-[#0E7490] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Tour Bookings & Itinerary Updates</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive instant email notifications for new bookings, schedule changes, or cancellations.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifMessages}
                        onChange={() => setNotifMessages(!notifMessages)}
                        className="w-5 h-5 rounded border-slate-300 text-[#0E7490] focus:ring-[#0E7490] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Direct Messages from Companions</p>
                        <p className="text-xs text-slate-500 mt-0.5">Get notified when receiving new chat messages from travelers or guides.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={notifPromos}
                        onChange={() => setNotifPromos(!notifPromos)}
                        className="w-5 h-5 rounded border-slate-300 text-[#0E7490] focus:ring-[#0E7490] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Special Offers & Travel Deals</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive handpicked recommendations and seasonal promotional discounts.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: LANGUAGE & CURRENCY */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="font-headline-md text-xl font-bold text-slate-900">Language & Currency Preferences</h3>
                    <p className="text-sm text-slate-500 mt-1">Configure default display language and currency format when browsing LocalMate.</p>
                  </div>

                  <div className="space-y-5 max-w-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">Display Language</label>
                      <select 
                        value={prefLang}
                        onChange={(e) => setPrefLang(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 text-sm outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                        <option value="fr">Français (French)</option>
                        <option value="ja">日本語 (Japanese)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">Preferred Currency</label>
                      <select 
                        value={prefCurrency}
                        onChange={(e) => setPrefCurrency(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 text-sm outline-none"
                      >
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="VND">VND (₫) - Vietnamese Dong</option>
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
          <span className="text-[11px] font-semibold mt-0.5">Explore</span>
        </button>
        <button 
          onClick={() => navigate(dashboardLink)} 
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined">event_note</span>
          <span className="text-[11px] font-semibold mt-0.5">Bookings</span>
        </button>
        <button 
          onClick={() => navigate('/chat')} 
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 px-4 py-1"
        >
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[11px] font-semibold mt-0.5">Chat</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center bg-cyan-50 text-[#0E7490] rounded-full px-4 py-1 scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="text-[11px] font-semibold mt-0.5">Profile</span>
        </button>
      </nav>

    </div>
  );
}
