import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('localmate_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('localmate_user');
    localStorage.removeItem('localmate_token');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md shadow-sm border-b border-border-subtle flex items-center">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-10 w-full">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
            LocalMate
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`font-label-bold text-label-bold pb-1 transition-colors ${
                isActive('/') 
                  ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed' 
                  : 'text-on-surface-variant dark:text-outline-variant hover:text-primary'
              }`}
            >
              Explore
            </Link>
            <Link 
              to="/search" 
              className={`font-label-bold text-label-bold pb-1 transition-colors ${
                isActive('/search') 
                  ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed' 
                  : 'text-on-surface-variant dark:text-outline-variant hover:text-primary'
              }`}
            >
              Find Guides
            </Link>
            <button 
              type="button"
              onClick={() => {
                if (!currentUser) {
                  alert("Please sign in to access messages!");
                  navigate('/login');
                } else {
                  navigate('/chat');
                }
              }}
              className={`font-label-bold text-label-bold pb-1 transition-colors ${
                isActive('/chat') 
                  ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed' 
                  : 'text-on-surface-variant dark:text-outline-variant hover:text-primary'
              }`}
            >
              Messages
            </button>
            {/* Display Dashboards when signed in */}
            {currentUser && (
              <div 
                className="relative"
                onMouseEnter={() => setDashboardOpen(true)}
                onMouseLeave={() => setDashboardOpen(false)}
              >
                <button 
                  type="button"
                  onClick={() => setDashboardOpen((prev) => !prev)}
                  className="font-label-bold text-label-bold text-on-surface-variant dark:text-outline-variant hover:text-primary transition-colors flex items-center gap-1 py-1"
                >
                  {currentUser.roles?.includes('ROLE_ADMIN') 
                    ? 'Admin Portal' 
                    : currentUser.roles?.includes('ROLE_HELPER') 
                    ? 'Helper Portal' 
                    : 'My Travel'} 
                  <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${dashboardOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                </button>
                {dashboardOpen && (
                  <div className="absolute top-full left-0 pt-1 w-52 z-50">
                    <div className="bg-surface dark:bg-surface-dark border border-border-subtle rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {currentUser.roles?.includes('ROLE_ADMIN') && (
                        <>
                          <Link 
                            to="/admin" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            System Admin
                          </Link>
                          <Link 
                            to="/reviews" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            Review Management
                          </Link>
                        </>
                      )}

                      {currentUser.roles?.includes('ROLE_HELPER') && (
                        <>
                          <Link 
                            to="/helper-dashboard" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            Helper Dashboard
                          </Link>
                          <Link 
                            to="/reviews" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            My Reviews
                          </Link>
                        </>
                      )}

                      {!currentUser.roles?.includes('ROLE_ADMIN') && !currentUser.roles?.includes('ROLE_HELPER') && (
                        <>
                          <Link 
                            to="/traveler" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            Traveler Dashboard
                          </Link>
                          <Link 
                            to="/reviews" 
                            onClick={() => setDashboardOpen(false)}
                            className="block px-4 py-2.5 hover:bg-primary-container/10 text-body-sm font-label-bold text-on-surface transition-colors"
                          >
                            Review Management
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/profile" 
                title="Edit profile"
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle transition-all cursor-pointer group"
              >
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-primary/40 group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-body-sm font-bold text-on-surface leading-tight max-w-[120px] truncate group-hover:text-primary transition-colors">
                    {currentUser.fullName || currentUser.email}
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-none">
                    {currentUser.roles?.includes('ROLE_ADMIN') ? 'Admin' : currentUser.roles?.includes('ROLE_HELPER') ? 'Local Helper' : 'Traveler'}
                  </p>
                </div>
              </Link>
              <button 
                onClick={handleLogout} 
                title="Log out"
                className="font-label-bold text-body-sm text-error hover:bg-error/10 px-3 py-2 rounded-xl transition-all"
              >
                Log Out
              </button>
            </div>
          ) : location.pathname === '/login' ? (
            <Link 
              to="/" 
              className="font-label-bold text-label-bold text-primary hover:bg-primary-container/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Home
            </Link>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                className="hidden md:block font-label-bold text-label-bold text-primary hover:bg-primary-container/10 px-4 py-2 rounded-xl transition-all"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/login?tab=signup')} 
                className="bg-primary-container text-on-primary-container font-label-bold text-label-bold px-6 py-2.5 rounded-xl hover:shadow-lg active:scale-95 transition-all"
              >
                Sign Up
              </button>
            </>
          )}
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-border-subtle py-4 px-6 space-y-4">
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="font-label-bold text-label-bold text-on-surface hover:text-primary"
            >
              Explore
            </Link>
            <Link 
              to="/search" 
              onClick={() => setMobileMenuOpen(false)}
              className="font-label-bold text-label-bold text-on-surface hover:text-primary"
            >
              Find Guides
            </Link>
            <button 
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (!currentUser) {
                  alert("Please sign in to access messages!");
                  navigate('/login');
                } else {
                  navigate('/chat');
                }
              }}
              className="text-left font-label-bold text-label-bold text-on-surface hover:text-primary"
            >
              Messages
            </button>
            {/* Display Dashboards on mobile when signed in */}
            {currentUser && (
              <div className="border-t border-border-subtle my-2 pt-2">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                  {currentUser.roles?.includes('ROLE_ADMIN') 
                    ? 'Admin Portal' 
                    : currentUser.roles?.includes('ROLE_HELPER') 
                    ? 'Helper Portal' 
                    : 'My Travel'}
                </p>
                {currentUser.roles?.includes('ROLE_ADMIN') && (
                  <>
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">System Admin</Link>
                    <Link to="/reviews" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">Review Management</Link>
                  </>
                )}
                {currentUser.roles?.includes('ROLE_HELPER') && (
                  <>
                    <Link to="/helper-dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">Helper Dashboard</Link>
                    <Link to="/reviews" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">My Reviews</Link>
                  </>
                )}
                {!currentUser.roles?.includes('ROLE_ADMIN') && !currentUser.roles?.includes('ROLE_HELPER') && (
                  <>
                    <Link to="/traveler" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">Traveler Dashboard</Link>
                    <Link to="/reviews" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-body-md text-on-surface hover:text-primary">Review Management</Link>
                  </>
                )}
              </div>
            )}

            {currentUser ? (
              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-center border border-error text-error py-3 rounded-xl font-label-bold"
              >
                Log Out ({currentUser.fullName || currentUser.email})
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="w-full text-center border border-primary text-primary py-3 rounded-xl font-label-bold"
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/login?tab=signup'); }}
                  className="w-full text-center bg-primary text-on-primary py-3 rounded-xl font-label-bold"
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
