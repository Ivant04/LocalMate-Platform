import React from 'react';

export default function DeleteAccountDialog({ isOpen, onClose, onConfirm, account, loading }) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          Xác nhận xóa tài khoản?
        </h3>

        <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
          Bạn có chắc chắn muốn xóa tài khoản <span className="font-semibold text-gray-800">{account.fullName || account.name}</span> ({account.email})? Hành động này sẽ xóa dữ liệu vĩnh viễn và <strong className="text-rose-600">không thể hoàn tác</strong>.
        </p>

        <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 mb-6 text-xs text-rose-700 flex items-start gap-2">
          <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
          <span>Toàn bộ lịch sử đặt chuyến, đánh giá và hồ sơ liên quan đến tài khoản này sẽ bị gỡ bỏ khỏi hệ thống.</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">delete</span>
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
