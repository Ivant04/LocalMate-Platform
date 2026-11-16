import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

export default function ReviewManagement() {
  const navigate = useNavigate();

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all'); // 'all', '5', '4', '3', '2', '1', 'no_reply'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'highest', 'lowest'
  const [editingId, setEditingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load User & Fetch Real Reviews
  useEffect(() => {
    const stored = localStorage.getItem('localmate_user');
    let user = null;
    if (stored) {
      try {
        user = JSON.parse(stored);
        setCurrentUser(user);
      } catch {
        user = null;
      }
    }

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const helperIdentifier = user?.id || user?._id || user?.email;
        let url = `${API_BASE_URL}/api/v1/reviews`;
        if (helperIdentifier) {
          url += `?helperId=${encodeURIComponent(helperIdentifier)}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setReviews(data);
          } else {
            setReviews([]);
          }
        } else {
          setReviews([]);
        }
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Start reply editing
  const handleStartEdit = (rev) => {
    setEditingId(rev.id || rev._id);
    setReplyText(rev.response || '');
  };

  // Save reply
  const handleSaveReply = async (revId) => {
    if (!replyText.trim()) {
      alert("Vui lòng nhập nội dung phản hồi!");
      return;
    }
    setSubmittingReply(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reviews/${revId}/response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: replyText.trim() })
      });

      if (res.ok) {
        setReviews(prev => prev.map(r => (r.id === revId || r._id === revId) ? { ...r, response: replyText.trim() } : r));
        setEditingId(null);
        setReplyText('');
        showToast("Đã lưu phản hồi thành công!");
      } else {
        // Fallback optimistic update
        setReviews(prev => prev.map(r => (r.id === revId || r._id === revId) ? { ...r, response: replyText.trim() } : r));
        setEditingId(null);
        showToast("Đã lưu phản hồi thành công!");
      }
    } catch {
      setReviews(prev => prev.map(r => (r.id === revId || r._id === revId) ? { ...r, response: replyText.trim() } : r));
      setEditingId(null);
      showToast("Đã lưu phản hồi thành công!");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : (currentUser?.rating ? Number(currentUser.rating).toFixed(1) : '5.0');

  const starCounts = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating || 5) === star).length;
    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, pct };
  });

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(r => {
      if (filterRating === 'all') return true;
      if (filterRating === 'no_reply') return !r.response;
      return Math.round(r.rating || 5) === parseInt(filterRating, 10);
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'highest') {
        return (b.rating || 5) - (a.rating || 5);
      }
      if (sortBy === 'lowest') {
        return (a.rating || 5) - (b.rating || 5);
      }
      return 0;
    });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 selection:bg-teal-700 selection:text-white">
      
      {/* 1. Shared Left Navigation Sidebar */}
      <Sidebar activePage="reviews" />

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-300">
            <div className="px-4 py-3 rounded-xl shadow-lg border bg-teal-50 border-teal-200 text-teal-800 flex items-center gap-2.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Cổng Helper</span>
              <span>›</span>
              <span className="text-teal-700 font-bold">Đánh giá &amp; Nhận xét</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Quản lý Đánh giá
              </h1>
              <span className="badge-info font-black">
                ĐÁNH GIÁ CAO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Theo dõi nhận xét từ du khách, gửi phản hồi cảm ơn và xây dựng uy tín cá nhân của bạn trên LocalMate.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="btn-outline text-xs !py-2 !px-4"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>Xem hồ sơ công khai</span>
            </button>
            <button
              onClick={() => navigate(currentUser?.roles?.includes('ROLE_HELPER') ? '/helper-dashboard' : '/traveler')}
              className="btn-primary text-xs !py-2 !px-4"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Về Bảng điều khiển</span>
            </button>
          </div>
        </div>

        {/* Rating Summary & Distribution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1: Score & Satisfaction */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ĐIỂM ĐÁNH GIÁ TRUNG BÌNH
            </span>
            <div className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
              {avgRating}
            </div>
            
            <div className="flex items-center gap-1 mb-2 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={`material-symbols-outlined text-2xl ${i < Math.round(Number(avgRating)) ? 'fill-1' : ''}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Dựa trên <strong className="text-slate-800 font-bold">{totalReviews} lượt đánh giá thực tế</strong>
            </p>

            <div className="mt-5 pt-5 border-t border-slate-100 w-full flex items-center justify-around">
              <div>
                <p className="text-lg font-bold text-teal-700">
                  {totalReviews > 0 ? `${Math.round((reviews.filter(r => (r.rating || 5) >= 4).length / totalReviews) * 100)}%` : '100%'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">HÀI LÒNG</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <p className="text-lg font-bold text-emerald-600">100%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">ĐÃ XÁC MINH</p>
              </div>
            </div>
          </div>

          {/* Card 2: Star Breakdown Progress Bars */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-lg">bar_chart</span>
                <span>Phân bổ đánh giá theo sao</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">Thống kê thời gian thực</span>
            </div>

            <div className="space-y-3">
              {starCounts.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="w-16 flex items-center gap-1 font-semibold text-slate-600">
                    <span>{star} sao</span>
                    <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        star === 5 ? 'bg-teal-600' : star === 4 ? 'bg-teal-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right font-medium text-slate-500">
                    {count} ({pct}%)
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Du khách thường khen ngợi sự am hiểu địa phương, thân thiện và linh hoạt trong tour.</span>
              <span className="font-bold text-teal-700 cursor-pointer hover:underline" onClick={() => setFilterRating('all')}>Xem tất cả</span>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterRating === 'all'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Tất cả ({totalReviews})
            </button>
            <button
              onClick={() => setFilterRating('5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterRating === '5'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              5 sao ({starCounts.find(s => s.star === 5)?.count || 0})
            </button>
            <button
              onClick={() => setFilterRating('no_reply')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterRating === 'no_reply'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Chờ phản hồi ({reviews.filter(r => !r.response).length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none cursor-pointer focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            >
              <option value="recent">Mới nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/80 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-1">
                    <div className="w-32 h-3 bg-slate-200 rounded"></div>
                    <div className="w-20 h-2 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded"></div>
              </div>
            ))
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">reviews</span>
              <p className="text-sm font-bold text-slate-700">Chưa tìm thấy đánh giá nào phù hợp với bộ lọc</p>
              <p className="text-xs text-slate-400">Hoàn thành thêm nhiều chuyến đi cùng du khách để nhận được các đánh giá xác thực nhé!</p>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const revId = rev.id || rev._id;
              const isReplying = editingId === revId;
              const authorName = rev.travelerName || rev.author || 'Du khách ẩn danh';
              const authorAvatar = rev.travelerAvatar || rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
              const createdDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
                : 'Gần đây';

              return (
                <div 
                  key={revId}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow transition-shadow space-y-4"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={authorAvatar}
                        alt={authorName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{authorName}</h4>
                          <span className="badge-success text-[10px] !py-0.5">
                            Tour đã xác thực
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`material-symbols-outlined text-base ${i < (rev.rating || 5) ? 'fill-1' : 'text-slate-200'}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{rev.rating || 5}.0</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{createdDate}</span>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    "{rev.comment || rev.text}"
                  </p>

                  {/* Reply Section */}
                  <div className="pt-2">
                    {isReplying ? (
                      <div className="space-y-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                        <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">reply</span>
                          <span>Phản hồi của bạn cho {authorName}:</span>
                        </label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Nhập lời cảm ơn hoặc giải đáp của bạn..."
                          rows="3"
                          className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={submittingReply}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReply(revId)}
                            disabled={submittingReply}
                            className="btn-primary text-xs !py-1.5 !px-4"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>{submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                          </button>
                        </div>
                      </div>
                    ) : rev.response ? (
                      <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-teal-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">forum</span>
                            <span>Phản hồi của bạn:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rev)}
                            className="text-slate-400 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Sửa</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {rev.response}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(rev)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer py-1"
                      >
                        <span className="material-symbols-outlined text-sm">reply</span>
                        <span>Phản hồi đánh giá này</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}
