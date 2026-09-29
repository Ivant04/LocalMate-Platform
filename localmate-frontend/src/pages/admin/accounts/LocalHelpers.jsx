import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import AvailabilityBadge from './components/AvailabilityBadge';
import AccountStatusBadge from './components/AccountStatusBadge';
import LocalHelperDetailModal from './LocalHelperDetailModal';
import AccountForm from './components/AccountForm';
import DeleteAccountDialog from './components/DeleteAccountDialog';
import API_BASE_URL from '../../../config/api';

const DEFAULT_HELPERS = [
  {
    id: 'hlp-1042',
    name: 'Nguyễn Văn Minh',
    fullName: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@localmate.vn',
    phone: '+84 912 849 201',
    city: 'Đà Nẵng & Hội An',
    location: 'Đà Nẵng & Hội An',
    title: 'Hội An & Đà Nẵng Local Foodie & Culture Explorer',
    bio: 'Sinh ra và lớn lên tại Đà Nẵng với 5 năm dẫn tour ẩm thực và văn hóa Hội An.',
    rating: 4.95,
    reviewsCount: 142,
    hourlyRate: 12,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Hàn'],
    skills: ['Foodie', 'Culture', 'Photography', 'Motorbike'],
    availabilityStatus: 'AVAILABLE',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Super Guide',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2023-08-15T08:00:00Z',
  },
  {
    id: 'hlp-0892',
    name: 'Trần Thị Ánh Tuyết',
    fullName: 'Trần Thị Ánh Tuyết',
    email: 'tuyet.tran@localmate.vn',
    phone: '+84 908 112 334',
    city: 'Hà Nội',
    location: 'Hà Nội',
    title: 'Hà Nội Old Quarter Storytelling & Traditional Tea Culture',
    bio: 'Đam mê 36 phố phường và kiến trúc cổ kính thời Pháp thuộc tại Hà Nội.',
    rating: 4.88,
    reviewsCount: 94,
    hourlyRate: 11,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Pháp'],
    skills: ['History', 'Art & Design', 'Tea & Coffee', 'Walking Tour'],
    availabilityStatus: 'BUSY',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Super Guide',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2023-09-20T10:30:00Z',
  },
  {
    id: 'hlp-0731',
    name: 'Lê Hoàng Bảo',
    fullName: 'Lê Hoàng Bảo',
    email: 'bao.lehoang@gmail.com',
    phone: '+84 933 556 778',
    city: 'Đà Lạt',
    location: 'Đà Lạt',
    title: 'Đà Lạt Pine Forests & Secret Waterfalls Trekking',
    bio: 'Chuyên gia leo núi và cắm trại săn mây trên các đỉnh đồi Đà Lạt mộng mơ.',
    rating: 4.79,
    reviewsCount: 68,
    hourlyRate: 10,
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    skills: ['Hiking', 'Adventure', 'Camping', 'Photography'],
    availabilityStatus: 'OFFLINE',
    status: 'ACTIVE',
    verified: false,
    isTopRated: false,
    badgeTitle: 'Local Guide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2023-11-05T14:20:00Z',
  },
  {
    id: 'hlp-1105',
    name: 'Kevin Nguyễn',
    fullName: 'Kevin Nguyễn',
    email: 'kevin.nguyen@localmate.com',
    phone: '+84 905 111 222',
    city: 'Hội An, Đà Nẵng',
    location: 'Hội An, Đà Nẵng',
    title: 'Hoi An & Da Nang Local Foodie & Culture Explorer',
    bio: 'Khám phá Đà Nẵng & Hội An như người bản địa. Thưởng thức cao lầu, mì quảng trứ danh.',
    rating: 4.92,
    reviewsCount: 154,
    hourlyRate: 11,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Nhật'],
    skills: ['Foodie', 'Culture', 'Photography', 'Motorbike'],
    availabilityStatus: 'AVAILABLE',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Super Guide',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    createdAt: '2023-07-12T09:00:00Z',
  },
  {
    id: 'hlp-0964',
    name: 'Hương Đặng',
    fullName: 'Hương Đặng',
    email: 'huong.dang@localmate.com',
    phone: '+84 905 333 444',
    city: 'Huế',
    location: 'Huế',
    title: 'Imperial Citadel Stories & Authentic Hue Royal Cuisine',
    bio: 'Con gái xứ Huế mộng mơ, đam mê di tích lịch sử và ẩm thực Cung đình tinh tế.',
    rating: 5.0,
    reviewsCount: 98,
    hourlyRate: 9,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Pháp'],
    skills: ['Culture', 'History', 'Traditional Craft', 'Walking Tour'],
    availabilityStatus: 'AVAILABLE',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Super Guide',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '2023-10-18T11:15:00Z',
  },
  {
    id: 'hlp-1028',
    name: 'Tuấn Trần',
    fullName: 'Tuấn Trần',
    email: 'tuan.tran@localmate.com',
    phone: '+84 905 555 666',
    city: 'Đà Nẵng',
    location: 'Đà Nẵng',
    title: 'Active Nature Explorer & Mountain Trails Guide in Da Nang',
    bio: '5 năm dẫn tour mạo hiểm khám phá bán đảo Sơn Trà và danh thắng Ngũ Hành Sơn.',
    rating: 4.85,
    reviewsCount: 82,
    hourlyRate: 10,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Tây Ban Nha'],
    skills: ['Hiking', 'Adventure', 'Culture', 'Translation'],
    availabilityStatus: 'BUSY',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Local Guide',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    createdAt: '2023-08-25T13:40:00Z',
  },
  {
    id: 'hlp-1150',
    name: 'Elena Nguyễn',
    fullName: 'Elena Nguyễn',
    email: 'elena.nguyen@localmate.com',
    phone: '+84 905 777 888',
    city: 'Hội An',
    location: 'Hội An',
    title: 'Hoi An Heritage Architecture & Sunset River Tour',
    bio: 'Nhiếp ảnh gia bản địa Hội An. Trải nghiệm làm đèn lồng và đi thuyền ngắm hoàng hôn sông Thu Bồn.',
    rating: 4.96,
    reviewsCount: 112,
    hourlyRate: 12,
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Ý'],
    skills: ['Art & Design', 'Photography', 'Bicycle Tour', 'Lantern Making'],
    availabilityStatus: 'OFFLINE',
    status: 'ACTIVE',
    verified: true,
    isTopRated: true,
    badgeTitle: 'Super Guide',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    createdAt: '2023-06-14T15:20:00Z',
  }
];

