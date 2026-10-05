import React, { useState, useEffect } from 'react';

export default function AccountForm({ isOpen, onClose, onSave, account, type = 'customer', loading }) {
  const isEdit = Boolean(account && account.id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'Male',
    location: 'Hanoi, Vietnam',
    status: 'ACTIVE',
    // Helper specific fields
    title: 'Local Guide & Explorer',
    bio: '',
    hourlyRate: 12,
    city: 'Da Nang',
    languages: 'English, Vietnamese',
    availabilityStatus: 'AVAILABLE',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        fullName: account.fullName || account.name || '',
        email: account.email || '',
        phone: account.phone || '',
        gender: account.gender || 'Male',
        location: account.location || account.city || 'Vietnam',
        status: (account.status || 'ACTIVE').toUpperCase(),
        title: account.title || 'Local Guide & Explorer',
        bio: account.bio || '',
        hourlyRate: account.hourlyRate || account.price || 12,
        city: account.city || account.location || 'Da Nang',
        languages: Array.isArray(account.languages) ? account.languages.join(', ') : (account.languages || 'English, Vietnamese'),
        availabilityStatus: (account.availabilityStatus || 'AVAILABLE').toUpperCase(),
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '+84 ',
        gender: 'Male',
        location: type === 'customer' ? 'Hanoi, Vietnam' : 'Da Nang & Hoi An',
        status: 'ACTIVE',
        title: 'Local Culinary Specialist & Culture Explorer',
        bio: 'Passionate local guide with deep knowledge of authentic culture and local cuisine.',
        hourlyRate: 12,
        city: 'Da Nang & Hoi An',
        languages: 'English, Vietnamese',
        availabilityStatus: 'AVAILABLE',
      });
    }
  }, [account, isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      languages: type === 'helper' 
        ? formData.languages.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">
                {type === 'customer' ? 'person' : 'badge'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEdit ? `Edit ${type === 'customer' ? 'Customer' : 'Local Helper'}` : `Add New ${type === 'customer' ? 'Customer' : 'Local Helper'}`}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? `Update profile details for #${account?.id?.slice(-4) || 'ID'}` : 'Fill in the account details below'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form id="accountForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84 912 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              disabled={isEdit}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all ${isEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'customer' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hourly Rate ($/hr)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {type === 'customer' ? 'Location / Nationality' : 'Operating Base / City'}
              </label>
              <input
                type="text"
                value={type === 'customer' ? formData.location : formData.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: e.target.value,
                  city: e.target.value 
                })}
                placeholder={type === 'customer' ? "New York, United States" : "Da Nang & Hoi An"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {type === 'helper' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Languages Spoken (comma separated)</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="English, Vietnamese, Korean"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Profile Title / Headline</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Local Foodie & Culture Explorer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Short Bio</label>
                <textarea
                  rows="2"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tour guiding experience, local passion, message to travelers..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white"
              >
                <option value="ACTIVE">● Active</option>
                <option value="INACTIVE">● Inactive</option>
                <option value="BLOCKED">● Blocked</option>
              </select>
            </div>

            {type === 'helper' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Availability Status</label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white font-medium"
                >
                  <option value="AVAILABLE">🟢 Available</option>
                  <option value="BUSY">🟡 Busy</option>
                  <option value="OFFLINE">⚪ Offline</option>
                </select>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/80 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="accountForm"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>{isEdit ? 'Save Changes' : 'Create Account'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
