import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Incorrect email or password!');
      }

      const responseText = await response.text();
      let userData = {};

      try {
        userData = JSON.parse(responseText);
      } catch {
        // Handle raw token string if legacy backend
        const rawToken = responseText.replace(/^"|"$/g, '').trim();
        userData = { token: rawToken, email };
      }

      // Extract user info from token if missing
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

      // Navigation after login
      const roles = userData.roles || [];
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to the server.');
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
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/register', {
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
      });

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

      alert(`Successfully registered ${role === 'guide' ? 'Local Helper' : 'Traveler'} account!`);
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Error creating account. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] flex items-center justify-center relative py-6 px-4 auth-gradient overflow-y-auto">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 my-auto py-2">
        {!isSignUp ? (
          /* Login Card */
          <section className="glass-card p-8 rounded-2xl shadow-xl transition-all duration-500 transform opacity-100 scale-100">
            <div className="text-center mb-8">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome Back</h1>
              <p className="font-body-md text-on-surface-variant">Access your local connections</p>
            </div>
            
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Email or Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 h-[56px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="name@example.com" 
                />
              </div>
              
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 h-[56px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div className="flex justify-end">
                <a className="font-body-sm text-body-sm text-primary hover:underline" href="#">Forgot password?</a>
              </div>
              
              {errorMessage && (
                <div className="p-3.5 bg-error/10 border border-error/30 text-error rounded-xl text-body-sm">
                  {errorMessage}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container h-[56px] rounded-xl font-label-bold text-label-bold shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface text-on-surface-variant font-body-sm rounded-full">Or continue with</span>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => alert('Google authentication is not configured yet.')}
                className="w-full flex items-center justify-center gap-3 bg-surface border border-border-subtle h-[56px] rounded-xl font-label-bold text-label-bold hover:bg-surface-container transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Sign in with Google
              </button>
              
              <p className="text-center font-body-sm text-on-surface-variant mt-6">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(true)} 
                  className="text-primary font-label-bold hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          </section>
        ) : (
          /* Signup Card */
          <section className="glass-card p-8 rounded-2xl shadow-xl transition-all duration-500 transform opacity-100 scale-100">
            <div className="text-center mb-6">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Join LocalMate</h1>
              <p className="font-body-md text-on-surface-variant">Start your journey today</p>
            </div>
            
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 h-[48px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                    placeholder="Nguyen Van A" 
                  />
                </div>
                <div>
                  <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 h-[48px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                    placeholder="+84 123456789" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 h-[48px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="name@example.com" 
                />
              </div>
              
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 h-[48px] rounded-xl border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-3">Join as</label>
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
                    <div className="p-3 text-center rounded-xl border-2 border-border-subtle peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined block text-primary mb-1">person</span>
                      <span className="font-label-bold text-on-surface">Traveler</span>
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
                    <div className="p-3 text-center rounded-xl border-2 border-border-subtle peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined block text-primary mb-1">map</span>
                      <span className="font-label-bold text-on-surface">Local Helper</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-start gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-border-subtle rounded focus:ring-primary cursor-pointer" 
                />
                <label className="font-body-sm text-body-sm text-on-surface-variant leading-tight select-none cursor-pointer" htmlFor="terms">
                  I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>
                </label>
              </div>
              
              {errorMessage && (
                <div className="p-3.5 bg-error/10 border border-error/30 text-error rounded-xl text-body-sm">
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container h-[56px] rounded-xl font-label-bold text-label-bold shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              
              <p className="text-center font-body-sm text-on-surface-variant mt-4">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(false)} 
                  className="text-primary font-label-bold hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
