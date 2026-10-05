import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Real guides from Database
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [city, setCity] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [priceMax, setPriceMax] = useState(5);
  const [minRating, setMinRating] = useState(4.0);
  const [language, setLanguage] = useState('English');
  const [favorites, setFavorites] = useState([]);

  // Fetch from database
  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8080/api/v1/helpers');
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
    if (language) params.lang = language;
    setSearchParams(params);
  };

  const handleReset = () => {
    setCity('');
    setSelectedExpertise([]);
    setPriceMax(5);
    setMinRating(4.0);
    setLanguage('English');
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

  // Filter Logic
  const filteredGuides = guides.filter(guide => {
    // City filter (case insensitive, partial match)
    if (city && !guide.city?.toLowerCase().includes(city.toLowerCase()) && !guide.country?.toLowerCase().includes(city.toLowerCase())) {
      return false;
    }
    // Price filter
    if (guide.price > priceMax) {
      return false;
    }
    // Rating filter
    if (guide.rating < minRating) {
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
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 bg-surface-container-low p-5 rounded-2xl border border-border-subtle shadow-sm max-h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
              <h2 className="font-headline-md text-base text-primary font-bold">Filters</h2>
              <button
                onClick={handleReset}
                className="text-primary hover:underline font-label-bold text-xs"
              >
                Reset All
              </button>
            </div>

            <form onSubmit={handleFilterSubmit} className="space-y-4">
              {/* Filter: City */}
              <div>
                <label className="block font-label-bold text-xs uppercase tracking-wider mb-1.5 text-on-surface">Destination</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">location_on</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm text-on-surface placeholder:text-outline-variant outline-none"
                    placeholder="Where to?"
                  />
                </div>
              </div>

              {/* Filter: Expertise */}
              <div>
                <label className="block font-label-bold text-xs uppercase tracking-wider mb-1.5 text-on-surface">Expertise</label>
                <div className="space-y-1.5">
                  {[
                    { key: 'culture', label: 'Culture & Arts' },
                    { key: 'foodie', label: 'Food & Nightlife' },
                    { key: 'photography', label: 'Photography' },
                    { key: 'translation', label: 'Translation' }
                  ].map(exp => (
                    <label key={exp.key} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedExpertise.includes(exp.key)}
                        onChange={() => toggleExpertise(exp.key)}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">{exp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter: Price Range */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-label-bold text-xs uppercase tracking-wider text-on-surface">Max Price</label>
                  <span className="font-label-bold text-xs text-primary font-bold">${priceMax}/hr</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Filter: Rating */}
              <div>
                <label className="block font-label-bold text-xs uppercase tracking-wider mb-1.5 text-on-surface">Rating</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMinRating(4.0)}
                    className={`flex-1 py-1.5 rounded-lg border font-label-bold text-xs transition-all ${minRating === 4.0
                      ? 'border-primary bg-primary-container/10 text-primary font-bold'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary'
                      }`}
                  >
                    4.0+ ★
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinRating(4.5)}
                    className={`flex-1 py-1.5 rounded-lg border font-label-bold text-xs transition-all ${minRating === 4.5
                      ? 'border-primary bg-primary-container/10 text-primary font-bold'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary'
                      }`}
                  >
                    4.5+ ★
                  </button>
                </div>
              </div>

              {/* Filter: Language */}
              <div>
                <label className="block font-label-bold text-xs uppercase tracking-wider mb-1.5 text-on-surface">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-3 bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs cursor-pointer outline-none"
                >
                  <option value="All">All Languages</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Japanese">Japanese</option>
                  <option value="French">French</option>
                  <option value="Italian">Italian</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-on-primary font-label-bold text-sm rounded-xl hover:shadow-md active:scale-95 transition-all mt-2"
              >
                Apply Filters
              </button>
            </form>
          </div>
        </aside>

        {/* Main Search Results Content */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1 font-bold">
                Local Helpers {city ? `in ${city}` : 'Worldwide'}
              </h1>
              <p className="font-body-md text-on-surface-variant">
                {filteredGuides.length} experts ready to show you around
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-border-subtle rounded-full font-label-bold text-label-bold text-on-surface hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined text-[20px]">sort</span>
                Most Popular
              </button>
              <button
                onClick={() => alert('Map view is not implemented in this demo.')}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-full font-label-bold text-label-bold hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                View Map
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredGuides.map((guide) => (
                <div key={guide.id} className="group flex flex-col md:flex-row bg-white dark:bg-surface-dark border border-border-subtle rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 min-h-[280px]">
                  <div className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] h-64 md:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                      className="w-full h-full md:absolute md:inset-0 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      alt={guide.name}
                      src={guide.img}
                    />
                    <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-bold text-label-bold text-on-surface">{guide.rating}</span>
                      <span className="text-on-surface-variant text-[12px] ml-1">({guide.reviewsCount})</span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{guide.name}</h3>
                          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified Guide">verified</span>
                          {/* Helper Availability Status Badge */}
                          {(!guide.availabilityStatus || guide.availabilityStatus === 'AVAILABLE') && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              AVAILABLE
                            </span>
                          )}
                          {guide.availabilityStatus === 'BUSY' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              BUSY (Check schedule)
                            </span>
                          )}
                          {guide.availabilityStatus === 'OFFLINE' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              OFFLINE
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-headline-md text-headline-md text-primary font-bold">${guide.price}</span>
                          <span className="font-label-bold text-label-bold text-on-surface-variant block">per hour</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {(guide.expertises || []).map(exp => (
                          <span key={exp} className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full font-label-caps text-label-caps font-bold">
                            {exp}
                          </span>
                        ))}
                      </div>

                      <p className="text-on-surface-variant font-body-md line-clamp-2 mb-4">
                        {guide.description || guide.bio}
                      </p>

                      <div className="flex items-center gap-4 text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px]">language</span>
                          <span className="font-body-sm text-body-sm">
                            {Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px]">location_on</span>
                          <span className="font-body-sm text-body-sm">{guide.city || guide.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => navigate(`/helper/${guide.id}`)}
                        className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold text-label-bold hover:shadow-lg transition-all active:scale-95"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => toggleFavorite(guide.id)}
                        className={`p-3 border rounded-xl transition-all ${favorites.includes(guide.id)
                          ? 'bg-error/10 border-error text-error'
                          : 'border-border-subtle text-on-surface-variant hover:bg-surface-container'
                          }`}
                      >
                        <span className="material-symbols-outlined" style={favorites.includes(guide.id) ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-border-subtle">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">search_off</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No Guides Found</h3>
              <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-6">
                We couldn't find any guides matching your current filters. Try relaxing your budget or choosing different expertise areas.
              </p>
              <button onClick={handleReset} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-bold">
                Clear All Filters
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
