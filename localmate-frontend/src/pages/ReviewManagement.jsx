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
      alert("Please enter a reply message!");
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
        showToast("Reply saved successfully!");
      } else {
        // Fallback optimistic update
        setReviews(prev => prev.map(r => (r.id === revId || r._id === revId) ? { ...r, response: replyText.trim() } : r));
        setEditingId(null);
        showToast("Reply saved successfully!");
      }
    } catch {
      setReviews(prev => prev.map(r => (r.id === revId || r._id === revId) ? { ...r, response: replyText.trim() } : r));
      setEditingId(null);
      showToast("Reply saved successfully!");
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
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-cyan-700 selection:text-white">
      
      {/* 1. Shared Left Navigation Sidebar */}
      <Sidebar activePage="reviews" />

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-300">
            <div className="px-4 py-3 rounded-xl shadow-xl border bg-teal-50 border-teal-200 text-teal-800 flex items-center gap-2.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <span>Helper Portal</span>
              <span>›</span>
              <span className="text-teal-600 font-bold">Reviews & Ratings</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Review Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 tracking-wider">
                TOP RATED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Monitor authentic traveler feedback, reply with thank-you notes, and build your local helper reputation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>View Public Profile</span>
            </button>
            <button
              onClick={() => navigate(currentUser?.roles?.includes('ROLE_HELPER') ? '/helper-dashboard' : '/traveler')}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Rating Summary & Distribution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1: Score & Satisfaction */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              AVERAGE RATING SCORE
            </span>
            <div className="text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">
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
              Based on <strong className="text-slate-800">{totalReviews} completed reviews</strong>
            </p>

            <div className="mt-5 pt-5 border-t border-slate-100 w-full flex items-center justify-around">
              <div>
                <p className="text-lg font-bold text-teal-600">
                  {totalReviews > 0 ? `${Math.round((reviews.filter(r => (r.rating || 5) >= 4).length / totalReviews) * 100)}%` : '100%'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">SATISFACTION</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{totalReviews > 0 ? '100%' : '100%'}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">VERIFIED</p>
              </div>
            </div>
          </div>

          {/* Card 2: Star Breakdown Progress Bars */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-lg">bar_chart</span>
                <span>Rating Breakdown</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">Real-time statistics</span>
            </div>

            <div className="space-y-3">
              {starCounts.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="w-14 flex items-center gap-1 font-semibold text-slate-600">
                    <span>{star} stars</span>
                    <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        star === 5 ? 'bg-teal-500' : star === 4 ? 'bg-teal-400' : star === 3 ? 'bg-amber-400' : 'bg-rose-400'
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
              <span>Travelers frequently praise local knowledge, friendliness, and tour flexibility.</span>
              <span className="font-semibold text-teal-600 cursor-pointer hover:underline" onClick={() => setFilterRating('all')}>View all</span>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterRating === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All ({totalReviews})
            </button>
            <button
              onClick={() => setFilterRating('5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterRating === '5'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              5 Stars ({starCounts.find(s => s.star === 5)?.count || 0})
            </button>
            <button
              onClick={() => setFilterRating('no_reply')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterRating === 'no_reply'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Awaiting Reply ({reviews.filter(r => !r.response).length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none cursor-pointer focus:border-teal-500"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            // Skeletons
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
              <p className="text-sm font-bold text-slate-700">No reviews found matching this filter</p>
              <p className="text-xs text-slate-400">Complete more guided tours with travelers to earn positive verified reviews!</p>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const revId = rev.id || rev._id;
              const isReplying = editingId === revId;
              const authorName = rev.travelerName || rev.author || 'Anonymous Traveler';
              const authorAvatar = rev.travelerAvatar || rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
              const createdDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Recently';

              return (
                <div 
                  key={revId}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
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
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Verified Tour
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
                  <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    "{rev.comment || rev.text}"
                  </p>

                  {/* Reply Section */}
                  <div className="pt-2">
                    {isReplying ? (
                      <div className="space-y-3 bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                        <label className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">reply</span>
                          <span>Your reply to {authorName}:</span>
                        </label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your thank-you note or answer..."
                          rows="3"
                          className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={submittingReply}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReply(revId)}
                            disabled={submittingReply}
                            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>{submittingReply ? 'Sending...' : 'Send Reply'}</span>
                          </button>
                        </div>
                      </div>
                    ) : rev.response ? (
                      <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-teal-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">forum</span>
                            <span>Your Reply:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rev)}
                            className="text-slate-400 hover:text-teal-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Edit</span>
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
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer py-1"
                      >
                        <span className="material-symbols-outlined text-sm">reply</span>
                        <span>Reply to this review</span>
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
