import React, { useState, useEffect } from 'react';

export default function AccountForm({ isOpen, onClose, onSave, account, type = 'customer', loading }) {
  const isEdit = Boolean(account && account.id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'Nam',
    location: 'Hà Nội, Việt Nam',
    status: 'ACTIVE',
    // Helper specific fields
    title: 'Local Guide & Explorer',
    bio: '',
    hourlyRate: 12,
    city: 'Đà Nẵng',
    languages: 'Tiếng Việt, Tiếng Anh',
    availabilityStatus: 'AVAILABLE',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        fullName: account.fullName || account.name || '',
        email: account.email || '',
        phone: account.phone || '',
        gender: account.gender || 'Nam',
        location: account.location || account.city || 'Việt Nam',
        status: (account.status || 'ACTIVE').toUpperCase(),
        title: account.title || 'Local Guide & Explorer',
        bio: account.bio || '',
        hourlyRate: account.hourlyRate || account.price || 12,
        city: account.city || account.location || 'Đà Nẵng',
        languages: Array.isArray(account.languages) ? account.languages.join(', ') : (account.languages || 'Tiếng Việt, Tiếng Anh'),
        availabilityStatus: (account.availabilityStatus || 'AVAILABLE').toUpperCase(),
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '+84 ',
        gender: 'Nam',
        location: type === 'customer' ? 'Hà Nội, Việt Nam' : 'Đà Nẵng & Hội An',
        status: 'ACTIVE',
        title: 'Local Culinary Specialist & Culture Explorer',
        bio: 'Hướng dẫn viên địa phương nhiệt tình, am hiểu văn hóa và ẩm thực bản địa.',
        hourlyRate: 12,
        city: 'Đà Nẵng & Hội An',
        languages: 'Tiếng Việt, Tiếng Anh',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">
                {type === 'customer' ? 'person' : 'badge'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEdit ? `Chỉnh sửa ${type === 'customer' ? 'Khách hàng' : 'Local Helper'}` : `Thêm ${type === 'customer' ? 'Khách hàng mới' : 'Local Helper mới'}`}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? `Cập nhật thông tin mã định danh #${account?.id?.slice(-4) || 'ID'}` : 'Điền đầy đủ thông tin tài khoản bên dưới'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Họ và tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Số điện thoại *</label>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Địa chỉ Email *</label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giá theo giờ ($/giờ)</label>
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
                {type === 'customer' ? 'Địa điểm / Quốc tịch' : 'Địa bàn hoạt động'}
              </label>
              <input
                type="text"
                value={type === 'customer' ? formData.location : formData.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: e.target.value,
                  city: e.target.value 
                })}
                placeholder={type === 'customer' ? "New York, United States" : "Đà Nẵng & Hội An"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {type === 'helper' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ngôn ngữ hỗ trợ (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="Tiếng Việt, Tiếng Anh, Tiếng Hàn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tiêu đề hồ sơ</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Local Foodie & Culture Explorer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giới thiệu ngắn (Bio)</label>
                <textarea
                  rows="2"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Kinh nghiệm dẫn tour, sở thích, thông điệp tới du khách..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Trạng thái tài khoản</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white"
              >
                <option value="ACTIVE">● Active (Hoạt động)</option>
                <option value="INACTIVE">● Inactive (Tạm ngưng)</option>
                <option value="BLOCKED">● Blocked (Khóa tài khoản)</option>
              </select>
            </div>

            {type === 'helper' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Trạng thái nhận đơn (Availability)</label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white font-medium"
                >
                  <option value="AVAILABLE">🟢 Available (Sẵn sàng)</option>
                  <option value="BUSY">🟡 Busy (Đang bận)</option>
                  <option value="OFFLINE">⚪ Offline (Ngoại tuyến)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>{isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
