import React from 'react';
import AvailabilityBadge from './components/AvailabilityBadge';
import AccountStatusBadge from './components/AccountStatusBadge';
import { formatVND, formatRateVND } from '../../../utils/formatCurrency';

export default function LocalHelperDetailModal({ isOpen, onClose, helper, onEdit, onUpdateAvailability }) {
  if (!isOpen || !helper) return null;

  const idCode = helper.id ? `#HLP-${helper.id.slice(-4).toUpperCase()}` : '#HLP-1042';
  const name = helper.fullName || helper.name || 'Local Helper';
  const email = helper.email || 'N/A';
  const phone = helper.phone || '+84 912 849 201';
  const location = helper.city || helper.location || 'Đà Nẵng & Hội An';
  const rating = helper.rating ? Number(helper.rating).toFixed(1) : '5.0';
  const reviewCount = helper.reviewsCount ?? helper.reviewCount ?? 0;
  
  const rawRate = Number(helper.hourlyRate || helper.price) || 0;
  const rateVND = rawRate < 1000 && rawRate > 0 ? rawRate * 25000 : rawRate || 75000;
  const displayRate = formatRateVND(rateVND);

  const rawRev = Number(helper.totalRevenue || helper.revenue) || 0;
  const revVND = rawRev < 1000 && rawRev > 0 ? rawRev * 25000 : rawRev;
  const displayRevenue = formatVND(revVND);

  const languages = Array.isArray(helper.languages) ? helper.languages : ['Tiếng Việt', 'Tiếng Anh'];
  const skills = Array.isArray(helper.skills) ? helper.skills : ['Food Tour', 'Khám phá văn hóa', 'Chụp ảnh du lịch'];
  const availability = (helper.availabilityStatus || 'AVAILABLE').toUpperCase();
  const verified = helper.verified !== false;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full max-h-screen shadow-2xl flex flex-col justify-between border-l border-gray-100 overflow-hidden transform transition-transform duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-teal-600 uppercase block mb-1">
              Hồ sơ Local Helper (Hướng dẫn viên)
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
          {/* Avatar and Badges */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={helper.avatar || helper.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-200 shadow-xs"
              />
              <span 
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  availability === 'AVAILABLE' ? 'bg-emerald-500' :
                  availability === 'BUSY' ? 'bg-amber-500' : 'bg-gray-400'
                }`}
                title={`Trạng thái: ${availability === 'AVAILABLE' ? 'Sẵn sàng' : availability === 'BUSY' ? 'Đang bận' : 'Ngoại tuyến'}`}
              ></span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  {idCode}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="material-symbols-outlined text-xs fill-1">star</span>
                  Đánh giá cao
                </span>
                <AccountStatusBadge status={helper.status} />
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{helper.title || 'Hướng dẫn viên bản địa & Khám phá văn hóa'}</p>
            </div>
          </div>

          {/* Availability Control Box (Live Availability Switcher) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50/70 to-emerald-50/70 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-teal-600">tune</span>
                Bộ điều phối trạng thái
              </span>
              <AvailabilityBadge status={availability} />
            </div>
            <p className="text-xs text-teal-700 mb-3 leading-relaxed">
              Trực tiếp điều chỉnh mức độ hiển thị và khả năng nhận đặt lịch của hướng dẫn viên trên bản đồ khám phá.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'AVAILABLE', label: '🟢 Sẵn sàng', bg: 'hover:bg-emerald-100 text-emerald-800' },
                { key: 'BUSY', label: '🟡 Đang bận', bg: 'hover:bg-amber-100 text-amber-800' },
                { key: 'OFFLINE', label: '⚪ Ngoại tuyến', bg: 'hover:bg-gray-200 text-gray-700' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onUpdateAvailability && onUpdateAvailability(helper.id, opt.key)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                    availability === opt.key
                      ? 'bg-white border-teal-500 shadow-xs font-bold ring-2 ring-teal-500/20'
                      : `bg-white/70 border-gray-200 ${opt.bg}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Tổng doanh thu
              </span>
              <p className="text-sm font-bold text-emerald-600 font-mono">
                {displayRevenue}
              </p>
              <span className="text-[10px] text-gray-400">({helper.completedToursCount || 0} chuyến)</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Đánh giá
              </span>
              <p className="text-base font-bold text-amber-600 flex items-center justify-center gap-0.5">
                <span className="material-symbols-outlined text-sm fill-1">star</span>
                {rating}
              </p>
              <span className="text-[10px] text-gray-400">({reviewCount} nhận xét)</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Giá theo giờ
              </span>
              <p className="text-sm font-bold text-gray-900">{displayRate}</p>
              <span className="text-[10px] text-gray-400">Giá tiêu chuẩn</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Xác thực KYC
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1 ${
                verified ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {verified ? 'verified' : 'pending'}
                </span>
                {verified ? 'Đã xác thực' : 'Chờ duyệt'}
              </span>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
              Ngôn ngữ giao tiếp
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-100"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Skills / Specialization */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
              Chuyên môn & Dịch vụ
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
              Giới thiệu bản thân
            </h4>
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 text-xs text-gray-600 leading-relaxed italic">
              "{helper.bio || 'Xin chào! Tôi là người con bản xứ nhiệt tình, luôn sẵn sàng dẫn bạn khám phá những góc phố đặc biệt, món ăn ngon và nét đẹp văn hóa truyền thống.'}"
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
              Liên hệ & Khu vực hoạt động
            </h4>
            <div className="space-y-2 bg-white rounded-xl border border-gray-100 p-3.5 text-xs text-gray-700 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-base">mail</span>
                <span className="font-medium text-gray-800">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-base">call</span>
                <span className="font-medium text-gray-800">{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-base">location_on</span>
                <span className="font-medium text-gray-800">{location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <a
            href={`mailto:${email}`}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors text-center cursor-pointer"
          >
            Gửi Email
          </a>
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(helper);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all text-center cursor-pointer"
          >
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
