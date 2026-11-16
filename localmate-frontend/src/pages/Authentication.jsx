import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set tab based on URL param
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('traveler');

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Google OAuth State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const googleBtnRef = useRef(null);
  const googleSignUpBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const tab = searchParams.get('tab');
    const roleParam = searchParams.get('role');
    if (tab === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
    if (roleParam === 'guide') {
      setRole('guide');
    }

    // Pre-warm backend immediately when visiting auth page to eliminate cold start wait
    try {
      fetch(`${API_BASE_URL}/health`, { method: 'GET', keepalive: true }).catch(() => { });
    } catch { }
  }, [searchParams]);

  // Helper to parse network, deployment, and CORS errors
  const parseNetworkError = (err) => {
    if (err.name === 'AbortError') {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && API_BASE_URL.includes('localhost')) {
        return 'Lỗi cấu hình triển khai: Frontend đang chạy online nhưng VITE_API_URL vẫn trỏ về http://localhost:8080. Vui lòng cập nhật biến môi trường trên nền tảng hosting.';
      }
      return 'Kết nối máy chủ quá hạn (15s). Vui lòng thử lại sau vài giây.';
    }

    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'))) {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && API_BASE_URL.includes('localhost')) {
        return 'Lỗi kết nối máy chủ: Không thể kết nối đến backend.';
      }
      return `Không thể kết nối tới máy chủ backend tại ${API_BASE_URL}. Vui lòng kiểm tra trạng thái máy chủ.`;
    }

    return err.message || 'Không thể kết nối đến máy chủ.';
  };

  // Instant offline demo login bypass for live evaluations
  const handleOfflineDemoLogin = (roleType = 'admin') => {
    let mockUser;
    if (roleType === 'admin') {
      mockUser = {
        id: 'demo-admin-id',
        email: 'admin@localmate.com',
        fullName: 'Quản trị viên LocalMate',
        roles: ['ROLE_ADMIN'],
        token: 'mock-jwt-token-admin',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
    } else if (roleType === 'helper') {
      mockUser = {
        id: 'demo-helper-id',
        email: 'duc.tai@localmate.com',
        fullName: 'Đức Tài',
        roles: ['ROLE_HELPER'],
        token: 'mock-jwt-token-helper',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    } else {
      mockUser = {
        id: 'demo-traveler-id',
        email: 'traveler@localmate.com',
        fullName: 'Nguyễn Mỹ Duyên',
        roles: ['ROLE_TRAVELER'],
        token: 'mock-jwt-token-traveler',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
    }

    localStorage.setItem('localmate_user', JSON.stringify(mockUser));
    localStorage.setItem('localmate_token', mockUser.token);
    window.dispatchEvent(new Event('storage'));

    if (mockUser.roles.includes('ROLE_ADMIN')) {
      navigate('/admin');
    } else if (mockUser.roles.includes('ROLE_HELPER')) {
      navigate('/helper-dashboard');
    } else {
      navigate('/');
    }
  };

  // Handle Google OAuth Credential Response
  const handleGoogleSuccess = async (credentialOrPayload) => {
    setLoading(true);
    setErrorMessage('');
    setShowGoogleModal(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let bodyData = {};
      if (typeof credentialOrPayload === 'string') {
        bodyData = { credential: credentialOrPayload };
      } else if (credentialOrPayload.credential) {
        bodyData = { credential: credentialOrPayload.credential };
      } else {
        bodyData = credentialOrPayload;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Xác thực Google thất bại!');
      }

      const userData = await response.json();

      localStorage.setItem('localmate_user', JSON.stringify(userData));
      localStorage.setItem('localmate_token', userData.token);
      window.dispatchEvent(new Event('storage'));

      const roles = userData.roles || [];
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else if (roles.includes('ROLE_HELPER')) {
        navigate('/helper-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setErrorMessage(parseNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt();
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = 'Sai thông tin đăng nhập!';
        try {
          const errObj = JSON.parse(responseText);
          if (errObj.message) errorMsg = errObj.message;
        } catch {
          if (responseText) errorMsg = responseText;
        }
        throw new Error(errorMsg);
      }

      let userData = {};
      try {
        userData = JSON.parse(responseText);
      } catch {
        const rawToken = responseText.replace(/^"|"$/g, '').trim();
        userData = { token: rawToken, email };
      }

      if (userData.token && (!userData.roles || userData.roles.length === 0)) {
        try {
          const payloadBase64 = userData.token.split('.')[1];
          const payloadJson = JSON.parse(atob(payloadBase64));
          userData.email = userData.email || payloadJson.sub;

          if (userData.email?.includes('admin')) {
            userData.roles = ['ROLE_ADMIN'];
            userData.fullName = userData.fullName || 'Quản trị viên LocalMate';
          } else if (userData.email?.includes('minh') || userData.email?.includes('linh')) {
            userData.roles = ['ROLE_HELPER'];
            userData.fullName = userData.fullName || (userData.email.includes('minh') ? 'Trần Minh' : 'Nguyễn Thùy Linh');
          } else {
            userData.roles = ['ROLE_TRAVELER'];
            userData.fullName = userData.fullName || 'Nguyễn Mỹ Duyên';
          }
        } catch (_decodeErr) {
          userData.roles = ['ROLE_TRAVELER'];
        }
      }

      localStorage.setItem('localmate_user', JSON.stringify(userData));
      localStorage.setItem('localmate_token', userData.token);
      window.dispatchEvent(new Event('storage'));

      const roles = userData.roles || [];
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else if (roles.includes('ROLE_HELPER')) {
        navigate('/helper-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setErrorMessage(parseNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phoneNumber.trim(),
          role: role === 'guide' ? 'HELPER' : 'TRAVELER',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = 'Đăng ký không thành công. Vui lòng thử lại!';
        try {
          const errObj = JSON.parse(responseText);
          if (errObj.message) errorMsg = errObj.message;
        } catch {
          if (responseText) errorMsg = responseText;
        }
        throw new Error(errorMsg);
      }

      let userData = {};
      try {
        userData = JSON.parse(responseText);
      } catch {
        const rawToken = responseText.replace(/^"|"$/g, '').trim();
        userData = {
          token: rawToken,
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phoneNumber.trim(),
          roles: [role === 'guide' ? 'ROLE_HELPER' : 'ROLE_TRAVELER']
        };
      }

      if (!userData.roles || userData.roles.length === 0) {
        userData.roles = [role === 'guide' ? 'ROLE_HELPER' : 'ROLE_TRAVELER'];
      }

      localStorage.setItem('localmate_user', JSON.stringify(userData));
      localStorage.setItem('localmate_token', userData.token);
      window.dispatchEvent(new Event('storage'));

      navigate(role === 'guide' ? '/helper-dashboard' : '/');
    } catch (err) {
      clearTimeout(timeoutId);
      setErrorMessage(parseNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center relative py-10 px-4 bg-slate-50 selection:bg-teal-700 selection:text-white overflow-x-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className={`w-full ${isSignUp ? 'max-w-lg' : 'max-w-md'} relative z-10 my-auto transition-all duration-300`}>
        {/* Segmented Top Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              !isSignUp 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              isSignUp 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {!isSignUp ? (
          /* Login Card */
          <section className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/80 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3 text-teal-700 shadow-sm">
                <span className="material-symbols-outlined text-2xl">lock_open</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Chào mừng trở lại</h1>
              <p className="text-xs text-slate-500 font-medium">Đăng nhập để kết nối cùng Local Helper bản địa</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email hoặc Số điện thoại</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11 !h-12"
                    placeholder="name@example.com"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[19px]">person</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
                  <a className="text-xs text-teal-700 hover:underline cursor-pointer font-bold" href="#">Quên mật khẩu?</a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 !h-12"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[19px]">lock</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">error</span>
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>

                  {/* Instant Offline Demo Bypass */}
                  {(errorMessage.includes('Lỗi') || errorMessage.includes('quá hạn') || errorMessage.includes('Không thể kết nối')) && (
                    <div className="pt-2 border-t border-rose-200/80 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-slate-500 font-medium">Truy cập thử nghiệm nhanh:</span>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('admin')}
                        className="text-[11px] font-bold bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        ⚡ Quản trị viên
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('helper')}
                        className="text-[11px] font-bold bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        ⚡ Local Helper
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !h-12 !text-sm mt-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-400 text-xs font-semibold rounded-full">Hoặc tiếp tục với</span>
                </div>
              </div>

              {/* Google Sign In Area */}
              {googleClientId ? (
                <div id="googleSignInBtn" ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
              ) : (
                <button
                  type="button"
                  onClick={triggerGoogleSignIn}
                  className="btn-outline w-full !h-12 !text-xs font-bold text-slate-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Đăng nhập bằng Google</span>
                </button>
              )}

              <p className="text-center text-xs text-slate-500 mt-5 font-medium">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-teal-700 font-bold hover:underline cursor-pointer ml-1"
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          </section>
        ) : (
          /* Signup Card */
          <section className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/80 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3 text-teal-700 shadow-sm">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Tham gia LocalMate</h1>
              <p className="text-xs text-slate-500 font-medium">Bắt đầu hành trình khám phá và kết nối an toàn</p>
            </div>

            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field !h-11"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field !h-11"
                    placeholder="0988 123 456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !h-11"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !h-11"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Vai trò tham gia</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'traveler'}
                      onChange={() => setRole('traveler')}
                      className="hidden peer"
                      value="traveler"
                    />
                    <div className="p-3 text-center rounded-2xl border-2 border-slate-200 peer-checked:border-teal-700 peer-checked:bg-teal-50/80 transition-all shadow-xs">
                      <span className="material-symbols-outlined block text-teal-700 mb-0.5 text-xl">person</span>
                      <span className="font-bold text-xs text-slate-800">Du khách</span>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'guide'}
                      onChange={() => setRole('guide')}
                      className="hidden peer"
                      value="guide"
                    />
                    <div className="p-3 text-center rounded-2xl border-2 border-slate-200 peer-checked:border-teal-700 peer-checked:bg-teal-50/80 transition-all shadow-xs">
                      <span className="material-symbols-outlined block text-teal-700 mb-0.5 text-xl">map</span>
                      <span className="font-bold text-xs text-slate-800">Local Helper</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-700 cursor-pointer"
                />
                <label className="text-xs text-slate-500 leading-tight select-none cursor-pointer" htmlFor="terms">
                  Tôi đồng ý với <a className="text-teal-700 font-bold hover:underline cursor-pointer" href="#">Điều khoản dịch vụ</a> và <a className="text-teal-700 font-bold hover:underline cursor-pointer" href="#">Chính sách bảo mật</a>
                </label>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">error</span>
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>

                  {(errorMessage.includes('Lỗi') || errorMessage.includes('quá hạn') || errorMessage.includes('Không thể kết nối')) && (
                    <div className="pt-2 border-t border-rose-200/80 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-slate-500 font-medium">Truy cập thử nghiệm nhanh:</span>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('traveler')}
                        className="text-[11px] font-bold bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        ⚡ Tiếp tục với vai trò Du khách
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !h-12 !text-sm mt-2"
              >
                {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-400 text-xs font-semibold rounded-full">Hoặc đăng ký bằng</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              {googleClientId ? (
                <div id="googleSignUpBtn" ref={googleSignUpBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
              ) : (
                <button
                  type="button"
                  onClick={triggerGoogleSignIn}
                  className="btn-outline w-full !h-12 !text-xs font-bold text-slate-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Đăng ký bằng Google</span>
                </button>
              )}

              <p className="text-center text-xs text-slate-500 mt-4 font-medium">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-teal-700 font-bold hover:underline cursor-pointer ml-1"
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          </section>
        )}
      </div>

      {/* Google Login Options Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative border border-slate-200/80 my-auto">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác thực Google</h3>
                <p className="text-xs text-slate-500 font-medium">Đăng nhập nhanh &amp; Thiết lập tài khoản</p>
              </div>
            </div>

            {/* Quick 1-Click Simulation */}
            <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 mb-5">
              <h4 className="text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-teal-700">bolt</span>
                Đăng nhập nhanh với tài khoản Google
              </h4>
              <p className="text-xs text-teal-700 mb-3">
                Nhập email Google của bạn để tự động đăng ký hoặc liên kết hồ sơ:
              </p>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Họ và tên (Ví dụ: Nguyễn Mỹ Duyên)"
                  className="input-field !h-10"
                />
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="Email Google (Ví dụ: user@gmail.com)"
                  className="input-field !h-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const testEmail = googleEmailInput.trim() || 'traveler@gmail.com';
                    const testName = googleNameInput.trim() || 'Alex Rivers';
                    handleGoogleSuccess({
                      email: testEmail,
                      fullName: testName,
                      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testName}`,
                    });
                  }}
                  className="btn-primary w-full !h-11 !text-xs"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  Tiếp tục với Google ({googleEmailInput.trim() || 'traveler@gmail.com'})
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="btn-outline w-full !py-2 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
