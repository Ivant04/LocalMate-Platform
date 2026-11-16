import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlacesAutocompleteInput from '../components/PlacesAutocompleteInput';
import GoogleMapsExplore from '../components/GoogleMapsExplore';
import { API_BASE_URL } from '../config/api';
import { formatRateVND } from '../utils/formatCurrency';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchWhen, setSearchWhen] = useState('');
  const [searchLang, setSearchLang] = useState('Tiếng Việt');

  const [allGuides, setAllGuides] = useState([]);
  const [featuredGuides, setFeaturedGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(true);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(searchLocation)}&when=${encodeURIComponent(searchWhen)}&lang=${encodeURIComponent(searchLang)}`);
  };

  useEffect(() => {
    const fetchGuides = async () => {
      setLoadingGuides(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/helpers`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllGuides(data);
            setFeaturedGuides(data.slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Failed to load helpers from database:', err);
      } finally {
        setLoadingGuides(false);
      }
    };
    fetchGuides();
  }, []);

  const customerReviews = [
    {
      name: "James Wilson",
      text: "Kevin thật tuyệt vời! Anh ấy đã dẫn chúng tôi đến một quán Mì Quảng nhỏ trong hẻm Hội An mà nếu tự đi chắc chắn chúng tôi không bao giờ tìm thấy. Bữa ăn ngon nhất cả chuyến đi. LocalMate đặt tour rất tiện lợi.",
      rating: 5,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbYRfLM-LxkRq3a3V473eGDYBv5jDjF5kEmW2WyoJMjqKNWSJ6lRMiXmAfhrhkWeLdNL44_eVHVAnlwuGirQ2VgTCwOyE6PYGQsnVuE6O4J053RD-PdGRcSTF-iQnDGt2pacjHqwrsFecEJ5XgOqv2DVlqpM86p49j0Q4sNHCAbsX9kFvSaX_kvcXv_4ursGyfjOJ4L0jx4HJODG5_CASyxJ-ZNFKM7L5eqdJKrAiHXznoogf_KXzAJXxryY7hlP0Ma1xf-PV0s-0"
    },
    {
      name: "David Chen",
      text: "Trải nghiệm ở Huế cùng Hướng là kỷ niệm đáng nhớ nhất mùa hè của tôi. Kiến thức lịch sử và ẩm thực địa phương của anh ấy rất sâu sắc, gợi ý quán ăn nào cũng xuất sắc!",
      rating: 5,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-MkWEJACjcU-08gkihmxo_ArgNZOTBrlVsP6BIwDkaQ9_Mxa5iH4188dNm6IA6iOBwm38ZyICt0XPV0wqEZYz4uJ97eSFm_XDMBixmunyPwXslYOTuFX-B8L3YSSwMyQndtcfRP51nWXbcSfmbp1Xbx5pVW4gbvb59RZRlUBJ7U8UPVokRR5BxU1k8qbMdypTxJWOWZWUUM9fnzKMf6N2uXw8wv6Sh52DE8c7MetOLEErfT30LE7K8KH0SE5OXZmmN9REUhAHJnQ"
    },
    {
      name: "Sarah Miller",
      text: "Lúc đầu đi du lịch Đà Nẵng một mình tôi khá lo lắng, nhưng gặp được Elena đã thay đổi tất cả. Như đi cùng một người bạn thân lâu năm. Rất an toàn và vui vẻ!",
      rating: 5,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlSR7Vd6VyakH3edggpio0MqPrb7E1EGt9z_3u1SDWcYS6ODvGh-D1Uz3FQesjVfc6SYhHBFLW9URg3cgYezF7uaoJXLG7DcutP5tL-xynzp2t51cILSVqB1qcOMdDpLgkgIEASWd3uLTyBxEBo0vAIiCKd20OEE6jP6KVz-GKq9TuyvHAaHsnGwvl8VGPtbFP1PWCEtYYdsryFw9p0joxa6GbQ3JewJQXRMEOLip0xuXayfMHlhvqAgE3kY_FLTb1n8-uKLj1PU"
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-10">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt="European cobblestone street at sunset"
            src="https://www.rehahnphotographer.com/wp-content/uploads/2018/08/20-photos-to-visit-hoi-an-rehahn-vietnam.webp"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto mt-8 sm:mt-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 text-teal-800 text-xs font-bold mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            Kết nối hơn 500+ Local Helper được xác thực tại Việt Nam
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-slate-900 tracking-tight leading-[1.15]">
            Khám phá thế giới qua <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-700 bg-clip-text text-transparent">
              Góc nhìn Bản địa
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-700 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Kết nối với những người bạn đồng hành địa phương được kiểm duyệt, cùng trải nghiệm những nét văn hóa đích thực, ẩm thực tinh túy và những câu chuyện thú vị với sự an toàn tuyệt đối từ Quỹ Ký quỹ Escrow.
          </p>

          {/* Search Bar Widget */}
          <form onSubmit={handleSearch} className="w-full bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-xl p-3 md:p-2.5 flex flex-col md:flex-row gap-2 border border-slate-200/90 text-left">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200 group">
              <span className="material-symbols-outlined text-teal-700 mr-3 text-2xl">location_on</span>
              <div className="text-left w-full">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">ĐỊA ĐIỂM</label>
                <PlacesAutocompleteInput
                  value={searchLocation}
                  onChange={setSearchLocation}
                  onSelectPlace={(place) => setSearchLocation(place.name || place.city || '')}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Bạn muốn đi đâu? (Hà Nội, Hội An...)"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <span className="material-symbols-outlined text-teal-700 mr-3 text-2xl">calendar_month</span>
              <div className="text-left w-full">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">THỜI GIAN</label>
                <input
                  type="text"
                  value={searchWhen}
                  onChange={(e) => setSearchWhen(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Chọn ngày khởi hành"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3">
              <span className="material-symbols-outlined text-teal-700 mr-3 text-2xl">language</span>
              <div className="text-left w-full">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">NGÔN NGỮ</label>
                <select
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-900 appearance-none outline-none cursor-pointer"
                >
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="English">Tiếng Anh (English)</option>
                  <option value="Spanish">Tiếng Tây Ban Nha</option>
                  <option value="French">Tiếng Pháp</option>
                  <option value="Japanese">Tiếng Nhật</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary py-3.5 px-8 text-base rounded-xl md:rounded-2xl">
              <span className="material-symbols-outlined text-xl">search</span>
              <span>Tìm Local Helper</span>
            </button>
          </form>
        </div>
      </section>

      {/* Intro Section (Bento Style) */}
      <section className="py-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xs flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2 block">TRIẾT LÝ LOCALMATE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-5 tracking-tight">Trải nghiệm như người bản xứ.</h2>
            <p className="text-slate-600 font-normal leading-relaxed mb-8 text-base">
              LocalMate kết nối du khách với những người bạn đồng hành địa phương am hiểu. Chúng tôi tin rằng trải nghiệm du lịch trọn vẹn nhất không nằm trong những trang sách quảng cáo, mà trong từng ngõ nhỏ, từng quán ăn mộc mạc và câu chuyện chân thật của người dân nơi đây.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200/80">
                <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-xs font-bold text-slate-800">100% Đã kiểm duyệt hồ sơ</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="text-xs font-bold text-emerald-900">Ký quỹ Escrow an toàn</span>
              </div>
              <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-full border border-teal-200">
                <span className="material-symbols-outlined text-teal-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                <span className="text-xs font-bold text-teal-900">Hỗ trợ du khách 24/7</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative overflow-hidden rounded-3xl group border border-slate-200/80 shadow-2xs min-h-[300px]">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Guide and traveler sharing a meal"
              src="https://withlocals-com-res.cloudinary.com/image/upload/w_796,h_448,c_fill,g_auto,q_auto,dpr_2.0,f_auto/destinations/vietnam/Ho%20Chi%20Minh/Cu%20chi%20tunnels%20Shore%20Excursion/Cu_Chi_Tunnels_Shore_Excursion"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">Văn hóa & Ẩm thực</p>
                <p className="font-bold text-base">Khám phá ẩm thực đường phố cùng người bản địa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200/60" id="how-it-works">
        <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 block">HÀNH TRÌNH TRẢI NGHIỆM</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Cách LocalMate Hoạt Động</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto mb-14">
            Quy trình 3 bước đơn giản, minh bạch và an toàn tuyệt đối với cơ chế giữ tiền Ký quỹ Escrow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col items-center hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">search_check</span>
              </div>
              <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mb-3">1</span>
              <h3 className="font-bold text-lg mb-3 text-slate-900">Tìm Người Đồng Hành</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khám phá hồ sơ Helper uy tín theo điểm đến, ngôn ngữ giao tiếp, mức giá và các đánh giá thực tế.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col items-center hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-cyan-50 text-cyan-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mb-3">2</span>
              <h3 className="font-bold text-lg mb-3 text-slate-900">Nhắn Tin &amp; Tùy Chỉnh Tour</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trực tiếp trao đổi lịch trình, đặt câu hỏi và thỏa thuận thời gian với Helper qua hệ thống chat thời gian thực.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col items-center hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mb-3">3</span>
              <h3 className="font-bold text-lg mb-3 text-slate-900">Khám Phá An Tâm (Escrow)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tiền thanh toán được giữ an toàn ở Quỹ Escrow và chỉ giải ngân cho Helper sau khi chuyến đi hoàn tất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="py-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2 block">NGƯỜI ĐỒNG HÀNH BẢN ĐỊA</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Local Helper Nổi Bật</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="btn-secondary"
          >
            <span>Xem tất cả Helper</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredGuides.map((guide) => (
            <div key={guide.id} className="card-bento overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={guide.name}
                    src={guide.img}
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-slate-200/80">
                    <span className="material-symbols-outlined text-amber-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-extrabold text-slate-900">{guide.rating}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">{guide.name}</h4>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 mb-3">
                    <span className="material-symbols-outlined text-sm text-teal-600">location_on</span>
                    {guide.location}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {guide.languages.slice(0, 2).map((lang) => (
                      <span key={lang} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                  <div>
                    <span className="text-[10px] text-slate-600 font-medium block">Giá mỗi giờ</span>
                    <span className="text-teal-700 font-extrabold text-sm">{formatRateVND(guide.price)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/helper/${guide.id}`)}
                    className="btn-primary text-xs py-2 px-3.5"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Google Maps Explore Section */}
      <GoogleMapsExplore helpers={allGuides.length > 0 ? allGuides : featuredGuides} />

      {/* Customer Reviews Slider */}
      <section className="py-20 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 text-white overflow-hidden">
        <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2 block">ĐÁNH GIÁ THỰC TẾ</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">Được tin chọn bởi hơn 10.000 du khách</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">Những chia sẻ chân thật từ du khách sau mỗi chuyến đi cùng LocalMate.</p>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x scroll-smooth">
            {customerReviews.map((rev, idx) => (
              <div key={idx} className="min-w-[300px] md:min-w-[380px] bg-white/10 backdrop-blur-md p-7 rounded-3xl snap-center border border-white/10 flex-shrink-0 flex flex-col justify-between">
                <p className="text-sm italic text-slate-200 leading-relaxed mb-6">"{rev.text}"</p>
                <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                  <img
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-teal-400/30"
                    alt={rev.name}
                    src={rev.img}
                  />
                  <div>
                    <h5 className="font-bold text-sm text-white">{rev.name}</h5>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[12px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto text-center">
        <div className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 rounded-3xl p-10 sm:p-16 md:p-20 border border-teal-200/60 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="badge-info mb-4">Gia nhập cộng đồng LocalMate</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Sẵn sàng cho chuyến khám phá độc đáo?</h2>
            <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
              Dù bạn là du khách muốn tìm bạn đồng hành hay người bản địa muốn chia sẻ văn hóa quê hương, LocalMate luôn đồng hành cùng bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <button
                onClick={() => navigate('/search')}
                className="btn-primary py-3.5 px-8 text-sm"
              >
                Tìm Local Helper ngay
              </button>
              <button
                onClick={() => navigate('/login?tab=signup&role=guide')}
                className="btn-secondary py-3.5 px-8 text-sm"
              >
                Trở thành Local Helper
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
