import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [accountMgmtOpen, setAccountMgmtOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    if (!stored) {
      alert('Please log in with an Administrator account!');
      navigate('/login');
      return;
    }
    try {
      const user = JSON.parse(stored);
      if (!user?.roles?.includes('ROLE_ADMIN')) {
        alert('Access denied: Administrator privileges required!');
        navigate('/');
        return;
      }
      setCurrentUser(user);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const isCustomersActive = location.pathname === '/admin/accounts/customers';
  const isHelpersActive = location.pathname === '/admin/accounts/local-helpers';
  const isAccountMgmtActive = isCustomersActive || isHelpersActive;

  const displayName = currentUser?.fullName || "System Admin";
  const displayAvatar = currentUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

  return (
    <div className="flex min-h-screen w-full max-w-full bg-[#F8FAFC] text-slate-800 antialiased font-sans overflow-x-hidden selection:bg-cyan-700 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between sticky top-0 h-screen z-20 overflow-y-auto select-none">
        <div>
          {/* User Profile Card - Consistent with App Header & Sidebar */}
          <div className="p-4 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <img 
                alt={displayName} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-600/20 shrink-0" 
                src={displayAvatar} 
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">System Admin</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="mt-3 w-full py-2 px-4 rounded-lg bg-cyan-50 text-cyan-800 text-xs border border-cyan-200 hover:bg-cyan-100 transition-all font-semibold cursor-pointer"
            >
              Edit Profile
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 text-sm font-medium">
            {/* Dashboard / Overview */}
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 font-semibold border border-cyan-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span 
                    className={`material-symbols-outlined text-[20px] ${isActive ? 'text-cyan-700' : 'text-slate-400'}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    dashboard
                  </span>
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>

            {/* Account Mgmt Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAccountMgmtOpen(!accountMgmtOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  isAccountMgmtActive ? 'bg-cyan-50 text-cyan-800 font-semibold border border-cyan-100' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[20px] ${isAccountMgmtActive ? 'text-cyan-700' : 'text-slate-400'}`}>
                    manage_accounts
                  </span>
                  <span>Account Mgmt</span>
                </div>
                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${accountMgmtOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {accountMgmtOpen && (
                <div className="pl-6 pr-2 pt-1 pb-1 space-y-1">
                  <NavLink
                    to="/admin/accounts/customers"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-100/70 text-cyan-900 font-bold border border-cyan-200'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCustomersActive ? 'bg-cyan-700' : 'bg-slate-300'}`}></span>
                    <span>Customers</span>
                  </NavLink>

                  <NavLink
                    to="/admin/accounts/local-helpers"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-100/70 text-cyan-900 font-bold border border-cyan-200'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isHelpersActive ? 'bg-cyan-700' : 'bg-slate-300'}`}></span>
                    <span>Local Helpers</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Other System Menus */}
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">verified_user</span>
              <span>Helper Approval</span>
            </NavLink>

            <NavLink
              to="/traveler"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">calendar_month</span>
              <span>Booking Mgmt</span>
            </NavLink>

            <NavLink
              to="/reviews"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">star</span>
              <span>Reviews</span>
            </NavLink>

            <NavLink
              to="/chat"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">chat_bubble</span>
              <span>Messages</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 space-y-1">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">settings</span>
            <span>Settings</span>
          </NavLink>

          <NavLink
            to="/"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">help_outline</span>
            <span>Help</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
