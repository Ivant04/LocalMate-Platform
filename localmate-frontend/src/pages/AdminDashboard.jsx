import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import { API_BASE_URL } from '../config/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    customersCount: 0,
    helpersCount: 0,
    activeCount: 0,
  });

  const [allUsers, setAllUsers] = useState([]);
  const [pendingHelpers, setPendingHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, helpersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/users`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/helpers`).catch(() => null),
      ]);

      let usersList = [];
      let helpersList = [];

      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData)) usersList = uData;
      }

      if (helpersRes && helpersRes.ok) {
        const hData = await helpersRes.json();
        if (Array.isArray(hData)) helpersList = hData;
      }

      const totalUsers = usersList.length;
      const customersCount = usersList.filter((u) =>
        (u.roles || []).some((r) => r.toUpperCase().includes('TRAVELER'))
      ).length;
      const helpersCount = helpersList.length;
      const activeCount = usersList.filter(
        (u) => (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
      ).length;

      setStats({
        totalUsers,
        customersCount,
        helpersCount,
        activeCount,
      });

      // Sort recent users to top
      setAllUsers([...usersList].reverse());

      // Helper applications waiting for approval: verified === false
      const unverified = helpersList.filter((h) => h.verified === false);
      setPendingHelpers(unverified);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true }),
      });

      if (res.ok) {
        showToast(`Approved verification for Local Helper ${name}!`);
        setPendingHelpers((prev) => prev.filter((h) => h.id !== id && h.userId !== id));
      } else {
        showToast(`Approval failed. Please try again!`);
      }
    } catch (err) {
      console.error('Error approving helper:', err);
      showToast(`Error approving helper verification!`);
    }
  };

  const handleReject = async (id, name) => {
    if (window.confirm(`Are you sure you want to reject the application of ${name}?`)) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/helpers/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OFFLINE' }),
        }).catch(() => null);

        showToast(`Rejected application of ${name}.`);
        setPendingHelpers((prev) => prev.filter((h) => h.id !== id && h.userId !== id));
      } catch (err) {
        console.error('Error rejecting helper:', err);
      }
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase().trim();
    const name = (u.fullName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(s) || email.includes(s) || phone.includes(s);
  });

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time system overview and live user records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            title="Refresh database records"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Database Online
          </span>
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
        
        {/* 4 Standardized Real Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Stat Card 1 - Total Users */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <span className="text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                Database
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Total Users</h3>
              <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{stats.totalUsers}</p>
            </div>
          </div>

          {/* Stat Card 2 - Customers / Travelers */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <Link
                to="/admin/accounts/customers"
                className="text-blue-700 hover:underline font-bold text-xs"
              >
                View details →
              </Link>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Customers / Travelers</h3>
              <p className="text-2xl text-blue-900 mt-0.5 font-extrabold">{stats.customersCount}</p>
            </div>
          </div>

          {/* Stat Card 3 - Local Helpers */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <Link
                to="/admin/accounts/local-helpers"
                className="text-teal-700 hover:underline font-bold text-xs"
              >
                View details →
              </Link>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Local Helpers</h3>
              <p className="text-2xl text-teal-900 mt-0.5 font-extrabold">{stats.helpersCount}</p>
            </div>
          </div>

          {/* Stat Card 4 - Active Accounts */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                Active
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Active Accounts</h3>
              <p className="text-2xl text-emerald-700 mt-0.5 font-extrabold">{stats.activeCount}</p>
            </div>
          </div>

        </section>

        {/* Content Section: Real Database Accounts & Helper Approval Requests */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Real Database Users Table */}
          <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-700 text-xl">manage_accounts</span>
                  Database User Accounts
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time account records from MongoDB Atlas</p>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 w-full sm:w-60"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-base pointer-events-none">
                  search
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 font-bold">User</th>
                    <th className="py-3 px-3 font-bold">Phone Number</th>
                    <th className="py-3 px-3 font-bold">Role</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, idx) => {
                      const isHelper = (user.roles || []).some((r) => r.includes('HELPER'));
                      const isAdmin = (user.roles || []).some((r) => r.includes('ADMIN'));
                      const isActive = (user.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                      return (
                        <tr key={user._id || user.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                alt={user.fullName || 'User'}
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{user.fullName || 'LocalMate User'}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">
                            {user.phone || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                isAdmin
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isHelper
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {isAdmin ? 'Admin' : isHelper ? 'Local Helper' : 'Traveler'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              ></span>
                              {isActive ? 'Active' : 'Blocked'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {loading ? 'Loading database records...' : 'No matching accounts found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>Showing <strong>{filteredUsers.length}</strong> of <strong>{allUsers.length}</strong> accounts</span>
              <div className="flex gap-2">
                <Link
                  to="/admin/accounts/customers"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
                >
                  Manage Customers
                </Link>
                <Link
                  to="/admin/accounts/local-helpers"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
                >
                  Manage Helpers
                </Link>
              </div>
            </div>
          </div>

          {/* Real Helper Verification Approvals from Database */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">verified_user</span>
                Helper Verification Requests
              </h2>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingHelpers.length} Pending
              </span>
            </div>
            
            <div className="space-y-3.5 flex-grow overflow-y-auto max-h-[460px]">
              {pendingHelpers.length > 0 ? (
                pendingHelpers.map((helper) => (
                  <div key={helper.id || helper.userId} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        alt={helper.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                        src={helper.avatar || helper.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{helper.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{helper.city || 'Vietnam'} • ${helper.price || helper.hourlyRate || 15}/hr</p>
                        <p className="text-[11px] text-teal-700 font-semibold truncate">{Array.isArray(helper.languages) ? helper.languages.join(', ') : 'Vietnamese, English'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/60">
                      <button 
                        onClick={() => handleApprove(helper.id || helper.userId, helper.name)}
                        className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-800 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(helper.id || helper.userId, helper.name)}
                        className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                    task_alt
                  </span>
                  <p className="text-xs font-bold text-slate-700">All helper applications have been reviewed!</p>
                  <p className="text-[11px] text-slate-400 mt-1">When new local helpers apply, their verification requests will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </section>

      </div>
    </AdminLayout>
  );
}
