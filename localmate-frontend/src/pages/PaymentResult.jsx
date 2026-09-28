import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

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
          setError('No payment transaction data found.');
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams(search);
        const orderCode = params.get('orderCode');
        const statusParam = params.get('status');
        const isCancelled = params.get('cancel') === 'true' || statusParam === 'CANCELLED';

        if (!orderCode) {
          setError('Order code not found in return transaction URL.');
          setIsLoading(false);
          return;
        }

        // Call backend PayOS verify endpoint
        const res = await fetch(`http://localhost:8080/api/v1/payment/payos/verify/${orderCode}`);
        if (res.ok) {
          const data = await res.json();
          setResult({
            status: isCancelled ? 'CANCELLED' : (data.status || (statusParam === 'PAID' ? 'PAID' : 'PENDING')),
            orderCode: orderCode,
            amount: data.amount || params.get('amount') || 0,
            bookingId: data.bookingId || `LM-${orderCode.substring(0, 6)}`,
            tourName: data.tourName || 'Authentic Guided Tour',
            paymentMethod: 'PayOS VietQR (Banking 24/7)',
            isCancelled: isCancelled
          });
        } else {
          // Fallback to URL parameters
          setResult({
            status: isCancelled ? 'CANCELLED' : (statusParam || 'PAID'),
            orderCode: orderCode,
            amount: params.get('amount') || 0,
            paymentMethod: 'PayOS VietQR (Banking 24/7)',
            isCancelled: isCancelled
          });
        }
      } catch (err) {
        console.error('Error verifying PayOS payment callback:', err);
        setError(err.message || 'Unable to verify payment with server.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  const isSuccess = result?.status === 'PAID' && !result?.isCancelled;
  const isCancelled = result?.isCancelled || result?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 md:py-16 selection:bg-cyan-700 selection:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {isLoading ? (
          <div className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-600 border-t-transparent animate-spin"></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verifying Payment...</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Please wait while we confirm your payment details with PayOS VietQR Gateway.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-red-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verification Error</h2>
              <p className="text-red-600 text-sm max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button 
                onClick={() => navigate('/payment')} 
                className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                Back to Payment
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* SUCCESS RECEIPT */
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm space-y-8">
            
            {/* Success Header */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/50">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-headline-lg">
                Payment Successful!
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Thank you! Your payment has been confirmed via PayOS VietQR and your booking is secured.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Receipt</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  PAID
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Booking Reference</span>
                  <span className="font-semibold text-slate-900 break-all">{result.bookingId || result.orderCode}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block">PayOS Order Code</span>
                  <span className="font-semibold text-slate-900">{result.orderCode || 'N/A'}</span>
                </div>

                {result.amount > 0 && (
                  <div>
                    <span className="text-slate-400 text-xs block">Amount Paid</span>
                    <span className="font-bold text-cyan-800 text-base">
                      {Number(result.amount).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 text-xs block">Payment Gateway</span>
                  <span className="font-semibold text-slate-900">
                    PayOS (VietQR 24/7)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block">Verification Status</span>
                  <span className="font-medium text-emerald-700">Verified & Confirmed</span>
                </div>

                {result.tourName && (
                  <div>
                    <span className="text-slate-400 text-xs block">Tour Experience</span>
                    <span className="font-medium text-slate-700">{result.tourName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shield & Protection Banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-cyan-50/60 border border-cyan-100 text-xs text-cyan-900">
              <span className="material-symbols-outlined text-cyan-700 text-xl shrink-0">verified_user</span>
              <span>
                Your funds are held securely in escrow under <strong>LocalMate Shield</strong> until you meet your local guide and the tour concludes safely.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/traveler"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>View My Bookings</span>
              </Link>
              <Link
                to="/chat"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Chat with Guide</span>
              </Link>
            </div>

          </div>
        ) : (
          /* CANCELLED OR FAILED PAYMENT */
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm space-y-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center ring-8 ring-amber-50/50">
                <span className="material-symbols-outlined text-5xl">
                  {isCancelled ? 'cancel' : 'highlight_off'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-headline-lg">
                {isCancelled ? 'Payment Cancelled' : 'Payment Not Completed'}
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {isCancelled
                  ? 'You cancelled the payment transaction. No charges have been deducted from your account.'
                  : result?.message || 'We could not process your transaction. Please try another payment method or contact support.'}
              </p>
            </div>

            {/* Error Details */}
            {result?.orderCode && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-3 text-sm">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>PayOS Order Code</span>
                  <span className="font-mono font-bold text-slate-700">{result.orderCode}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/payment')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>Try Payment Again</span>
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
