import React from 'react';

export default function AvailabilityBadge({ status, onChange, interactive = false }) {
  const normStatus = (status || 'AVAILABLE').toUpperCase();

  const configs = {
    AVAILABLE: {
      label: 'Available',
      sub: 'Sẵn sàng nhận tour',
      dotColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    BUSY: {
      label: 'Busy',
      sub: 'Đang bận dẫn tour',
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    OFFLINE: {
      label: 'Offline',
      sub: 'Ngoại tuyến / Nghỉ',
      dotColor: 'bg-gray-400',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  };

  const current = configs[normStatus] || configs.OFFLINE;

  if (interactive && onChange) {
    return (
      <div className="relative inline-block">
        <select
          value={normStatus}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none pl-6 pr-6 py-1 rounded-full border text-[11px] font-semibold cursor-pointer outline-none transition-all ${current.badgeClass} hover:shadow-xs`}
        >
          <option value="AVAILABLE">🟢 Available</option>
          <option value="BUSY">🟡 Busy</option>
          <option value="OFFLINE">⚪ Offline</option>
        </select>
        <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${current.dotColor} pointer-events-none`}></span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${current.badgeClass}`}>
      <span className={`w-2 h-2 rounded-full ${current.dotColor}`}></span>
      <span>{current.label}</span>
    </span>
  );
}
