import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlacesAutocompleteInput from '../components/PlacesAutocompleteInput';
import GoogleMapsExplore from '../components/GoogleMapsExplore';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchWhen, setSearchWhen] = useState('');
  const [searchLang, setSearchLang] = useState('English');

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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/v1/helpers`);
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
      text: "Kevin was incredible! He took us to a tiny My Quang shop in a Hoi An alleyway that we would never have found on our own. It was the best meal of our entire trip. LocalMate made booking so easy.",
      rating: 5,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbYRfLM-LxkRq3a3V473eGDYBv5jDjF5kEmW2WyoJMjqKNWSJ6lRMiXmAfhrhkWeLdNL44_eVHVAnlwuGirQ2VgTCwOyE6PYGQsnVuE6O4J053RD-PdGRcSTF-iQnDGt2pacjHqwrsFecEJ5XgOqv2DVlqpM86p49j0Q4sNHCAbsX9kFvSaX_kvcXv_4ursGyfjOJ4L0jx4HJODG5_CASyxJ-ZNFKM7L5eqdJKrAiHXznoogf_KXzAJXxryY7hlP0Ma1xf-PV0s-0"
    },
    {
      name: "David Chen",
      text: "My experience in Hue with Huong was the highlight of my summer. His knowledge of local history and architecture was profound, but his restaurant recommendations were the real secret weapon!",
      rating: 5,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-MkWEJACjcU-08gkihmxo_ArgNZOTBrlVsP6BIwDkaQ9_Mxa5iH4188dNm6IA6iOBwm38ZyICt0XPV0wqEZYz4uJ97eSFm_XDMBixmunyPwXslYOTuFX-B8L3YSSwMyQndtcfRP51nWXbcSfmbp1Xbx5pVW4gbvb59RZRlUBJ7U8UPVokRR5BxU1k8qbMdypTxJWOWZWUUM9fnzKMf6N2uXw8wv6Sh52DE8c7MetOLEErfT30LE7K8KH0SE5OXZmmN9REUhAHJnQ"
    },
    {
      name: "Sarah Miller",
      text: "I was nervous traveling solo to Da Nang, but meeting Elena changed everything. She felt like an old friend by the end of the afternoon. Safe, informative, and so much fun!",
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
            Discover the World Through <span className="text-primary">Local Eyes</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
            Connect with vetted local helpers who show you the hidden gems, authentic flavors, and untold stories of their hometown.
          </p>

          {/* Search Bar Widget */}
          <form onSubmit={handleSearch} className="w-full bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-4 md:p-2 flex flex-col md:flex-row gap-2 border border-border-subtle">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border-subtle group">
              <span className="material-symbols-outlined text-primary mr-3">location_on</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">LOCATION</label>
                <PlacesAutocompleteInput
                  value={searchLocation}
                  onChange={setSearchLocation}
                  onSelectPlace={(place) => setSearchLocation(place.name || place.city || '')}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Where are you going?"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border-subtle">
              <span className="material-symbols-outlined text-primary mr-3">calendar_month</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">WHEN</label>
                <input
                  type="text"
                  value={searchWhen}
                  onChange={(e) => setSearchWhen(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Select dates"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3">
              <span className="material-symbols-outlined text-primary mr-3">language</span>
              <div className="text-left w-full">
                <label className="block font-label-caps text-label-caps text-on-surface-variant">LANGUAGE</label>
                <select
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-on-surface appearance-none outline-none cursor-pointer"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>Japanese</option>
                </select>
              </div>
            </div>

            <button type="submit" className="bg-primary-container text-on-primary-container hover:bg-primary px-8 py-4 rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 transition-all">
              <span className="material-symbols-outlined">search</span>
              Search Guides
            </button>
          </form>
        </div>
      </section>

      {/* Intro Section (Bento Style) */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-primary/5 rounded-3xl p-12 flex flex-col justify-center">
            <h2 className="font-headline-lg text-headline-lg mb-6">Travel like a local, not a tourist.</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              LocalMate bridges the gap between global travelers and local experts. We believe the best travel experiences aren't found in brochures, but in the kitchens, back alleys, and secret viewpoints shared by people who call the destination home.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label-bold text-label-bold text-on-surface">Vetted Guides</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="font-label-bold text-label-bold text-on-surface">Secure Booking</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                <span className="font-label-bold text-label-bold text-on-surface">24/7 Support</span>
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
          <span className="font-label-caps text-label-caps text-primary mb-4 block">THE JOURNEY</span>
          <h2 className="font-headline-lg text-headline-lg mb-16">How LocalMate Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary animate-pulse">
                <span className="material-symbols-outlined text-4xl">search_check</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Find Your Guide</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Browse through thousands of vetted local experts based on your interests, language, and budget.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 text-secondary">
                <span className="material-symbols-outlined text-4xl">chat_bubble</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Chat &amp; Customize</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Message guides directly to discuss your itinerary and create a personalized experience just for you.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-tertiary-container/10 rounded-2xl flex items-center justify-center mb-6 text-tertiary">
                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Experience More</h3>
              <p className="font-body-md text-body-md text-on-surface-variant px-4">
                Meet your guide and enjoy an unforgettable adventure off the beaten path with complete peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-label-caps text-label-caps text-primary mb-4 block">EXPERT COMPANIONS</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Featured Local Helpers</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="text-primary font-label-bold text-label-bold flex items-center gap-1 hover:underline"
          >
            View all guides
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
                  <p className="font-body-sm text-body-sm text-on-surface-variant">From <span className="text-on-surface font-bold text-body-lg">{String(guide.price).startsWith('$') ? guide.price : `$${guide.price}`}</span>/hr</p>
                  <button
                    onClick={() => navigate(`/helper/${guide.id}`)}
                    className="bg-primary/5 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-label-bold text-label-bold transition-all"
                  >
                    Profile
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
            <h2 className="font-headline-lg text-headline-lg mb-4">Trusted by over 10,000 travelers</h2>
            <p className="font-body-lg text-body-lg opacity-80">See what our community has to say about their local adventures.</p>
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
            <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">Ready to explore like never before?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-xl mx-auto">
              Join the LocalMate community today and start your next adventure with a local by your side.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/search')}
                className="bg-primary-container text-on-primary-container px-12 py-4 rounded-xl font-label-bold text-label-bold hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Find a Guide
              </button>
              <button
                onClick={() => navigate('/login?tab=signup&role=guide')}
                className="border-2 border-primary text-primary px-12 py-4 rounded-xl font-label-bold text-label-bold hover:bg-primary/5 transition-all"
              >
                Become a Helper
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
