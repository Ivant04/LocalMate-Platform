import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import { API_BASE_URL } from '../config/api';
import { formatRateVND, formatVND } from '../utils/formatCurrency';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    customersCount: 0,
    helpersCount: 0,
    activeCount: 0,
  });

  const [escrowSummary, setEscrowSummary] = useState({
    totalHeldInEscrow: 0,
    totalReleased: 0,
    totalPlatformFee: 0,
    activeEscrowsCount: 0,
    activeEscrows: []
  });

  const [allUsers, setAllUsers] = useState([]);
  const [pendingHelpers, setPendingHelpers] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, helpersRes, escrowRes, withdrawalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/users`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/helpers`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/bookings/escrow/summary`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/wallet/admin/pending-withdrawals`).catch(() => null),
      ]);

      let usersList = [];
      let helpersList = [];

      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData)) usersList = uData;
      }

      if (helpersRes && helpersRes.ok) {
        const hData = await helpersRes.json();
        if (Array.isArray(hData)) helpersList = hData;
      }

      if (escrowRes && escrowRes.ok) {
        const eData = await escrowRes.json();
        if (eData) setEscrowSummary(eData);
      }

      if (withdrawalsRes && withdrawalsRes.ok) {
        const wData = await withdrawalsRes.json();
        if (Array.isArray(wData)) setPendingWithdrawals(wData);
      }

      const totalUsers = usersList.length;
      const customersCount = usersList.filter((u) =>
        (u.roles || []).some((r) => r.toUpperCase().includes('TRAVELER'))
      ).length;
      const helpersCount = helpersList.length;
      const activeCount = usersList.filter(
        (u) => (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
      ).length;

      setStats({
        totalUsers,
        customersCount,
        helpersCount,
        activeCount,
      });

      // Sort recent users to top
      setAllUsers([...usersList].reverse());

      // Helper applications waiting for approval: verified === false
      const unverified = helpersList.filter((h) => h.verified === false);
      setPendingHelpers(unverified);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true }),
      });

      if (res.ok) {
        showToast(`Đã duyệt xác thực cho Local Helper ${name}!`);
        setPendingHelpers((prev) => prev.filter((h) => h.id !== id && h.userId !== id));
      } else {
        showToast(`Phê duyệt thất bại. Vui lòng thử lại!`);
      }
    } catch (err) {
      console.error('Error approving helper:', err);
      showToast(`Lỗi khi phê duyệt xác thực helper!`);
    }
  };

  const handleReject = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu của ${name}?`)) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/helpers/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OFFLINE' }),
        }).catch(() => null);

        showToast(`Đã từ chối hồ sơ của ${name}.`);
        setPendingHelpers((prev) => prev.filter((h) => h.id !== id && h.userId !== id));
      } catch (err) {
        console.error('Error rejecting helper:', err);
      }
    }
  };

  const handleAdminRelease = async (bookingId) => {
    if (!window.confirm("Admin xác nhận giải ngân 90% tiền ký quỹ Escrow cho Local Helper?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/escrow/release`, { method: 'POST' });
      if (res.ok) {
        showToast("✓ Đã giải ngân thành công 90% cho Helper!");
        fetchDashboardData();
      } else {
        alert("Lỗi khi giải ngân ký quỹ.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  const handleAdminRefund = async (bookingId) => {
    if (!window.confirm("Admin xác nhận hoàn trả 100% tiền ký quỹ Escrow lại cho Du khách?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/escrow/refund`, { method: 'POST' });
      if (res.ok) {
        showToast("✓ Đã hoàn trả 100% tiền ký quỹ cho Du khách!");
        fetchDashboardData();
      } else {
        alert("Lỗi khi hoàn tiền ký quỹ.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  const handleApproveWithdrawal = async (walletId, transactionId, helperName, amount) => {
    if (!window.confirm(`Xác nhận Admin đã chuyển khoản ${formatVND(amount)} cho ${helperName} và phê duyệt lệnh rút tiền?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/wallet/admin/approve-withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, transactionId })
      });
      if (res.ok) {
        showToast(`✓ Đã duyệt và xác nhận chuyển khoản ${formatVND(amount)} cho ${helperName}!`);
        fetchDashboardData();
      } else {
        alert("Lỗi khi phê duyệt lệnh rút tiền.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  const handleRejectWithdrawal = async (walletId, transactionId, helperName, amount) => {
    const reason = window.prompt(`Nhập lý do từ chối yêu cầu rút tiền của ${helperName} (Số tiền ${formatVND(amount)} sẽ được hoàn lại vào ví cho Helper):`, "Thông tin số tài khoản hoặc ngân hàng không chính xác");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/wallet/admin/reject-withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, transactionId, reason })
      });
      if (res.ok) {
        showToast(`✓ Đã từ chối và hoàn lại ${formatVND(amount)} về ví của ${helperName}!`);
        fetchDashboardData();
      } else {
        alert("Lỗi khi từ chối lệnh rút tiền.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase().trim();
    const name = (u.fullName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(s) || email.includes(s) || phone.includes(s);
  });

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'accounts'

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Trung tâm Quản trị LocalMate</h1>
          <p className="text-xs text-slate-500 font-medium">Báo cáo phân tích dữ liệu hệ thống & quản lý tài khoản</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            title="Làm mới dữ liệu hệ thống"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Làm mới
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống trực tuyến (Beta)
          </span>
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/70">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'analytics'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            Phân tích Dữ liệu & Lưu lượng (10 ngày)
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'accounts'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            Quản lý Người dùng & Duyệt hồ sơ
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* Analytics KPI 4-Card Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Metric 1: GMV Total Escrow */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <span className="text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md font-bold text-xs">
                    Ký quỹ Escrow
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Tổng giá trị GMV</h3>
                  <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{formatVND(escrowSummary.totalHeldInEscrow + escrowSummary.totalReleased)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Qua hệ thống thanh toán & ký quỹ</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Đang giữ ký quỹ (HELD):</span>
                  <span className="font-bold text-amber-700">{formatVND(escrowSummary.totalHeldInEscrow)}</span>
                </div>
              </div>

              {/* Metric 2: Net Commission = 10% */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                  </div>
                  <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-bold text-xs">
                    10% Phí sàn
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Hoa hồng sàn (Net)</h3>
                  <p className="text-2xl text-teal-900 mt-0.5 font-extrabold">{formatVND(escrowSummary.totalPlatformFee)}</p>
                  <p className="text-[11px] text-teal-600 mt-1 font-semibold">10% từ tour giải ngân</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Đã giải ngân Helper (90%):</span>
                  <span className="font-bold text-emerald-700">{formatVND(escrowSummary.totalReleased)}</span>
                </div>
              </div>

              {/* Metric 3: Traffic 10 Days = 255 Visits (20-30 visits/day) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">visibility</span>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                    <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>
                    Ổn định
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Lượt truy cập 10 ngày</h3>
                  <p className="text-2xl text-cyan-900 mt-0.5 font-extrabold">255 lượt</p>
                  <p className="text-[11px] text-slate-500 mt-1">TB: <strong>25.5 lượt/ngày</strong></p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Tổng lượt xem trang:</span>
                  <span className="font-bold text-cyan-800">1,142 trang</span>
                </div>
              </div>

              {/* Metric 4: Testing Users */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                  <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-bold text-xs">
                    Unique
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Khách review (Users)</h3>
                  <p className="text-2xl text-teal-900 mt-0.5 font-extrabold">5 người</p>
                  <p className="text-[11px] text-slate-500 mt-1"><strong>Số đánh giá:</strong> 5</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Số điểm:</span>
                  <span className="font-bold text-teal-700">5.0</span>
                </div>
              </div>

            </section>

            {/* Visual SVG Chart: 10 Days Traffic Curve (20 - 30 visits/day) & Flat 0 VND Revenue */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-700 text-xl">show_chart</span>
                    Biểu đồ Lưu lượng Truy cập & Doanh thu (10 ngày gần đây)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Biểu diễn chi tiết lượt truy cập dao động 20 - 30 lượt/ngày; Doanh thu thực tế ở mức 0 VNĐ.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-700"></span>
                    <span className="text-slate-700 font-semibold">Lượt truy cập (20 - 30 lượt/ngày)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-slate-400">Doanh thu GMV (0 VNĐ - Thực tế)</span>
                  </div>
                </div>
              </div>

              {/* SVG Area */}
              <div className="relative w-full h-72 pt-2">
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[11px] font-bold text-slate-400 text-right w-10">
                  <span>35</span>
                  <span>30</span>
                  <span>25</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>

                <div className="ml-12 mr-4 h-full flex flex-col justify-between">
                  <svg className="w-full h-56 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 220">
                    <defs>
                      <linearGradient id="trafficGradientReact" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0e7490" stopOpacity="0.25"></stop>
                        <stop offset="100%" stopColor="#0e7490" stopOpacity="0.01"></stop>
                      </linearGradient>
                    </defs>

                    {/* Reference lines */}
                    <line x1="0" y1="10" x2="1000" y2="10" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1"></line>
                    <line x1="0" y1="46" x2="1000" y2="46" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1"></line>
                    <line x1="0" y1="77" x2="1000" y2="77" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1"></line>
                    <line x1="0" y1="108" x2="1000" y2="108" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1"></line>
                    <line x1="0" y1="154" x2="1000" y2="154" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1"></line>
                    <line x1="0" y1="200" x2="1000" y2="200" stroke="#cbd5e1" strokeWidth="1.5"></line>

                    {/* Flat Revenue line at 0 VND (y=200) */}
                    <line x1="0" y1="200" x2="1000" y2="200" stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="2.5"></line>

                    {/* Traffic curve for 10 days: 22, 25, 28, 21, 29, 24, 27, 23, 30, 26 */}
                    <path d="M 0,87 L 111,71 L 222,56 L 333,92 L 444,51 L 555,77 L 666,61 L 777,82 L 888,46 L 1000,66 L 1000,200 L 0,200 Z" fill="url(#trafficGradientReact)"></path>
                    <path d="M 0,87 L 111,71 L 222,56 L 333,92 L 444,51 L 555,77 L 666,61 L 777,82 L 888,46 L 1000,66" fill="none" stroke="#0e7490" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>

                    {/* Point circles */}
                    <circle cx="0" cy="87" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="111" cy="71" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="222" cy="56" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="333" cy="92" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="444" cy="51" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="555" cy="77" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="666" cy="61" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="777" cy="82" r="4.5" fill="#0e7490" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="888" cy="46" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5"></circle>
                    <circle cx="1000" cy="66" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2"></circle>
                  </svg>

                  {/* Day labels */}
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                    <span className="text-center">10/10<br /><span className="text-cyan-800 font-extrabold">22</span></span>
                    <span className="text-center">11/10<br /><span className="text-cyan-800 font-extrabold">25</span></span>
                    <span className="text-center">12/10<br /><span className="text-cyan-800 font-extrabold">28</span></span>
                    <span className="text-center">13/10<br /><span className="text-cyan-800 font-extrabold">21</span></span>
                    <span className="text-center">14/10<br /><span className="text-cyan-800 font-extrabold">29</span></span>
                    <span className="text-center">15/10<br /><span className="text-cyan-800 font-extrabold">24</span></span>
                    <span className="text-center">16/10<br /><span className="text-cyan-800 font-extrabold">27</span></span>
                    <span className="text-center">17/10<br /><span className="text-cyan-800 font-extrabold">23</span></span>
                    <span className="text-center">18/10<br /><span className="text-amber-600 font-extrabold">30 ★</span></span>
                    <span className="text-center">19/10<br /><span className="text-emerald-600 font-extrabold">26</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Dive Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Daily Table (5 cols) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Bảng chi tiết 10 ngày qua</h3>
                      <p className="text-[11px] text-slate-400">Số lượt truy cập từng ngày cụ thể</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">255 lượt</span>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2 text-[11px]">
                          <th className="py-2">Ngày</th>
                          <th className="py-2 text-center">Lượt truy cập</th>
                          <th className="py-2 text-center">Khách mới</th>
                          <th className="py-2 text-right">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr><td className="py-1.5">10/10/2026</td><td className="text-center font-bold text-cyan-800">22</td><td className="text-center text-slate-400">15</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">11/10/2026</td><td className="text-center font-bold text-cyan-800">25</td><td className="text-center text-slate-400">18</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">12/10/2026</td><td className="text-center font-bold text-cyan-800">28</td><td className="text-center text-slate-400">19</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">13/10/2026</td><td className="text-center font-bold text-cyan-800">21</td><td className="text-center text-slate-400">14</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">14/10/2026</td><td className="text-center font-bold text-cyan-800">29</td><td className="text-center text-slate-400">20</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">15/10/2026</td><td className="text-center font-bold text-cyan-800">24</td><td className="text-center text-slate-400">16</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">16/10/2026</td><td className="text-center font-bold text-cyan-800">27</td><td className="text-center text-slate-400">17</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr><td className="py-1.5">17/10/2026</td><td className="text-center font-bold text-cyan-800">23</td><td className="text-center text-slate-400">15</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr className="bg-amber-50/40"><td className="py-1.5 font-bold text-amber-800">18/10/2026 (Cao điểm)</td><td className="text-center font-black text-amber-600">30</td><td className="text-center text-slate-400">22</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                        <tr className="bg-emerald-50/40"><td className="py-1.5 font-bold text-emerald-800">19/10/2026 (Hôm nay)</td><td className="text-center font-black text-emerald-600">26</td><td className="text-center text-slate-400">12</td><td className="text-right text-slate-400 font-medium">0 đ</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Biên độ dao động:</span>
                  <span className="font-bold text-slate-800">21 - 30 lượt/ngày</span>
                </div>
              </div>

              {/* Top Pages (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Trang được xem nhiều nhất</h3>
                      <p className="text-[11px] text-slate-400">Hành vi người dùng thử nghiệm</p>
                    </div>
                    <span className="material-symbols-outlined text-cyan-700 text-lg">web</span>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-800 truncate">1. Trang chủ (Landing)</span>
                        <span className="font-bold text-cyan-800">486 lượt (42.5%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-700 h-full rounded-full" style={{ width: '42.5%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-800 truncate">2. Tìm kiếm & Lọc Helper</span>
                        <span className="font-bold text-cyan-800">312 lượt (27.3%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: '27.3%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-800 truncate">3. Hồ sơ Helper Detail</span>
                        <span className="font-bold text-cyan-800">195 lượt (17.1%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '17.1%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-800 truncate">4. Khám phá Google Maps</span>
                        <span className="font-bold text-cyan-800">149 lượt (13.1%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: '13.1%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-sm text-amber-500">info</span>
                    Phễu thử nghiệm giao diện:
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    255 Lượt truy cập ➔ 182 Xem Helper ➔ 34 Click Đặt lịch ➔ <strong>0 đơn thanh toán thật</strong> (PayOS đang chạy chế độ Test).
                  </p>
                </div>
              </div>

              {/* Channels & Devices (3 cols) */}
              <div className="lg:col-span-3 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Kênh & Thiết bị</h3>
                      <p className="text-[11px] text-slate-400">Nguồn khách khảo sát</p>
                    </div>
                    <span className="material-symbols-outlined text-cyan-700 text-lg">devices</span>
                  </div>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-cyan-700"></span>
                        Link trực tiếp (Direct)
                      </span>
                      <span className="font-bold text-slate-900">52% (132)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                        Chia sẻ Zalo / FB
                      </span>
                      <span className="font-bold text-slate-900">32% (82)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Tìm kiếm thử nghiệm
                      </span>
                      <span className="font-bold text-slate-900">16% (41)</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-600 block mb-1.5">Tỷ lệ thiết bị:</span>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-cyan-700 h-full" style={{ width: '70%' }} title="Mobile 70%"></div>
                      <div className="bg-teal-600 h-full" style={{ width: '27%' }} title="Desktop 27%"></div>
                      <div className="bg-amber-400 h-full" style={{ width: '3%' }} title="Tablet 3%"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-1.5">
                      <span>Mobile (70%)</span>
                      <span>PC (27%)</span>
                      <span>Tablet (3%)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-700 text-lg">speed</span>
                  <div className="text-[10px]">
                    <p className="font-bold text-cyan-900">Tốc độ tải trang TB</p>
                    <p className="text-cyan-700">1.25s · Phản hồi mượt mà</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 4 Standardized Real Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Stat Card 1 - Total Users */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                  <span className="text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                    Dữ liệu
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Tổng người dùng</h3>
                  <p className="text-2xl text-slate-900 mt-0.5 font-extrabold">{stats.totalUsers}</p>
                </div>
              </div>

              {/* Stat Card 2 - Customers / Travelers */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <Link
                    to="/admin/accounts/customers"
                    className="text-blue-700 hover:underline font-bold text-xs"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Khách du lịch</h3>
                  <p className="text-2xl text-blue-900 mt-0.5 font-extrabold">{stats.customersCount}</p>
                </div>
              </div>

              {/* Stat Card 3 - Local Helpers */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                  </div>
                  <Link
                    to="/admin/accounts/local-helpers"
                    className="text-teal-700 hover:underline font-bold text-xs"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Local Helper</h3>
                  <p className="text-2xl text-teal-900 mt-0.5 font-extrabold">{stats.helpersCount}</p>
                </div>
              </div>

              {/* Stat Card 4 - Active Accounts */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center text-xs">
                    Hoạt động
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Tài khoản hoạt động</h3>
                  <p className="text-2xl text-emerald-700 mt-0.5 font-extrabold">{stats.activeCount}</p>
                </div>
              </div>

            </section>

            {/* Content Section: Real Database Accounts & Helper Approval Requests */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Real Database Users Table */}
              <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-700 text-xl">manage_accounts</span>
                      Tài khoản người dùng trong hệ thống
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Dữ liệu tài khoản thời gian thực từ MongoDB Atlas</p>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                      className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 w-full sm:w-60"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-base pointer-events-none">
                      search
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3 font-bold">Người dùng</th>
                        <th className="py-3 px-3 font-bold">Số điện thoại</th>
                        <th className="py-3 px-3 font-bold">Vai trò</th>
                        <th className="py-3 px-3 font-bold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => {
                          const isHelper = (user.roles || []).some((r) => r.includes('HELPER'));
                          const isAdmin = (user.roles || []).some((r) => r.includes('ADMIN'));
                          const isActive = (user.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                          return (
                            <tr key={user._id || user.id || idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    alt={user.fullName || 'Người dùng'}
                                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{user.fullName || 'Thành viên LocalMate'}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-700">
                                {user.phone || '—'}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${isAdmin
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : isHelper
                                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                >
                                  {isAdmin ? 'Quản trị viên' : isHelper ? 'Local Helper' : 'Du khách'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  ></span>
                                  {isActive ? 'Hoạt động' : 'Bị khóa'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            {loading ? 'Đang tải dữ liệu người dùng...' : 'Không tìm thấy tài khoản phù hợp.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>Hiển thị <strong>{filteredUsers.length}</strong> trên tổng số <strong>{allUsers.length}</strong> tài khoản</span>
                  <div className="flex gap-2">
                    <Link
                      to="/admin/accounts/customers"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
                    >
                      Quản lý khách hàng
                    </Link>
                    <Link
                      to="/admin/accounts/local-helpers"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
                    >
                      Quản lý Helper
                    </Link>
                  </div>
                </div>
              </div>

              {/* Real Helper Verification Approvals from Database */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">verified_user</span>
                    Yêu cầu xác thực Helper
                  </h2>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {pendingHelpers.length} Chờ duyệt
                  </span>
                </div>

                <div className="space-y-3.5 flex-grow overflow-y-auto max-h-[460px]">
                  {pendingHelpers.length > 0 ? (
                    pendingHelpers.map((helper) => {
                      const rawRate = Number(helper.price || helper.hourlyRate) || 0;
                      const rateVND = rawRate < 1000 && rawRate > 0 ? rawRate * 25000 : rawRate || 75000;
                      const displayRate = formatRateVND(rateVND);

                      return (
                        <div key={helper.id || helper.userId} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3">
                          <div className="flex items-center gap-3">
                            <img
                              alt={helper.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              src={helper.avatar || helper.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{helper.name}</h4>
                              <p className="text-xs text-slate-500 truncate">{helper.city || 'Việt Nam'} • {displayRate}</p>
                              <p className="text-[11px] text-teal-700 font-semibold truncate">{Array.isArray(helper.languages) ? helper.languages.join(', ') : 'Tiếng Việt, Tiếng Anh'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => handleApprove(helper.id || helper.userId, helper.name)}
                              className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-800 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => handleReject(helper.id || helper.userId, helper.name)}
                              className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                        task_alt
                      </span>
                      <p className="text-xs font-bold text-slate-700">Tất cả hồ sơ đăng ký đã được xét duyệt!</p>
                      <p className="text-[11px] text-slate-400 mt-1">Khi có Local Helper mới đăng ký, yêu cầu xác thực sẽ hiển thị tại đây.</p>
                    </div>
                  )}
                </div>
              </div>

            </section>

            {/* Escrow Vault Management Section */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-700 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    Quản lý Quỹ Ký Quỹ Escrow (LocalMate Escrow Shield)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống giữ tiền trung gian bảo vệ giao dịch: Khách thanh toán → Giữ tại Quỹ → Hoàn tất tour → Giải ngân 90% cho Helper & 10% phí sàn.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    Đang giữ ký quỹ: {formatVND(escrowSummary.totalHeldInEscrow)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Đã giải ngân: {formatVND(escrowSummary.totalReleased)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Hoa hồng thu (10%): {formatVND(escrowSummary.totalPlatformFee)}
                  </span>
                </div>
              </div>

              {/* 4-Step Escrow Workflow Infographic for Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Bước 1: Khách thanh toán</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Tiền chuyển vào tài khoản ký quỹ trung gian của sàn qua PayOS / VietQR.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Bước 2: Giữ tiền an toàn (HELD)</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">LocalMate khóa tiền ký quỹ, Local Helper chưa thể rút cho đến khi hoàn thành tour.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Bước 3: Xác nhận hoàn thành</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Du khách nhận dịch vụ đúng hẹn và bấm nút xác nhận hài lòng trên Dashboard.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Bước 4: Giải ngân tự động</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Hệ thống giải ngân 90% cho Helper và giữ lại 10% phí vận hành & bảo hiểm sàn.</p>
                  </div>
                </div>
              </div>

              {/* Escrow Orders Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Danh sách đơn ký quỹ đang lưu hành ({escrowSummary.activeEscrows?.length || 0})
                </h3>
                {escrowSummary.activeEscrows && escrowSummary.activeEscrows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3 font-bold">Mã & Tour</th>
                          <th className="py-2.5 px-3 font-bold">Tổng tiền ký quỹ</th>
                          <th className="py-2.5 px-3 font-bold">Phí sàn (10%)</th>
                          <th className="py-2.5 px-3 font-bold">Helper thực nhận (90%)</th>
                          <th className="py-2.5 px-3 font-bold">Trạng thái Escrow</th>
                          <th className="py-2.5 px-3 font-bold text-right">Thao tác Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {escrowSummary.activeEscrows.map((b) => {
                          const price = Number(b.totalPrice) || 0;
                          const fee = b.platformFee || Math.round(price * 0.1);
                          const payout = b.helperPayoutAmount || (price - fee);
                          return (
                            <tr key={b._id || b.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-900">{b.tourName || 'Tour trải nghiệm'}</p>
                                <p className="text-[11px] text-slate-400">ID: {(b._id || b.id).toString().slice(-8)} • {b.bookingDate || 'Sắp tới'}</p>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {formatVND(price)}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600">
                                {formatVND(fee)}
                              </td>
                              <td className="py-3 px-3 font-bold text-emerald-700">
                                {formatVND(payout)}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.escrowStatus === 'RELEASED' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  <span className="material-symbols-outlined text-[13px]">
                                    {b.escrowStatus === 'RELEASED' ? 'check_circle' : 'lock'}
                                  </span>
                                  {b.escrowStatus === 'RELEASED' ? 'Đã giải ngân' : 'Đang ký quỹ (HELD)'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {b.escrowStatus !== 'RELEASED' && (
                                    <>
                                      <button
                                        onClick={() => handleAdminRelease(b._id || b.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                        title="Giải ngân 90% cho Helper"
                                      >
                                        Giải ngân
                                      </button>
                                      <button
                                        onClick={() => handleAdminRefund(b._id || b.id)}
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                                        title="Hoàn trả 100% cho Du khách"
                                      >
                                        Hoàn tiền
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">verified_user</span>
                    <p className="text-xs font-semibold text-slate-600">Hiện không có đơn nào đang bị treo ký quỹ</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tất cả các giao dịch đã hoàn tất hoặc tự động giải ngân khi du khách xác nhận.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Helper Withdrawal Approvals Section */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-700 text-xl">payments</span>
                    Phê duyệt Yêu cầu Rút tiền của Local Helper
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kiểm tra và xác nhận chuyển khoản cho Helper khi có yêu cầu rút tiền từ ví thu nhập.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  pendingWithdrawals.length > 0 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {pendingWithdrawals.length} Yêu cầu chờ duyệt
                </span>
              </div>

              {pendingWithdrawals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3 font-bold">Local Helper</th>
                        <th className="py-2.5 px-3 font-bold">Ngân hàng & Số tài khoản</th>
                        <th className="py-2.5 px-3 font-bold">Số tiền yêu cầu</th>
                        <th className="py-2.5 px-3 font-bold">Thời gian gửi</th>
                        <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                        <th className="py-2.5 px-3 font-bold text-right">Hành động của Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingWithdrawals.map((req) => (
                        <tr key={req.transactionId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{req.helperName}</p>
                            <p className="text-[11px] text-slate-400">{req.email} • {req.phone}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{req.bankInfo?.bankName || 'Ngân hàng'}</p>
                            <p className="text-[11px] text-teal-700 font-mono font-bold">
                              STK: {req.bankInfo?.accountNumber || '—'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">
                              Chủ TK: {req.bankInfo?.accountHolder || req.helperName}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-base font-extrabold text-teal-700">
                              {formatVND(req.amount)}
                            </span>
                            <span className="block text-[10px] text-slate-400">Miễn phí rút</span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(req.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Chờ Admin duyệt
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveWithdrawal(req.walletId, req.transactionId, req.helperName, req.amount)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Xác nhận đã chuyển khoản thành công"
                              >
                                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                Phê duyệt & Đã CK
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(req.walletId, req.transactionId, req.helperName, req.amount)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-all cursor-pointer"
                                title="Từ chối và hoàn tiền về ví cho Helper"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">account_balance_wallet</span>
                  <p className="text-xs font-semibold text-slate-600">Không có yêu cầu rút tiền nào đang chờ duyệt</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Khi Helper gửi lệnh rút tiền từ ví, yêu cầu chuyển khoản sẽ xuất hiện tại đây.</p>
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
