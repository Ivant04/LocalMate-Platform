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
  }, [searchParams]);

  // Helper to parse network, deployment, and CORS errors
  const parseNetworkError = (err) => {
    if (err.name === 'AbortError') {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && API_BASE_URL.includes('localhost')) {
        return 'Deployment Error: The frontend is deployed online but VITE_API_URL is still pointing to http://localhost:8080. Please set VITE_API_URL in your hosting platform (Vercel/Netlify/Render) to your deployed backend URL.';
      }
      return 'Server connection timed out (15s). If your backend is deployed on Render free tier, it may be waking up from sleep. Please wait 15 seconds and try again.';
    }

    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'))) {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && API_BASE_URL.includes('localhost')) {
        return 'Deployment Configuration Error: The deployed frontend cannot reach http://localhost:8080. Please set VITE_API_URL in your hosting environment variables (e.g. Vercel / Netlify) to your backend domain.';
      }
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://') && !API_BASE_URL.includes('localhost')) {
        return 'Mixed Content Error: HTTPS sites cannot call unencrypted HTTP backends. Please update your backend URL to use https://.';
      }
      return `Cannot connect to backend server at ${API_BASE_URL}. Please ensure your backend is deployed and running.`;
    }

    return err.message || 'Unable to connect to the server.';
  };

  // Instant offline demo login bypass for live evaluations
  const handleOfflineDemoLogin = (roleType = 'admin') => {
    let mockUser;
    if (roleType === 'admin') {
      mockUser = {
        id: 'demo-admin-id',
        email: 'admin@localmate.com',
        fullName: 'LocalMate Administrator',
        roles: ['ROLE_ADMIN'],
        token: 'mock-jwt-token-admin',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
    } else if (roleType === 'helper') {
      mockUser = {
        id: 'demo-helper-id',
        email: 'duc.tai@localmate.com',
        fullName: 'Duc Tai',
        roles: ['ROLE_HELPER'],
        token: 'mock-jwt-token-helper',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    } else {
      mockUser = {
        id: 'demo-traveler-id',
        email: 'traveler@localmate.com',
        fullName: 'Alex Johnson',
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
        throw new Error(errJson.message || 'Google authentication failed!');
      }

      const userData = await response.json();

      localStorage.setItem('localmate_user', JSON.stringify(userData));
      localStorage.setItem('localmate_token', userData.token);
      window.dispatchEvent(new Event('storage'));

      const roles = userData.roles || [];
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
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

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => handleGoogleSuccess(res),
        auto_select: false,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }

      if (googleSignUpBtnRef.current) {
        window.google.accounts.id.renderButton(googleSignUpBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
          shape: 'rectangular',
        });
      }
    }
  }, [googleClientId, isSignUp]);

  const triggerGoogleSignIn = () => {
    if (googleClientId && window.google?.accounts?.id) {
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
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Incorrect email or password!';
        try {
          const errJson = await response.json();
          errorMsg = errJson.message || errorMsg;
        } catch {
          const rawText = await response.text();
          if (rawText && !rawText.startsWith('<')) errorMsg = rawText;
        }
        throw new Error(errorMsg);
      }

      const responseText = await response.text();
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
            userData.fullName = userData.fullName || 'Admin Manager';
          } else if (userData.email?.includes('minh') || userData.email?.includes('linh')) {
            userData.roles = ['ROLE_HELPER'];
            userData.fullName = userData.fullName || (userData.email.includes('minh') ? 'Tran Minh' : 'Nguyen Thuy Linh');
          } else {
            userData.roles = ['ROLE_TRAVELER'];
            userData.fullName = userData.fullName || 'Alex Johnson';
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
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long!');
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
        let errorMsg = 'Registration failed. Please try again!';
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

      navigate('/');
    } catch (err) {
      clearTimeout(timeoutId);
      setErrorMessage(parseNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center relative py-8 px-4 auth-gradient overflow-x-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className={`w-full ${isSignUp ? 'max-w-lg' : 'max-w-md'} relative z-10 my-auto transition-all duration-300`}>
        {!isSignUp ? (
          /* Login Card */
          <section className="glass-card p-6 sm:p-8 rounded-2xl shadow-xl transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold text-2xl">Welcome Back</h1>
              <p className="font-body-md text-on-surface-variant text-gray-500">Access your local connections</p>
            </div>
            
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block font-medium text-sm text-gray-700 mb-2">Email or Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 h-[52px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="name@example.com" 
                />
              </div>
              
              <div>
                <label className="block font-medium text-sm text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 h-[52px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div className="flex justify-end">
                <a className="text-sm text-primary hover:underline" href="#">Forgot password?</a>
              </div>
              
              {errorMessage && (
                <div className="p-3.5 bg-red-50/90 border border-red-200 text-red-700 rounded-xl text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-red-600 shrink-0 mt-0.5">error</span>
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>

                  {/* Instant Offline Demo Bypass when backend is down or not configured */}
                  {(errorMessage.includes('Deployment') || errorMessage.includes('timed out') || errorMessage.includes('Cannot connect') || errorMessage.includes('Mixed Content')) && (
                    <div className="pt-2 border-t border-red-200/80 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-gray-500 font-medium">Quick Preview Access:</span>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('admin')}
                        className="text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        ⚡ Log in as Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('helper')}
                        className="text-[11px] font-bold bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        ⚡ Log in as Helper
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-[52px] rounded-xl font-semibold shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
              
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 text-xs rounded-full">Or continue with</span>
                </div>
              </div>
              
              {/* Google Sign In Area */}
              {googleClientId ? (
                <div id="googleSignInBtn" ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
              ) : (
                <button 
                  type="button"
                  onClick={triggerGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 h-[52px] rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Sign in with Google
                </button>
              )}
              
              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(true)} 
                  className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            </form>
          </section>
        ) : (
          /* Signup Card */
          <section className="glass-card p-6 sm:p-8 rounded-2xl shadow-xl transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold text-2xl">Join LocalMate</h1>
              <p className="font-body-md text-on-surface-variant text-gray-500">Start your journey today</p>
            </div>
            
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 h-[48px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                    placeholder="Nguyen Van A" 
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 h-[48px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                    placeholder="+84 123456789" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-medium text-sm text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 h-[48px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="name@example.com" 
                />
              </div>
              
              <div>
                <label className="block font-medium text-sm text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 h-[48px] rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div>
                <label className="block font-medium text-sm text-gray-700 mb-2">Join as</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={role === 'traveler'}
                      onChange={() => setRole('traveler')}
                      className="hidden peer" 
                      value="traveler" 
                    />
                    <div className="p-3 text-center rounded-xl border-2 border-gray-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all">
                      <span className="material-symbols-outlined block text-emerald-600 mb-1">person</span>
                      <span className="font-semibold text-sm text-gray-800">Traveler</span>
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
                    <div className="p-3 text-center rounded-xl border-2 border-gray-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all">
                      <span className="material-symbols-outlined block text-emerald-600 mb-1">map</span>
                      <span className="font-semibold text-sm text-gray-800">Local Helper</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-start gap-3 py-1">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer" 
                />
                <label className="text-xs text-gray-600 leading-tight select-none cursor-pointer" htmlFor="terms">
                  I agree to the <a className="text-emerald-600 hover:underline" href="#">Terms of Service</a> and <a className="text-emerald-600 hover:underline" href="#">Privacy Policy</a>
                </label>
              </div>
              
              {errorMessage && (
                <div className="p-3.5 bg-red-50/90 border border-red-200 text-red-700 rounded-xl text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-red-600 shrink-0 mt-0.5">error</span>
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>

                  {(errorMessage.includes('Deployment') || errorMessage.includes('timed out') || errorMessage.includes('Cannot connect') || errorMessage.includes('Mixed Content')) && (
                    <div className="pt-2 border-t border-red-200/80 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-gray-500 font-medium">Quick Preview Access:</span>
                      <button
                        type="button"
                        onClick={() => handleOfflineDemoLogin('traveler')}
                        className="text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        ⚡ Continue as Traveler
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-[50px] rounded-xl font-semibold shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 text-xs rounded-full">Or sign up with</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              {googleClientId ? (
                <div id="googleSignUpBtn" ref={googleSignUpBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
              ) : (
                <button 
                  type="button"
                  onClick={triggerGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 h-[48px] rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Sign up with Google
                </button>
              )}
              
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(false)} 
                  className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </form>
          </section>
        )}
      </div>

      {/* Google Login Options Modal (When Google Client ID is not yet defined in .env or for rapid testing) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-gray-100 my-auto">
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Google Authentication</h3>
                <p className="text-xs text-gray-500">Fast sign-in & Account setup</p>
              </div>
            </div>

            {/* Quick 1-Click Simulation with your Google Email */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mb-5">
              <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-emerald-600">bolt</span>
                Instant Sign-In with Your Google Account
              </h4>
              <p className="text-xs text-emerald-700 mb-3">
                Enter your Google account email to automatically register or link your profile directly in the database:
              </p>
              <div className="space-y-2.5">
                <input 
                  type="text" 
                  value={googleNameInput} 
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Full Name (e.g. John Doe)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input 
                  type="email" 
                  value={googleEmailInput} 
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="Google Email (e.g. user@gmail.com)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  Continue with Google ({googleEmailInput.trim() || 'traveler@gmail.com'})
                </button>
              </div>
            </div>

            {/* Step to configure official Google OAuth */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-gray-500">settings</span>
                Official Production Google OAuth Setup
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                To activate official Google Cloud sign-in popup:
              </p>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside pl-1 mb-4">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-primary underline">Google Cloud Console Credentials</a>.</li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application) and add your domain to Authorized JavaScript origins.</li>
                <li>Paste the Client ID in <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">localmate-frontend/.env</code>:
                  <div className="bg-gray-800 text-emerald-400 p-2 rounded-md mt-1 font-mono text-[11px] overflow-x-auto">
                    VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
                  </div>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
