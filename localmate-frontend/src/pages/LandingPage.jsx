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
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 md:px-10">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt="European cobblestone street at sunset"
            src="https://www.rehahnphotographer.com/wp-content/uploads/2018/08/20-photos-to-visit-hoi-an-rehahn-vietnam.webp"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto mt-12">
          <h1 className="font-headline-xl text-headline-xl mb-6 text-on-surface">
            Khám phá thế giới qua <span className="text-primary">Góc nhìn Bản địa</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
            Kết nối với những người bạn đồng hành địa phương được kiểm duyệt, cùng trải nghiệm những nét văn hóa đích thực, ẩm thực tinh túy và những câu chuyện thú vị.
          </p>

          {/* Search Bar Widget */}
          <form onSubmit={handleSearch} className="w-full bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-4 md:p-2 flex flex-col md:flex-row gap-2 border border-border-subtle">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border-subtle group">
              <span className="material-symbols-outlined text-primary mr-3">location_on</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">ĐỊA ĐIỂM</label>
                <PlacesAutocompleteInput
                  value={searchLocation}
                  onChange={setSearchLocation}
                  onSelectPlace={(place) => setSearchLocation(place.name || place.city || '')}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Bạn muốn đi đâu?"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border-subtle">
              <span className="material-symbols-outlined text-primary mr-3">calendar_month</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">THỜI GIAN</label>
                <input
                  type="text"
                  value={searchWhen}
                  onChange={(e) => setSearchWhen(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Chọn ngày khởi hành"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3">
              <span className="material-symbols-outlined text-primary mr-3">language</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">NGÔN NGỮ</label>
                <select
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface appearance-none outline-none cursor-pointer"
                >
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="English">Tiếng Anh (English)</option>
                  <option value="Spanish">Tiếng Tây Ban Nha</option>
                  <option value="French">Tiếng Pháp</option>
                  <option value="Japanese">Tiếng Nhật</option>
                </select>
              </div>
            </div>

            <button type="submit" className="bg-primary-container text-on-primary-container hover:bg-primary px-8 py-4 rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 transition-all">
              <span className="material-symbols-outlined">search</span>
              Tìm Local Helper
            </button>
          </form>
        </div>
      </section>

      {/* Intro Section (Bento Style) */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-primary/5 rounded-3xl p-12 flex flex-col justify-center">
            <h2 className="font-headline-lg text-headline-lg mb-6">Trải nghiệm như người bản xứ.</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              LocalMate kết nối du khách với những người bạn đồng hành địa phương am hiểu. Chúng tôi tin rằng trải nghiệm du lịch trọn vẹn nhất không nằm trong những trang sách quảng cáo, mà trong từng ngõ nhỏ, từng quán ăn mộc mạc và câu chuyện chân thật của người dân nơi đây.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label-bold text-label-bold text-on-surface">Đã kiểm duyệt</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="font-label-bold text-label-bold text-on-surface">Đặt tour an toàn</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                <span className="font-label-bold text-label-bold text-on-surface">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative overflow-hidden rounded-3xl group">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 min-h-[300px]"
              alt="Guide and traveler sharing a meal"
              src="https://withlocals-com-res.cloudinary.com/image/upload/w_796,h_448,c_fill,g_auto,q_auto,dpr_2.0,f_auto/destinations/vietnam/Ho%20Chi%20Minh/Cu%20chi%20tunnels%20Shore%20Excursion/Cu_Chi_Tunnels_Shore_Excursion"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-surface-container-low" id="how-it-works">
        <div className="px-6 md:px-10 max-w-7xl mx-auto text-center">
          <span className="font-label-caps text-label-caps text-primary mb-4 block">HÀNH TRÌNH TRẢI NGHIỆM</span>
          <h2 className="font-headline-lg text-headline-lg mb-16">Cách LocalMate Hoạt Động</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary animate-pulse">
                <span className="material-symbols-outlined text-4xl">search_check</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Tìm Người Đồng Hành</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Tìm kiếm hàng trăm Local Helper uy tín theo sở thích, ngôn ngữ và mức ngân sách của bạn.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 text-secondary">
                <span className="material-symbols-outlined text-4xl">chat_bubble</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Nhắn Tin &amp; Tùy Chỉnh Tour</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Trực tiếp trò chuyện cùng Helper để điều chỉnh lịch trình phù hợp với phong cách du lịch của bạn.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-tertiary-container/10 rounded-2xl flex items-center justify-center mb-6 text-tertiary">
                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Khám Phá Trọn Vẹn</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Gặp gỡ người bạn bản địa và tận hưởng chuyến đi tuyệt vời với sự an tâm tuyệt đối.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-label-caps text-label-caps text-primary mb-4 block">NGƯỜI ĐỒNG HÀNH BẢN ĐỊA</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Local Helper Nổi Bật</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="text-primary font-label-bold text-label-bold flex items-center gap-1 hover:underline"
          >
            Xem tất cả Helper
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredGuides.map((guide) => (
            <div key={guide.id} className="bg-white dark:bg-surface-dark border border-border-subtle rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="relative h-64 overflow-hidden">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={guide.name}
                  src={guide.img}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-status-warning text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label-bold text-label-bold text-on-surface">{guide.rating}</span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-headline-md text-headline-md mb-1 text-on-surface">{guide.name}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{guide.location}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {guide.languages.map((lang) => (
                    <span key={lang} className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      {lang}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Từ <span className="text-on-surface font-bold text-body-lg">{formatRateVND(guide.price)}</span></p>
                  <button
                    onClick={() => navigate(`/helper/${guide.id}`)}
                    className="bg-primary/5 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-label-bold text-label-bold transition-all"
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
      <section className="py-24 bg-primary text-white overflow-hidden">
        <div className="px-6 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg mb-4">Được tin chọn bởi hơn 10.000 du khách</h2>
            <p className="font-body-lg text-body-lg opacity-80">Những chia sẻ chân thật từ du khách sau mỗi chuyến đi cùng LocalMate.</p>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 snap-x scroll-smooth">
            {customerReviews.map((rev, idx) => (
              <div key={idx} className="min-w-[320px] md:min-w-[400px] bg-white/10 backdrop-blur-lg p-8 rounded-3xl snap-center border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed"
                    alt={rev.name}
                    src={rev.img}
                  />
                  <div>
                    <h5 className="font-label-bold text-label-bold">{rev.name}</h5>
                    <div className="flex gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[12px] text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="font-body-md text-body-md italic opacity-90">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto text-center">
        <div className="bg-surface-container rounded-[40px] p-12 md:p-24 border border-border-subtle overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">Sẵn sàng cho chuyến khám phá độc đáo?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-xl mx-auto">
              Tham gia cộng đồng LocalMate ngay hôm nay và bắt đầu hành trình đáng nhớ cùng người bạn bản địa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/search')}
                className="bg-primary-container text-on-primary-container px-12 py-4 rounded-xl font-label-bold text-label-bold hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Tìm Local Helper
              </button>
              <button
                onClick={() => navigate('/login?tab=signup&role=guide')}
                className="border-2 border-primary text-primary px-12 py-4 rounded-xl font-label-bold text-label-bold hover:bg-primary/5 transition-all"
              >
                Trở thành Helper
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
      </section>
    </div>
  );
}
