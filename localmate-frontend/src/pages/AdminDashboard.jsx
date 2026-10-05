import React, { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    helpersCount: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  const [applicants, setApplicants] = useState([
    {
      id: "app-1",
      name: "Sophia Martinez",
      city: "Da Nang, Vietnam",
      languages: "English, Spanish",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
      id: "app-2",
      name: "Takahiro Sato",
      city: "Hoi An, Vietnam",
      languages: "Japanese, English",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    }
  ]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        // Fetch users, helpers, and bookings in parallel
        const [usersRes, helpersRes, bookingsRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/users').catch(() => null),
          fetch('http://localhost:8080/api/v1/helpers').catch(() => null),
          fetch('http://localhost:8080/api/v1/bookings/helper-requests').catch(() => null)
        ]);

        let usersCount = 12;
        let helpersTotal = 4;
        let activeBookingsCount = 8;
        let revenueTotal = 1850;
        let recent = [];

        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            usersCount = usersData.length;
          }
        }

        if (helpersRes && helpersRes.ok) {
          const helpersData = await helpersRes.json();
          if (Array.isArray(helpersData)) {
            helpersTotal = helpersData.length;
          }
        }

        if (bookingsRes && bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          if (Array.isArray(bookingsData)) {
            const active = bookingsData.filter(b => 
              b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'ACCEPTED'
            );
            activeBookingsCount = active.length;
            
            revenueTotal = bookingsData.reduce((sum, b) => {
              const val = Number(b.price || b.totalPrice) || 0;
              return sum + (val > 1000 ? Math.round(val / 25000) : val);
            }, 0);

            recent = bookingsData.slice(0, 5);
          }
        }

        setStats({
          totalUsers: usersCount,
          helpersCount: helpersTotal,
          activeBookings: activeBookingsCount,
          monthlyRevenue: revenueTotal,
          recentBookings: recent
        });
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const handleApprove = (id, name) => {
    alert(`Approved ${name} as a verified Local Helper!`);
    setApplicants(prev => prev.filter(a => a.id !== id));
    setStats(prev => ({ ...prev, helpersCount: prev.helpersCount + 1 }));
  };

  const handleReject = (id, name) => {
    if (window.confirm(`Are you sure you want to reject the application of ${name}?`)) {
      setApplicants(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <AdminLayout>
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time activity overview and system statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </span>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
        
        {/* Stats Cards Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Stat Card 1 - Total Users */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                +12% <span className="material-symbols-outlined text-[13px] ml-0.5">trending_up</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Total Users</h3>
              <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{stats.totalUsers}</p>
            </div>
          </div>

          {/* Stat Card 2 - Local Helpers */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                +8% <span className="material-symbols-outlined text-[13px] ml-0.5">trending_up</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Local Helpers</h3>
              <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{stats.helpersCount}</p>
            </div>
          </div>

          {/* Stat Card 3 - Active Bookings */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">book_online</span>
              </div>
              <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                Active
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Active Bookings</h3>
              <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{stats.activeBookings}</p>
            </div>
          </div>

          {/* Stat Card 4 - Total Revenue */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                +18% <span className="material-symbols-outlined text-[13px] ml-0.5">trending_up</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Estimated Revenue</h3>
              <p className="text-2xl text-teal-700 mt-0.5 font-extrabold">${stats.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>

        </section>

        {/* Revenue Growth Graph & Verification Requests */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Revenue Growth Mock Chart */}
          <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-700 text-lg">insights</span>
                  Revenue & Booking Trends
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Performance and 30-day transaction volume</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  Last 30 Days
                </span>
              </div>
            </div>
            
            <div className="h-56 w-full flex items-end gap-3 px-2">
              {[
                { label: 'W1', h: '45%', val: '$420' },
                { label: 'W2', h: '65%', val: '$680' },
                { label: 'W3', h: '55%', val: '$590' },
                { label: 'W4', h: '85%', val: '$910' },
                { label: 'W5', h: '75%', val: '$810' },
                { label: 'W6', h: '95%', val: '$1,140' },
                { label: 'W7', h: '60%', val: '$650' },
                { label: 'W8', h: '90%', val: '$980' }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm pointer-events-none">
                      {bar.val}
                    </span>
                    <div 
                      className="w-full bg-cyan-100 hover:bg-teal-600 rounded-t-lg transition-all duration-300 cursor-pointer" 
                      style={{ height: bar.h }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">{bar.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span> Booking volume
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-200"></span> Historical projection
              </span>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">verified_user</span>
                Pending Verification
              </h2>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {applicants.length} Pending
              </span>
            </div>
            
            <div className="space-y-3.5 flex-grow overflow-y-auto">
              {applicants.length > 0 ? (
                applicants.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        alt={app.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                        src={app.avatar} 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{app.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{app.city} • {app.languages}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/60">
                      <button 
                        onClick={() => handleApprove(app.id, app.name)}
                        className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-800 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(app.id, app.name)}
                        className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                  <p className="text-xs font-semibold text-slate-600">All helper applications have been reviewed and approved!</p>
                </div>
              )}
            </div>
          </div>

        </section>

      </div>
    </AdminLayout>
  );
}
