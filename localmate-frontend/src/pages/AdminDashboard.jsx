import React, { useState } from 'react';
import AdminLayout from './admin/AdminLayout';

export default function AdminDashboard() {
  const [helpersCount, setHelpersCount] = useState(1240);
  const [applicants, setApplicants] = useState([
    {
      id: "app-1",
      name: "Sophia Martinez",
      city: "Da Nang, Vietnam",
      languages: "English, Spanish",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDl1JvNgEn_Iah1k8g83rizrCfY_6B3xSQEDTDiVVz4k-5YI-PnND2xk1sRIEpw9XzYn9GI7srw-95-wc8NMjnMUPhZSY4z_wLRPXfTQwmIGABIn8BPFnQ7qA23i09FP2rPaB7UpKeq-tQCp-bc65EKikgoIvXfTftNMtm_J6Xbxk-fGdOMBHN6DlepkANhSAqWE7rP-4rrtx_6Yg87gU7tZeuWG8ptukGKe72ermOrCfvFN6b-Kji5-5IIeJSzWo3GGcgBmOhMpmk"
    },
    {
      id: "app-2",
      name: "Takahiro Sato",
      city: "Kyoto, Japan",
      languages: "Japanese, English",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_HMawh3gcw98Hnvlpo3qwGlMupa9PLUMokAr2KGhsHK3dQeg4ManeJkXTyazOLGDhBvHkFW_8-dQ-WCOVQYnky-wMyeehH59pg4IjY8bTD-uQfTarxeAx4k5s3o2C8LggLjo7VW3giuFVNeCpd8Tuyk6JZTHYxVnbCd8BFSK0TrcQQUtVlo0Us3SKZCiKGy4n9r2RSNBZL91JIgcb3gWy-xNCJkAyVhJeUjaunnXnxpJSm8KJDneM2U_17KN-33bLadJjRsC-TMs"
    }
  ]);

  const handleApprove = (id, name) => {
    alert(`Approved ${name} as a verified Local Helper!`);
    setApplicants(applicants.filter(a => a.id !== id));
    setHelpersCount(helpersCount + 1);
  };

  const handleReject = (id, name) => {
    if (window.confirm(`Are you sure you want to reject the application of ${name}?`)) {
      setApplicants(applicants.filter(a => a.id !== id));
    }
  };

  return (
    <AdminLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-gray-900 text-xl">System Overview</h1>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      <div className="p-6 md:p-10 space-y-8 w-full max-w-7xl mx-auto">
          
          {/* Stats Cards Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat Card 1 */}
            <div className="glass-card p-6 rounded-xl bg-white dark:bg-surface-dark border border-border-subtle flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="text-secondary font-label-bold text-label-bold flex items-center text-sm">
                  +12% <span className="material-symbols-outlined text-sm ml-1">trending_up</span>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-on-surface-variant font-label-bold text-label-bold uppercase tracking-wider text-xs">Total Users</h3>
                <p className="text-headline-md font-headline-md text-on-surface mt-1 font-bold">12,482</p>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-card p-6 rounded-xl bg-white dark:bg-surface-dark border border-border-subtle flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <span className="text-secondary font-label-bold text-label-bold flex items-center text-sm">
                  +5.2% <span className="material-symbols-outlined text-sm ml-1">trending_up</span>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-on-surface-variant font-label-bold text-label-bold uppercase tracking-wider text-xs">Local Helpers</h3>
                <p className="text-headline-md font-headline-md text-on-surface mt-1 font-bold">{helpersCount}</p>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-card p-6 rounded-xl bg-white dark:bg-surface-dark border border-border-subtle flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-tertiary/10 text-tertiary rounded-xl">
                  <span className="material-symbols-outlined">book_online</span>
                </div>
                <span className="text-error font-label-bold text-label-bold flex items-center text-sm">
                  -2.1% <span className="material-symbols-outlined text-sm ml-1">trending_down</span>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-on-surface-variant font-label-bold text-label-bold uppercase tracking-wider text-xs">Active Bookings</h3>
                <p className="text-headline-md font-headline-md text-on-surface mt-1 font-bold">842</p>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="glass-card p-6 rounded-xl bg-white dark:bg-surface-dark border border-border-subtle flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-status-warning/10 text-status-warning rounded-xl">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-secondary font-label-bold text-label-bold flex items-center text-sm">
                  +18% <span className="material-symbols-outlined text-sm ml-1">trending_up</span>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-on-surface-variant font-label-bold text-label-bold uppercase tracking-wider text-xs">Monthly Revenue</h3>
                <p className="text-headline-md font-headline-md text-on-surface mt-1 font-bold">$42,850</p>
              </div>
            </div>

          </section>

          {/* Revenue Growth Graph & Verification Requests */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Revenue Growth mock chart */}
            <div className="xl:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Revenue Growth</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Performance over the last 30 days</p>
                </div>
                <select className="bg-surface-container-low border-border-subtle text-body-sm font-label-bold rounded-lg px-2 py-1 outline-none">
                  <option>Last 30 Days</option>
                  <option>Last 6 Months</option>
                </select>
              </div>
              
              <div className="h-60 w-full flex items-end gap-2 px-2">
                {[40, 60, 55, 80, 70, 90, 100, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-lg relative group" style={{ height: `${h}%` }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-dark text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">
                      ${h / 2}k
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] text-on-surface-variant font-label-bold px-2 uppercase tracking-tighter">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-border-subtle flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Pending Verification</h2>
                <span className="bg-primary/10 text-primary text-[12px] font-label-bold px-2.5 py-1 rounded-full font-bold">
                  {applicants.length} New
                </span>
              </div>
              
              <div className="space-y-4 flex-grow overflow-y-auto no-scrollbar">
                {applicants.length > 0 ? (
                  applicants.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-4">
                      <div className="flex items-center gap-3">
                        <img 
                          alt={app.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border-subtle" 
                          src={app.avatar} 
                        />
                        <div>
                          <h4 className="font-label-bold text-label-bold text-on-surface">{app.name}</h4>
                          <p className="text-body-sm text-on-surface-variant">{app.city} • {app.languages}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 border-t border-border-subtle">
                        <button 
                          onClick={() => handleApprove(app.id, app.name)}
                          className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-label-bold hover:opacity-90 transition-opacity"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(app.id, app.name)}
                          className="bg-error/10 text-error px-3 py-1.5 rounded-lg text-xs font-label-bold hover:bg-error/20 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">check_circle</span>
                    <p className="font-body-sm">All helper applications verified!</p>
                  </div>
                )}
              </div>
            </div>

          </section>

      </div>
    </AdminLayout>
  );
}