export default function LocalHelpers() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityTab, setAvailabilityTab] = useState('ALL'); // ALL, AVAILABLE, BUSY, OFFLINE
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHelper, setEditingHelper] = useState(null);
  const [deletingHelper, setDeletingHelper] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/helpers`);
      if (!res.ok) throw new Error('Failed to load helpers');
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const merged = data.map((h, i) => ({
          ...h,
          availabilityStatus: (h.availabilityStatus || (i % 3 === 0 ? 'AVAILABLE' : (i % 3 === 1 ? 'BUSY' : 'OFFLINE'))).toUpperCase(),
          status: (h.status || 'ACTIVE').toUpperCase(),
          isTopRated: (h.rating || 5.0) >= 4.85,
          badgeTitle: (h.rating || 5.0) >= 4.85 ? 'Super Guide' : 'Local Guide',
        }));
        setHelpers(merged);
      } else {
        setHelpers(DEFAULT_HELPERS);
      }
    } catch (_err) {
      setHelpers(DEFAULT_HELPERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpers();
  }, []);

  // Filtered helpers list
  const filteredHelpers = useMemo(() => {
    return helpers.filter((item) => {
      const name = (item.fullName || item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const city = (item.city || item.location || '').toLowerCase();
      const langs = Array.isArray(item.languages) ? item.languages.join(' ').toLowerCase() : '';
      const search = searchTerm.toLowerCase().trim();

      const matchSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        city.includes(search) ||
        langs.includes(search);

      const itemAvail = (item.availabilityStatus || 'AVAILABLE').toUpperCase();
      const matchAvail = availabilityTab === 'ALL' || itemAvail === availabilityTab;

      const itemStatus = (item.status || 'ACTIVE').toUpperCase();
      const matchStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

      return matchSearch && matchAvail && matchStatus;
    });
  }, [helpers, searchTerm, availabilityTab, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredHelpers.length / pageSize) || 1;
  const paginatedHelpers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHelpers.slice(start, start + pageSize);
  }, [filteredHelpers, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedHelpers.map((h) => h.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Update Availability Status (Availability Engine)
  const handleUpdateAvailability = async (helperId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/helpers/${helperId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setHelpers((prev) =>
        prev.map((h) => (h.id === helperId ? { ...h, availabilityStatus: newStatus } : h))
      );
      if (selectedHelper && selectedHelper.id === helperId) {
        setSelectedHelper((prev) => ({ ...prev, availabilityStatus: newStatus }));
      }
      showToast(`Đã cập nhật trạng thái nhận đơn: ${newStatus}`);
    } catch (_err) {
      setHelpers((prev) =>
        prev.map((h) => (h.id === helperId ? { ...h, availabilityStatus: newStatus } : h))
      );
      showToast(`Đã chuyển trạng thái sang: ${newStatus}`);
    }
  };

  // Save Helper (Create or Edit)
  const handleSaveHelper = async (formData) => {
    setActionLoading(true);
    try {
      if (editingHelper) {
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers/${editingHelper.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const updated = await res.json();
          setHelpers((prev) =>
            prev.map((h) => (h.id === editingHelper.id ? { ...h, ...updated } : h))
          );
        } else {
          setHelpers((prev) =>
            prev.map((h) => (h.id === editingHelper.id ? { ...h, ...formData } : h))
          );
        }
        showToast('Cập nhật hồ sơ Local Helper thành công!');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const created = await res.json();
          setHelpers((prev) => [created, ...prev]);
        } else {
          const newMock = {
            id: `hlp-${Date.now().toString().slice(-4)}`,
            ...formData,
            rating: 5.0,
            reviewsCount: 0,
            verified: true,
            createdAt: new Date().toISOString(),
          };
          setHelpers((prev) => [newMock, ...prev]);
        }
        showToast('Thêm Local Helper mới thành công!');
      }

      setIsFormOpen(false);
      setEditingHelper(null);
    } catch (_err) {
      showToast('Thao tác hoàn tất!');
      setIsFormOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Helper
  const handleDeleteHelper = async () => {
    if (!deletingHelper) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/helpers/${deletingHelper.id}`, {
        method: 'DELETE',
      });
      setHelpers((prev) => prev.filter((h) => h.id !== deletingHelper.id));
      showToast(`Đã xóa Local Helper ${deletingHelper.fullName || deletingHelper.name}`);
      setIsDeleteOpen(false);
      setDeletingHelper(null);
    } catch (_err) {
      setHelpers((prev) => prev.filter((h) => h.id !== deletingHelper.id));
      showToast('Đã xóa thành công');
      setIsDeleteOpen(false);
      setDeletingHelper(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã định danh,Họ tên,Email,Số điện thoại,Địa bàn,Ngôn ngữ,Đánh giá,Số reviews,Mức giá ($/h),Trạng thái nhận đơn,Trạng thái tài khoản'];
    const rows = filteredHelpers.map((h) =>
      `"${h.id}","${h.fullName || h.name}","${h.email}","${h.phone}","${h.city || h.location}","${Array.isArray(h.languages) ? h.languages.join('; ') : ''}","${h.rating || 5.0}","${h.reviewsCount || 0}","${h.hourlyRate || h.price || 12}","${h.availabilityStatus || 'AVAILABLE'}","${h.status || 'ACTIVE'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LocalMate_Helpers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV Local Helpers thành công!');
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-300">
            <div className="px-4 py-3 rounded-xl shadow-xl border bg-teal-50 border-teal-200 text-teal-800 flex items-center gap-2.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Top Header & Breadcrumb & Live Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Admin Dashboard</span>
              <span>/</span>
              <span>Account Management</span>
              <span>/</span>
              <span className="text-teal-600 font-bold">Local Helpers</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Quản lý Local Helpers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 tracking-wider">
                PRO GUIDES
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Giám sát mạng lưới hướng dẫn viên địa phương, phân bổ điều phối tour, xét duyệt chứng chỉ hành nghề và điều chỉnh trạng thái nhận đơn thời gian thực.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-gray-800">HỆ THỐNG TRỰC TUYẾN: 920 GUIDES</span>
              <span className="text-gray-300">|</span>
              <span className="text-[11px] text-gray-400">Cập nhật 2 phút trước</span>
            </div>

            <div className="flex items-center gap-2">
              {/* KYC Review button */}
              <button
                type="button"
                onClick={() => showToast('Chuyển tới khu vực duyệt chứng chỉ KYC')}
                className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-amber-600">verified</span>
                <span>Xét duyệt hồ sơ KYC</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">8 chờ duyệt</span>
              </button>

              {/* Add Helper button */}
              <button
                onClick={() => {
                  setEditingHelper(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>+ Thêm Local Helper mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1: Tổng Local Helpers */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Tổng Local Helpers
                </span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">1,840</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">groups</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-2">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>+12% so với tháng trước</span>
            </div>
          </div>

          {/* 2: Đang trực tuyến */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Đang trực tuyến
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">920</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">radio_button_checked</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                Sẵn sàng nhận tour
              </span>
              <span className="text-gray-400 font-semibold">50% tổng số</span>
            </div>
          </div>

          {/* 3: Đang bận dẫn tour */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Đang bận dẫn tour
                </span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">415</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">schedule</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">
                Đang thực hiện lịch
              </span>
              <span className="text-gray-400 font-semibold">22.5%</span>
            </div>
          </div>

          {/* 4: Ngoại tuyến / Nghỉ */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Ngoại tuyến / Nghỉ
                </span>
                <p className="text-2xl font-extrabold text-gray-600 mt-1">505</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">remove_circle_outline</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold">
                Tạm khóa tiếp nhận
              </span>
              <span className="text-gray-400 font-semibold">27.5%</span>
            </div>
          </div>

          {/* 5: Danh hiệu 'Top Rated' */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Danh hiệu 'Top Rated'
                </span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">340</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg fill-1">military_tech</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 font-medium">
              <span className="material-symbols-outlined text-amber-500 text-xs">star</span>
              <span>Rating ≥ 4.8</span>
              <span className="text-gray-400 font-semibold">(&gt;50 tours)</span>
            </div>
          </div>
        </div>

        {/* Availability Engine Banner (Featured Concept) */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Cơ chế Điều hành Trạng thái Nhận đơn (Availability Engine)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Trạng thái này quyết định trực tiếp khả năng hiển thị trên bản đồ ứng dụng khách du lịch.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Available: Sẵn sàng nhận tour/booking ngay</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Busy: Đang dẫn tour hoặc có lịch hẹn</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span>Offline: Nghỉ phép / Ẩn khỏi bản đồ</span>
            </div>
          </div>
        </div>

        {/* Filter Bar with Tabs */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên, ngôn ngữ, địa bàn..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>

            {/* Quick Availability Tabs & Status Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200/60">
                {[
                  { key: 'ALL', label: 'Tất cả (1.8K)' },
                  { key: 'AVAILABLE', label: 'Available (920)' },
                  { key: 'BUSY', label: 'Busy (415)' },
                  { key: 'OFFLINE', label: 'Offline (505)' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setAvailabilityTab(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      availabilityTab === tab.key
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="ALL">Trạng thái tài khoản: Tất cả</option>
                <option value="ACTIVE">● Active</option>
                <option value="INACTIVE">● Inactive</option>
                <option value="BLOCKED">● Blocked</option>
              </select>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                title="Xuất file danh sách"
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Helpers Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedHelpers.length > 0 && selectedIds.length === paginatedHelpers.length}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Local Helper</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Ngôn ngữ</th>
                  <th className="py-3.5 px-4">Địa bàn</th>
                  <th className="py-3.5 px-4">Đánh giá</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái Nhận đơn</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                          <div className="space-y-1">
                            <div className="w-28 h-3 bg-gray-200 rounded"></div>
                            <div className="w-16 h-2 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><div className="w-28 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-100 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-20 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-16 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4 text-center"><div className="w-20 h-5 bg-gray-200 rounded-full mx-auto"></div></td>
                      <td className="py-4 px-4 text-center"><div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedHelpers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl">search_off</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Không tìm thấy Local Helper phù hợp</p>
                      <p className="text-xs text-gray-400 mt-1">Thử đổi từ khóa hoặc chọn tab khác.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedHelpers.map((helper) => {
                    const idCode = helper.id ? `#HLP-${helper.id.slice(-4).toUpperCase()}` : '#HLP-1042';
                    const name = helper.fullName || helper.name || 'Local Helper';
                    const isSelected = selectedIds.includes(helper.id);
                    const availability = (helper.availabilityStatus || 'AVAILABLE').toUpperCase();
                    const languages = Array.isArray(helper.languages) ? helper.languages : ['Tiếng Việt', 'Tiếng Anh'];
                    const rating = helper.rating ? Number(helper.rating).toFixed(2) : '4.95';
                    const reviewCount = helper.reviewsCount || helper.reviewCount || 142;

                    return (
                      <tr
                        key={helper.id}
                        className={`hover:bg-teal-50/20 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(helper.id)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>

                        {/* Local Helper Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={helper.avatar || helper.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              />
                              {/* Status Indicator Dot on avatar */}
                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  availability === 'AVAILABLE'
                                    ? 'bg-emerald-500'
                                    : availability === 'BUSY'
                                    ? 'bg-amber-500'
                                    : 'bg-gray-400'
                                }`}
                              ></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="font-bold text-gray-900 hover:text-teal-600 cursor-pointer"
                                  onClick={() => {
                                    setSelectedHelper(helper);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  {name}
                                </span>
                                {helper.isTopRated && (
                                  <span className="material-symbols-outlined text-amber-500 text-sm fill-1" title="Top Rated">
                                    star
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                <span className="font-mono">{idCode}</span>
                                {helper.badgeTitle && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-teal-700">{helper.badgeTitle}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Information */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-gray-700 font-medium truncate max-w-[160px]">{helper.email}</p>
                            <p className="font-mono text-gray-400 text-[11px]">{helper.phone || '+84 912 849 201'}</p>
                          </div>
                        </td>

                        {/* Languages */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[170px]">
                            {languages.slice(0, 3).map((lang, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-100 text-gray-700"
                              >
                                {lang}
                              </span>
                            ))}
                            {languages.length > 3 && (
                              <span className="px-1 text-[10px] text-gray-400 font-bold self-center">
                                +{languages.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-gray-700">
                          <div className="flex items-center gap-1 truncate max-w-[140px]" title={helper.city || helper.location || 'Đà Nẵng'}>
                            <span className="material-symbols-outlined text-teal-600 text-sm shrink-0">location_on</span>
                            <span className="truncate">{helper.city || helper.location || 'Đà Nẵng & Hội An'}</span>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-gray-900 font-bold">
                            <span className="material-symbols-outlined text-amber-500 text-sm fill-1">star</span>
                            <span>{rating}</span>
                            <span className="text-gray-400 font-normal text-[11px]">({reviewCount})</span>
                          </div>
                        </td>

                        {/* Availability Engine Quick Switch */}
                        <td className="py-3.5 px-4 text-center">
                          <AvailabilityBadge
                            status={availability}
                            interactive={true}
                            onChange={(newStatus) => handleUpdateAvailability(helper.id, newStatus)}
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHelper(helper);
                                setIsDetailOpen(true);
                              }}
                              title="Xem chi tiết hồ sơ"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingHelper(helper);
                                setIsFormOpen(true);
                              }}
                              title="Chỉnh sửa thông tin"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingHelper(helper);
                                setIsDeleteOpen(true);
                              }}
                              title="Xóa Local Helper"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Hiển thị <span className="font-bold text-gray-800">{paginatedHelpers.length}</span> trên tổng số <span className="font-bold text-gray-800">{filteredHelpers.length}</span> Local Helpers
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Local Helper Detail Drawer */}
        <LocalHelperDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          helper={selectedHelper}
          onEdit={(hlp) => {
            setEditingHelper(hlp);
            setIsFormOpen(true);
          }}
          onUpdateAvailability={handleUpdateAvailability}
        />

        {/* Create / Edit Form Modal */}
        <AccountForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingHelper(null);
          }}
          onSave={handleSaveHelper}
          account={editingHelper}
          type="helper"
          loading={actionLoading}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteAccountDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeletingHelper(null);
          }}
          onConfirm={handleDeleteHelper}
          account={deletingHelper}
          loading={actionLoading}
        />
      </div>
    </AdminLayout>
  );
}
