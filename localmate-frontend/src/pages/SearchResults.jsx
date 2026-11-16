import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { formatRateVND, formatVND } from '../utils/formatCurrency';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Real guides from Database
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [city, setCity] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [priceMax, setPriceMax] = useState(1000000);
  const [minRating, setMinRating] = useState(4.0);
  const [language, setLanguage] = useState('All');
  const [favorites, setFavorites] = useState([]);

  // Fetch from database
  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setGuides(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch helpers from backend:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  // Sync state from query params on mount
  useEffect(() => {
    const loc = searchParams.get('location');
    const lang = searchParams.get('lang');
    if (loc) setCity(loc);
    if (lang) setLanguage(lang);
  }, [searchParams]);

  // Update query params when filters change
  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (city) params.location = city;
    if (language && language !== 'All') params.lang = language;
    setSearchParams(params);
  };

  const handleReset = () => {
    setCity('');
    setSelectedExpertise([]);
    setPriceMax(1000000);
    setMinRating(4.0);
    setLanguage('All');
    setSearchParams({});
  };

  const toggleExpertise = (exp) => {
    if (selectedExpertise.includes(exp)) {
      setSelectedExpertise(selectedExpertise.filter(item => item !== exp));
    } else {
      setSelectedExpertise([...selectedExpertise, exp]);
    }
  };

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  // Filter Logic
  const filteredGuides = guides.filter(guide => {
    // City filter (case & accent insensitive, partial match)
    if (city) {
      const q = normalize(city);
      const gCity = normalize(guide.city || '');
      const gCountry = normalize(guide.country || '');
      const gLoc = normalize(guide.location || '');
      if (!gCity.includes(q) && !gCountry.includes(q) && !gLoc.includes(q)) {
        return false;
      }
    }
    // Price filter (normalized to VND)
    let gPrice = Number(guide.price || guide.hourlyRate || 0);
    if (gPrice > 0 && gPrice < 1000) {
      gPrice = Math.round(gPrice * 25000);
    }
    if (gPrice > priceMax) {
      return false;
    }
    // Rating filter
    if ((guide.rating || 5) < minRating) {
      return false;
    }
    // Language filter
    if (language && language !== 'All') {
      const matchLang = guide.languages && guide.languages.some(l => l.toLowerCase().includes(language.toLowerCase()));
      if (!matchLang) return false;
    }
    // Expertise filter
    if (selectedExpertise.length > 0) {
      const match = selectedExpertise.some(exp =>
        guide.expertises && guide.expertises.some(e => e.toUpperCase().includes(exp.toUpperCase()))
      );
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs max-h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-lg">tune</span>
                <h2 className="text-base text-slate-900 font-bold">Bộ lọc tìm kiếm</h2>
              </div>
              <button
                onClick={handleReset}
                className="text-teal-700 hover:text-teal-900 font-bold text-xs hover:underline cursor-pointer"
              >
                Đặt lại
              </button>
            </div>

            <form onSubmit={handleFilterSubmit} className="space-y-4">
              {/* Filter: City */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700">Điểm đến</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    placeholder="Hà Nội, Đà Nẵng, Hội An..."
                  />
                </div>
              </div>

              {/* Filter: Expertise */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-700">Chuyên môn / Kỹ năng</label>
                <div className="space-y-1.5">
                  {[
                    { key: 'culture', label: 'Văn hóa & Nghệ thuật' },
                    { key: 'foodie', label: 'Ẩm thực & Đời sống đêm' },
                    { key: 'photography', label: 'Nhiếp ảnh & Check-in' },
                    { key: 'translation', label: 'Phiên dịch & Hướng dẫn' }
                  ].map(exp => (
                    <label key={exp.key} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedExpertise.includes(exp.key)}
                        onChange={() => toggleExpertise(exp.key)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{exp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter: Price Range */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">Giá tối đa / giờ</label>
                  <span className="text-xs text-teal-800 font-extrabold">{formatRateVND(priceMax)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-700"
                />
              </div>

              {/* Filter: Rating */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700">Đánh giá tối thiểu</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMinRating(4.0)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${minRating === 4.0
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    4.0+ ★
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinRating(4.5)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${minRating === 4.5
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    4.5+ ★
                  </button>
                </div>
              </div>

              {/* Filter: Language */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700">Ngôn ngữ</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 rounded-xl text-xs font-medium cursor-pointer outline-none transition-all"
                >
                  <option value="All">Tất cả ngôn ngữ</option>
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="English">Tiếng Anh (English)</option>
                  <option value="Spanish">Tiếng Tây Ban Nha</option>
                  <option value="Japanese">Tiếng Nhật</option>
                  <option value="French">Tiếng Pháp</option>
                  <option value="Italian">Tiếng Ý</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl mt-3"
              >
                Áp dụng bộ lọc
              </button>
            </form>
          </div>
        </aside>

        {/* Main Search Results Content */}
        <section className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Local Helper {city ? `tại ${city}` : 'Toàn quốc'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Tìm thấy <strong className="text-teal-800">{filteredGuides.length}</strong> người đồng hành sẵn sàng dẫn tour
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/')}
                className="btn-outline text-xs py-2 px-3.5"
              >
                <span className="material-symbols-outlined text-[16px] text-teal-700">map</span>
                <span>Xem trên bản đồ</span>
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredGuides.map((guide) => (
                <div key={guide.id} className="card-bento flex flex-col md:flex-row overflow-hidden group">
                  <div className="w-full md:w-[280px] md:min-w-[280px] md:max-w-[280px] h-60 md:h-auto relative overflow-hidden bg-slate-100 shrink-0">
                    <img
                      className="w-full h-full md:absolute md:inset-0 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      alt={guide.name}
                      src={guide.img}
                    />
                    <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-slate-200/80">
                      <span className="material-symbols-outlined text-sm text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-extrabold text-slate-900">{guide.rating}</span>
                      <span className="text-slate-400 text-[11px]">({guide.reviewsCount || 0})</span>
                    </div>
                  </div>

                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors">{guide.name}</h3>
                          <span className="material-symbols-outlined text-teal-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Helper đã xác thực">verified</span>
                          
                          {/* Helper Availability Status Badge */}
                          {(!guide.availabilityStatus || guide.availabilityStatus === 'AVAILABLE') && (
                            <span className="badge-success text-[10px] py-0.5 px-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              SẴN SÀNG
                            </span>
                          )}
                          {guide.availabilityStatus === 'BUSY' && (
                            <span className="badge-warning text-[10px] py-0.5 px-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              ĐANG BẬN
                            </span>
                          )}
                          {guide.availabilityStatus === 'OFFLINE' && (
                            <span className="badge-neutral text-[10px] py-0.5 px-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              NGOẠI TUYẾN
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-teal-700">{formatRateVND(guide.price)}</span>
                          <span className="text-[10px] text-slate-600 block">/ giờ</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(guide.expertises || []).map(exp => (
                          <span key={exp} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-semibold border border-slate-200">
                            {exp}
                          </span>
                        ))}
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                        {guide.description || guide.bio}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-teal-600">language</span>
                          <span>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-teal-600">location_on</span>
                          <span>{guide.city || guide.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/helper/${guide.id}`)}
                        className="flex-1 btn-primary text-xs py-2.5"
                      >
                        Xem hồ sơ &amp; Đặt tour
                      </button>
                      <button
                        onClick={() => toggleFavorite(guide.id)}
                        className={`p-2.5 border rounded-xl transition-all cursor-pointer ${favorites.includes(guide.id)
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                          }`}
                        title="Lưu yêu thích"
                      >
                        <span className="material-symbols-outlined text-lg" style={favorites.includes(guide.id) ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">search_off</span>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy Helper phù hợp</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Vui lòng thử mở rộng mức giá hoặc đổi điểm đến khác để tìm kiếm nhiều kết quả hơn.
              </p>
              <button onClick={handleReset} className="btn-primary">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
