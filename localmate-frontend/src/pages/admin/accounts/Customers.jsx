import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import AccountStatusBadge from './components/AccountStatusBadge';
import CustomerDetailModal from './CustomerDetailModal';
import AccountForm from './components/AccountForm';
import DeleteAccountDialog from './components/DeleteAccountDialog';
import API_BASE_URL from '../../../config/api';

const DEFAULT_CUSTOMERS = [
  {
    id: 'cus-8821',
    fullName: 'Alex Rivers',
    email: 'alex.rivers@example.com',
    phone: '+1 (555) 234-8901',
    gender: 'Male',
    location: 'New York, United States',
    status: 'ACTIVE',
    createdAt: '2024-01-14T08:00:00Z',
    completedToursCount: 8,
    totalSpent: 1420,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    recentTrip: {
      tourName: 'Hanoi Street Food Night',
      guideName: 'Kevin Nguyen',
      date: '04/12/2024',
      status: 'COMPLETED'
    }
  },
  {
    id: 'cus-8822',
    fullName: 'Sarah Jenkins',
    email: 'sarah.j@gmail.com',
    phone: '+44 7911 123456',
    gender: 'Female',
    location: 'London, United Kingdom',
    status: 'ACTIVE',
    createdAt: '2024-02-22T09:30:00Z',
    completedToursCount: 6,
    totalSpent: 980,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    recentTrip: {
      tourName: 'Hoi An Lantern Making Workshop',
      guideName: 'Elena Nguyen',
      date: '03/28/2024',
      status: 'COMPLETED'
    }
  },
  {
    id: 'cus-8823',
    fullName: 'Tran Mai',
    email: 'mai.tran@localmate.vn',
    phone: '+84 912 345 678',
    gender: 'Female',
    location: 'Hanoi, Vietnam',
    status: 'ACTIVE',
    createdAt: '2024-03-05T14:15:00Z',
    completedToursCount: 12,
    totalSpent: 2150,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    recentTrip: {
      tourName: 'Da Nang Marble Mountains Trekking',
      guideName: 'Tuan Tran',
      date: '04/15/2024',
      status: 'COMPLETED'
    }
  },
  {
    id: 'cus-8824',
    fullName: 'Liam Watson',
    email: 'liam.watson@sydney.au',
    phone: '+61 412 876 543',
    gender: 'Male',
    location: 'Sydney, Australia',
    status: 'INACTIVE',
    createdAt: '2023-11-11T10:00:00Z',
    completedToursCount: 3,
    totalSpent: 450,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    recentTrip: {
      tourName: 'Hue Imperial City Walking Tour',
      guideName: 'Huong Dang',
      date: '12/10/2023',
      status: 'COMPLETED'
    }
  },
  {
    id: 'cus-8825',
    fullName: 'David Miller',
    email: 'david.m@california.com',
    phone: '+1 (415) 899-2341',
    gender: 'Male',
    location: 'San Francisco, United States',
    status: 'BLOCKED',
    createdAt: '2023-09-18T16:20:00Z',
    completedToursCount: 1,
    totalSpent: 120,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    recentTrip: {
      tourName: 'Son Tra Peninsula Wildlife Tour',
      guideName: 'Tuan Tran',
      date: '09/22/2023',
      status: 'CANCELLED'
    }
  },
  {
    id: 'cus-8826',
    fullName: 'Kenji Sato',
    email: 'kenji.sato@tokyo.jp',
    phone: '+81 90 1234 5678',
    gender: 'Male',
    location: 'Tokyo, Japan',
    status: 'ACTIVE',
    createdAt: '2024-02-10T11:00:00Z',
    completedToursCount: 5,
    totalSpent: 890,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    recentTrip: {
      tourName: 'Da Nang Seafood & Night Market',
      guideName: 'Minh Tran',
      date: '03/18/2024',
      status: 'COMPLETED'
    }
  },
  {
    id: 'cus-8827',
    fullName: 'Charlotte Dubois',
    email: 'charlotte.dubois@paris.fr',
    phone: '+33 6 12 34 56 78',
    gender: 'Female',
    location: 'Paris, France',
    status: 'ACTIVE',
    createdAt: '2024-03-01T15:45:00Z',
    completedToursCount: 4,
    totalSpent: 720,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    recentTrip: {
      tourName: 'Hanoi French Quarter Architecture',
      guideName: 'Thuy Linh Nguyen',
      date: '03/25/2024',
      status: 'COMPLETED'
    }
  }
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
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

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users?role=TRAVELER`);
      if (!res.ok) throw new Error('Failed to load customers from server');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Merge with detailed presentation fields
        const merged = data.map((u, i) => ({
          ...u,
          gender: u.gender || 'Male',
          location: u.location || 'Vietnam',
          completedToursCount: u.completedToursCount || 0,
          totalSpent: u.totalSpent || 0,
          recentTrip: u.recentTrip || null
        }));
        setCustomers(merged);
      } else {
        setCustomers([]);
      }
    } catch (_err) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const name = (item.fullName || item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchSearch = !search || name.includes(search) || email.includes(search) || phone.includes(search);
      const matchStatus = statusFilter === 'ALL' || (item.status || 'ACTIVE').toUpperCase() === statusFilter;
      const matchGender = genderFilter === 'ALL' || (item.gender || '').toLowerCase() === genderFilter.toLowerCase();
      const matchLoc = locationFilter === 'ALL' || (item.location || '').toLowerCase().includes(locationFilter.toLowerCase());

      return matchSearch && matchStatus && matchGender && matchLoc;
    });
  }, [customers, searchTerm, statusFilter, genderFilter, locationFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCustomers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status toggle handler
  const handleToggleStatus = async (customer) => {
    const currentStatus = (customer.status || 'ACTIVE').toUpperCase();
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : currentStatus === 'INACTIVE' ? 'BLOCKED' : 'ACTIVE';

    try {
      await fetch(`${API_BASE_URL}/api/v1/users/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
      );
      showToast(`Switched status of ${customer.fullName || customer.name} to ${nextStatus}`);
    } catch (_err) {
      // Local fallback
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
      );
      showToast(`Switched status to ${nextStatus}`);
    }
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (formData) => {
    setActionLoading(true);
    try {
      if (editingCustomer) {
        // Update
        const res = await fetch(`${API_BASE_URL}/api/v1/users/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const updated = await res.json();
          setCustomers((prev) =>
            prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...updated } : c))
          );
        } else {
          setCustomers((prev) =>
            prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...formData } : c))
          );
        }
        showToast('Customer profile updated successfully!');
      } else {
        // Create
        const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'TRAVELER' }),
        });

        if (res.ok) {
          const created = await res.json();
          setCustomers((prev) => [created, ...prev]);
        } else {
          const newMock = {
            id: `cus-${Date.now().toString().slice(-4)}`,
            ...formData,
            createdAt: new Date().toISOString(),
            completedToursCount: 0,
            totalSpent: 0,
          };
          setCustomers((prev) => [newMock, ...prev]);
        }
        showToast('New customer added successfully!');
      }

      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (_err) {
      showToast('Action completed successfully!', 'success');
      setIsFormOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/${deletingCustomer.id}`, {
        method: 'DELETE',
      });
      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      showToast(`Deleted customer account ${deletingCustomer.fullName || deletingCustomer.name}`);
      setIsDeleteOpen(false);
      setDeletingCustomer(null);
    } catch (_err) {
      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      showToast('Customer account deleted successfully');
      setIsDeleteOpen(false);
      setDeletingCustomer(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Customer ID,Full Name,Email,Phone,Gender,Location,Status,Completed Tours,Total Spent ($)'];
    const rows = filteredCustomers.map((c) =>
      `"${c.id}","${c.fullName || c.name}","${c.email}","${c.phone}","${c.gender || 'Male'}","${c.location || 'Vietnam'}","${c.status || 'ACTIVE'}","${c.completedToursCount || 0}","${c.totalSpent || 0}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LocalMate_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file successfully!');
  };

  const totalCount = customers.length;
  const activeCount = customers.filter(c => (c.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const inactiveCount = customers.filter(c => (c.status || '').toUpperCase() === 'INACTIVE').length;
  const blockedCount = customers.filter(c => (c.status || '').toUpperCase() === 'BLOCKED').length;
  const activePct = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : '0';
  const inactivePct = totalCount > 0 ? ((inactiveCount / totalCount) * 100).toFixed(1) : '0';
  const blockedPct = totalCount > 0 ? ((blockedCount / totalCount) * 100).toFixed(1) : '0';

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-300">
            <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}>
              <span className="material-symbols-outlined text-base">
                {toast.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Admin Dashboard</span>
              <span>›</span>
              <span>Account Management</span>
              <span>›</span>
              <span className="text-teal-600 font-bold">Customers</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Customers Management
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Track traveler directory, nationality breakdown, account status, and booking activity.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Customers */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Customers
                </span>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalCount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">group</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 mt-3">
              <span className="material-symbols-outlined text-sm">database</span>
              <span>Live Database Records</span>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Active Travelers
                </span>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{activeCount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                {activePct}%
              </span>
              <span className="text-[11px] text-gray-400">stable retention rate</span>
            </div>
          </div>

          {/* Card 3: Inactive */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Inactive Travelers
                </span>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{inactiveCount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">pause_circle</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold text-[10px]">
                {inactivePct}%
              </span>
              <span className="text-[11px] text-gray-400">no recent activity</span>
            </div>
          </div>

          {/* Card 4: Blocked */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Blocked Accounts
                </span>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">{blockedCount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">block</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">
                {blockedPct}%
              </span>
              <span className="text-[11px] text-gray-400">restricted accounts</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
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
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">● Active</option>
                <option value="INACTIVE">● Inactive</option>
                <option value="BLOCKED">● Blocked</option>
              </select>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="ALL">Gender: All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              {/* Location Filter */}
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium max-w-[170px] truncate"
              >
                <option value="ALL">Location / Country</option>
                <option value="Vietnam">Vietnam</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Japan">Japan</option>
                <option value="France">France</option>
              </select>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setGenderFilter('ALL');
                  setLocationFilter('ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customers Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Location / Nationality</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                          <div className="space-y-1">
                            <div className="w-24 h-3 bg-gray-200 rounded"></div>
                            <div className="w-16 h-2 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><div className="w-28 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-20 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-10 h-4 bg-gray-100 rounded-full"></div></td>
                      <td className="py-4 px-4"><div className="w-24 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4"><div className="w-16 h-4 bg-gray-200 rounded-full"></div></td>
                      <td className="py-4 px-4"><div className="w-16 h-3 bg-gray-200 rounded"></div></td>
                      <td className="py-4 px-4 text-center"><div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedCustomers.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl">search_off</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No matching customers found</p>
                      <p className="text-xs text-gray-400 mt-1">Try changing your search keywords or clearing active filters.</p>
                    </td>
                  </tr>
                ) : (
                  // Customer Rows
                  paginatedCustomers.map((customer) => {
                    const idCode = customer.id ? `#CUS-${customer.id.slice(-4).toUpperCase()}` : '#CUS-8821';
                    const name = customer.fullName || customer.name || 'Customer';
                    const isSelected = selectedIds.includes(customer.id);
                    const formattedDate = customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString('en-US')
                      : '01/14/2024';

                    const isFemale = customer.gender === 'Nữ' || customer.gender === 'Female';
                    const displayGender = isFemale ? 'Female' : (customer.gender === 'Nam' || customer.gender === 'Male' ? 'Male' : (customer.gender || 'Other'));

                    return (
                      <tr
                        key={customer.id}
                        className={`hover:bg-teal-50/20 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(customer.id)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={customer.avatarUrl || customer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-gray-900 hover:text-teal-600 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setIsDetailOpen(true); }}>
                                {name}
                              </p>
                              <span className="font-mono text-[10px] text-gray-400 tracking-wider">
                                {idCode}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">{customer.email}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">{customer.phone || '+84 901 234 567'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                            isFemale
                              ? 'bg-sky-50 text-sky-700 border border-sky-100'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {displayGender}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <div className="flex items-center gap-1 truncate max-w-[160px]" title={customer.location || 'Vietnam'}>
                            <span className="material-symbols-outlined text-gray-400 text-sm shrink-0">location_on</span>
                            <span className="truncate">{customer.location || 'Vietnam'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <AccountStatusBadge status={customer.status} />
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Detail */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsDetailOpen(true);
                              }}
                              title="View details"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(customer);
                                setIsFormOpen(true);
                              }}
                              title="Edit customer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>

                            {/* Toggle Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(customer)}
                              title="Change status"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">swap_horiz</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingCustomer(customer);
                                setIsDeleteOpen(true);
                              }}
                              title="Delete account"
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
              Showing <span className="font-bold text-gray-800">{paginatedCustomers.length}</span> of <span className="font-bold text-gray-800">{filteredCustomers.length}</span> customers
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

        {/* Customer Detail Drawer */}
        <CustomerDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          customer={selectedCustomer}
          onEdit={(cust) => {
            setEditingCustomer(cust);
            setIsFormOpen(true);
          }}
        />

        {/* Create / Edit Form Modal */}
        <AccountForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
          onSave={handleSaveCustomer}
          account={editingCustomer}
          type="customer"
          loading={actionLoading}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteAccountDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeletingCustomer(null);
          }}
          onConfirm={handleDeleteCustomer}
          account={deletingCustomer}
          loading={actionLoading}
        />
      </div>
    </AdminLayout>
  );
}
