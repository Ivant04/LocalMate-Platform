import React from 'react';

export default function AccountStatusBadge({ status, size = 'sm' }) {
  const normStatus = (status || 'ACTIVE').toUpperCase();

  const config = {
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    INACTIVE: {
      label: 'Inactive',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    BLOCKED: {
      label: 'Blocked',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
  }[normStatus] || {
    label: normStatus,
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs font-semibold' : 'px-2.5 py-0.5 text-[11px] font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <span>{config.label}</span>
    </span>
  );
}
