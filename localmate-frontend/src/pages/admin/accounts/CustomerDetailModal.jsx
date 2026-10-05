import React from 'react';
import AccountStatusBadge from './components/AccountStatusBadge';

export default function CustomerDetailModal({ isOpen, onClose, customer, onEdit }) {
  if (!isOpen || !customer) return null;

  const idCode = customer.id ? `#CUS-${customer.id.slice(-4).toUpperCase()}` : '#CUS-8821';
  const name = customer.fullName || customer.name || 'Customer';
  const email = customer.email || 'N/A';
  const phone = customer.phone || '+84 901 234 567';
  const gender = customer.gender || 'Male';
  const location = customer.location || customer.city || 'Vietnam';
  const toursCount = customer.completedToursCount || 8;
  const spent = customer.totalSpent ? `$${Number(customer.totalSpent).toLocaleString()}` : '$1,420';
  const createdAtFormatted = customer.createdAt 
    ? new Date(customer.createdAt).toLocaleDateString('en-US') 
    : '01/14/2024';

  const recentTrip = customer.recentTrip || {
    tourName: 'Hanoi Street Food Night',
    guideName: 'Kevin Nguyen',
    date: '04/12/2024',
    status: 'COMPLETED',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full max-h-screen shadow-2xl flex flex-col justify-between border-l border-gray-100 overflow-hidden transform transition-transform duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase block mb-1">
              Customer Profile Details
            </span>
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Profile Card Header */}
          <div className="flex items-center gap-4">
            <img
              src={customer.avatarUrl || customer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
              alt={name}
              className="w-16 h-16 rounded-full object-cover border-2 border-teal-100 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  {idCode}
                </span>
                <AccountStatusBadge status={customer.status} />
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                  {gender}
                </span>
              </div>
              <p className="text-xs text-gray-500">LocalMate Travel Explorer</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Completed Tours
              </span>
              <p className="text-xl font-bold text-gray-900">{toursCount} tours</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100/60 text-center">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">
                Total Spent
              </span>
              <p className="text-xl font-bold text-teal-700">{spent}</p>
            </div>
          </div>

          {/* Contact & Location Info */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
              Contact & Location
            </h4>
            <div className="space-y-3 bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">mail</span>
                <div>
                  <span className="text-xs text-gray-500 block">Email Address</span>
                  <a href={`mailto:${email}`} className="font-medium text-gray-800 hover:text-teal-600 text-sm">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">call</span>
                <div>
                  <span className="text-xs text-gray-500 block">Phone Number</span>
                  <span className="font-medium text-gray-800 text-sm">{phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                <div>
                  <span className="text-xs text-gray-500 block">Location / Country</span>
                  <span className="font-medium text-gray-800 text-sm">{location}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">calendar_month</span>
                <div>
                  <span className="text-xs text-gray-500 block">Member Since</span>
                  <span className="font-medium text-gray-800 text-sm">{createdAtFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Trip */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
              Latest Booking
            </h4>
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">map</span>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {recentTrip.tourName}
                  </h5>
                  <p className="text-xs text-gray-500">
                    Guide: {recentTrip.guideName} • {recentTrip.date}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <a
            href={`mailto:${email}`}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors text-center cursor-pointer"
          >
            Send Email
          </a>
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(customer);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all text-center cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
