import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [accountMgmtOpen, setAccountMgmtOpen] = useState(true);

  const isCustomersActive = location.pathname === '/admin/accounts/customers';
  const isHelpersActive = location.pathname === '/admin/accounts/local-helpers';
  const isAccountMgmtActive = isCustomersActive || isHelpersActive;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-gray-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200/80 flex flex-col justify-between sticky top-0 h-screen z-20 overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="p-6 pb-5">
            <Link to="/" className="block">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5">
                Local<span className="text-teal-600">Mate</span>
              </h1>
              <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase block mt-0.5">
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1 text-sm font-medium">
            {/* Dashboard / Overview */}
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-teal-500 text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">grid_view</span>
              <span>Dashboard</span>
            </NavLink>

            {/* Account Mgmt Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAccountMgmtOpen(!accountMgmtOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  isAccountMgmtActive ? 'text-gray-900 font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">manage_accounts</span>
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
                          ? 'bg-teal-400 text-teal-950 font-bold shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCustomersActive ? 'bg-teal-900' : 'bg-gray-300'}`}></span>
                    <span>Customers</span>
                  </NavLink>

                  <NavLink
                    to="/admin/accounts/local-helpers"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-teal-400 text-teal-950 font-bold shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isHelpersActive ? 'bg-teal-900' : 'bg-gray-300'}`}></span>
                    <span>Local Helpers</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Other System Menus */}
            <NavLink
              to="/admin/approvals"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span>Helper Approval</span>
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">calendar_month</span>
              <span>Booking Mgmt</span>
            </NavLink>

            <NavLink
              to="/admin/reviews"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">star</span>
              <span>Reviews</span>
            </NavLink>

            <NavLink
              to="/admin/revenue"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">payments</span>
              <span>Revenue</span>
            </NavLink>

            <NavLink
              to="/admin/reports"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">bar_chart</span>
              <span>Reports</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200/80 space-y-2">
          <NavLink
            to="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Settings</span>
          </NavLink>

          {/* Admin User Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/60">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Alex Rivera"
              className="w-9 h-9 rounded-full object-cover border border-teal-200 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">Alex Rivera</p>
              <p className="text-[10px] font-semibold text-teal-700 tracking-wider uppercase">SYSTEM ADMIN</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#f8fafc]">
        {children}
      </main>
    </div>
  );
}
