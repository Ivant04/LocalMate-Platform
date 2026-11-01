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
    title: 'Local Helper & Hướng dẫn viên địa phương',
    bio: '',
    hourlyRate: 100000,
    city: 'Đà Nẵng',
    languages: 'Tiếng Anh, Tiếng Việt',
    availabilityStatus: 'AVAILABLE',
  });

  useEffect(() => {
    if (account) {
      const rawRate = Number(account.hourlyRate || account.price) || 100000;
      const rateVND = rawRate < 1000 ? rawRate * 25000 : rawRate;

      setFormData({
        fullName: account.fullName || account.name || '',
        email: account.email || '',
        phone: account.phone || '',
        gender: account.gender || 'Nam',
        location: account.location || account.city || 'Việt Nam',
        status: (account.status || 'ACTIVE').toUpperCase(),
        title: account.title || 'Local Helper & Hướng dẫn viên địa phương',
        bio: account.bio || '',
        hourlyRate: rateVND,
        city: account.city || account.location || 'Đà Nẵng',
        languages: Array.isArray(account.languages) ? account.languages.join(', ') : (account.languages || 'Tiếng Anh, Tiếng Việt'),
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
        title: 'Chuyên gia văn hóa & ẩm thực bản địa',
        bio: 'Hướng dẫn viên địa phương nhiệt tình với tình yêu văn hóa và ẩm thực bản địa sâu sắc.',
        hourlyRate: 100000,
        city: 'Đà Nẵng & Hội An',
        languages: 'Tiếng Anh, Tiếng Việt',
        availabilityStatus: 'AVAILABLE',
      });
    }
  }, [account, isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const rawRate = Number(formData.hourlyRate);
    const finalRate = rawRate < 1000 ? rawRate * 25000 : rawRate;

    const payload = {
      ...formData,
      hourlyRate: finalRate > 0 ? finalRate : 100000,
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
                {isEdit ? `Chỉnh sửa ${type === 'customer' ? 'Khách hàng' : 'Local Helper'}` : `Thêm mới ${type === 'customer' ? 'Khách hàng' : 'Local Helper'}`}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? `Cập nhật thông tin cho tài khoản #${account?.id?.slice(-4) || 'ID'}` : 'Điền đầy đủ thông tin bên dưới'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form id="accountForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mức giá mỗi giờ (VNĐ/giờ)</label>
                <input
                  type="number"
                  step="10000"
                  min="10000"
                  max="50000000"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {type === 'customer' ? 'Địa điểm / Quốc tịch' : 'Khu vực hoạt động / Thành phố'}
              </label>
              <input
                type="text"
                value={type === 'customer' ? formData.location : formData.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: e.target.value,
                  city: e.target.value 
                })}
                placeholder={type === 'customer' ? "Hà Nội, Việt Nam" : "Đà Nẵng & Hội An"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {type === 'helper' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ngôn ngữ giao tiếp (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="Tiếng Anh, Tiếng Việt, Tiếng Hàn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tiêu đề hồ sơ / Chuyên môn</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Khám phá ẩm thực & văn hóa bản địa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giới thiệu ngắn</label>
                <textarea
                  rows="2"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Kinh nghiệm dẫn tour, đam mê văn hóa, lời nhắn gửi du khách..."
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
                <option value="ACTIVE">● Hoạt động</option>
                <option value="INACTIVE">● Không hoạt động</option>
                <option value="BLOCKED">● Bị khóa</option>
              </select>
            </div>

            {type === 'helper' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Trạng thái sẵn sàng</label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white font-medium"
                >
                  <option value="AVAILABLE">🟢 Sẵn sàng</option>
                  <option value="BUSY">🟡 Đang bận</option>
                  <option value="OFFLINE">⚪ Ngoại tuyến</option>
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
            Hủy bỏ
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
      </div>
    </div>
  );
}
