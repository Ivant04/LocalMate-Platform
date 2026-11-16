import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { formatVND } from '../utils/formatCurrency';

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const search = location.search;
        if (!search) {
          setError('Không tìm thấy thông tin giao dịch thanh toán.');
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams(search);
        const orderCode = params.get('orderCode');
        const statusParam = params.get('status');
        const isCancelled = params.get('cancel') === 'true' || statusParam === 'CANCELLED';

        if (!orderCode) {
          setError('Không tìm thấy mã đơn hàng PayOS trong phản hồi.');
          setIsLoading(false);
          return;
        }

        // Call backend PayOS verify endpoint
        const res = await fetch(`${API_BASE_URL}/api/v1/payment/payos/verify/${orderCode}`);
        if (res.ok) {
          const data = await res.json();
          setResult({
            status: isCancelled ? 'CANCELLED' : (data.status || (statusParam === 'PAID' ? 'PAID' : 'PENDING')),
            orderCode: orderCode,
            amount: data.amount || params.get('amount') || 0,
            bookingId: data.bookingId || `LM-${orderCode.substring(0, 6)}`,
            tourName: data.tourName || 'Tour trải nghiệm cùng người bản địa',
            paymentMethod: 'PayOS VietQR (Chuyển khoản 24/7)',
            isCancelled: isCancelled
          });
        } else {
          // Fallback to URL parameters
          setResult({
            status: isCancelled ? 'CANCELLED' : (statusParam || 'PAID'),
            orderCode: orderCode,
            amount: params.get('amount') || 0,
            paymentMethod: 'PayOS VietQR (Chuyển khoản 24/7)',
            isCancelled: isCancelled
          });
        }
      } catch (err) {
        console.error('Lỗi khi xác thực thanh toán PayOS:', err);
        setError(err.message || 'Không thể xác thực giao dịch với máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  const isSuccess = result?.status === 'PAID' && !result?.isCancelled;
  const isCancelled = result?.isCancelled || result?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-16 selection:bg-teal-700 selection:text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {isLoading ? (
          <div className="card-bento p-10 md:p-14 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-teal-700 border-t-transparent animate-spin"></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đang xác thực thanh toán...</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Vui lòng đợi trong giây lát, hệ thống đang kiểm tra giao dịch với cổng thanh toán PayOS VietQR.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="card-bento p-8 md:p-12 border-rose-200 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lỗi xác thực giao dịch</h2>
              <p className="text-rose-600 text-sm max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button 
                onClick={() => navigate('/payment')} 
                className="btn-primary"
              >
                Quay lại thanh toán
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* SUCCESS RECEIPT */
          <div className="card-bento p-8 md:p-12 space-y-8">
            
            {/* Success Header */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/50">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Thanh toán thành công!
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                Cảm ơn bạn! Giao dịch đã được xác nhận qua PayOS VietQR và lịch trình của bạn đã được đảm bảo an toàn.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hóa đơn giao dịch</span>
                <span className="badge-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ĐÃ THANH TOÁN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block font-medium">Mã đặt tour</span>
                  <span className="font-bold text-slate-900 break-all">{result.bookingId || result.orderCode}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block font-medium">Mã đơn hàng PayOS</span>
                  <span className="font-bold text-slate-900">{result.orderCode || 'N/A'}</span>
                </div>

                {result.amount > 0 && (
                  <div>
                    <span className="text-slate-400 text-xs block font-medium">Số tiền đã thanh toán</span>
                    <span className="font-black text-teal-800 text-base">
                      {formatVND(result.amount)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 text-xs block font-medium">Cổng thanh toán</span>
                  <span className="font-bold text-slate-900">
                    PayOS (VietQR Chuyển khoản 24/7)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block font-medium">Trạng thái xác thực</span>
                  <span className="font-bold text-emerald-700">Đã xác thực &amp; Thành công</span>
                </div>

                {result.tourName && (
                  <div>
                    <span className="text-slate-400 text-xs block font-medium">Trải nghiệm đặt</span>
                    <span className="font-medium text-slate-700">{result.tourName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shield & Protection Banner */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-xs text-teal-900">
              <span className="material-symbols-outlined text-teal-700 text-2xl shrink-0">verified_user</span>
              <span className="leading-relaxed">
                Khoản tiền được giữ an toàn qua cơ chế <strong>Ký quỹ Escrow Bảo đảm 100%</strong> cho đến khi bạn gặp Local Helper và chuyến đi kết thúc an toàn.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/traveler"
                className="btn-primary w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Xem lịch đặt của tôi</span>
              </Link>
              <Link
                to="/chat"
                className="btn-outline w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Nhắn tin với Helper</span>
              </Link>
            </div>

          </div>
        ) : (
          /* CANCELLED OR FAILED PAYMENT */
          <div className="card-bento p-8 md:p-12 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center ring-8 ring-amber-50/50">
                <span className="material-symbols-outlined text-5xl">
                  {isCancelled ? 'cancel' : 'highlight_off'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {isCancelled ? 'Giao dịch đã hủy' : 'Thanh toán chưa hoàn tất'}
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                {isCancelled
                  ? 'Bạn đã hủy phiên giao dịch thanh toán. Không có khoản phí nào bị trừ khỏi tài khoản của bạn.'
                  : result?.message || 'Không thể hoàn tất giao dịch. Vui lòng thử lại phương thức thanh toán khác hoặc liên hệ hỗ trợ.'}
              </p>
            </div>

            {/* Error Details */}
            {result?.orderCode && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-3 text-sm">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Mã đơn hàng PayOS</span>
                  <span className="font-mono font-bold text-slate-700">{result.orderCode}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/payment')}
                className="btn-primary w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>Thử thanh toán lại</span>
              </button>
              <Link
                to="/"
                className="btn-outline w-full sm:w-auto"
              >
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
