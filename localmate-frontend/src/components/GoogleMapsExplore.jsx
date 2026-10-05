import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const DESTINATIONS = [
  {
    id: 'danang',
    name: 'Da Nang',
    tagline: 'Coastal Hub & Dragon Bridge',
    badge: 'Bridges & Beaches',
    lat: 16.0544,
    lng: 108.2022,
    zoom: 13,
    description: 'A modern coastal city famous for the golden Dragon Bridge, Marble Mountains, and pristine white sandy shores.',
    highlights: ['Dragon Bridge', 'My Khe Beach', 'Marble Mountains', 'Son Tra Peninsula'],
  },
  {
    id: 'hoian',
    name: 'Hoi An',
    tagline: 'Ancient Town & Lanterns',
    badge: 'UNESCO Heritage',
    lat: 15.8801,
    lng: 108.3380,
    zoom: 14,
    description: 'Charming ancient trading port renowned for lantern-lit alleyways, historic merchant houses, and savory street food.',
    highlights: ['Old Town Alleys', 'Japanese Covered Bridge', 'Night Market', 'An Bang Beach'],
  },
  {
    id: 'hue',
    name: 'Hue',
    tagline: 'Imperial Citadel & Royal Cuisine',
    badge: 'Royal Dynasty',
    lat: 16.4637,
    lng: 107.5909,
    zoom: 13,
    description: 'The ancient imperial capital filled with majestic palaces, royal tombs along the Perfume River, and sophisticated gastronomy.',
    highlights: ['Imperial Citadel', 'Thien Mu Pagoda', 'Khai Dinh Tomb', 'Dong Ba Market'],
  },
];

export default function GoogleMapsExplore({ helpers = [] }) {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(DESTINATIONS[0]);
  const [activeGuide, setActiveGuide] = useState(null);
  const [mapType, setMapType] = useState('m'); // 'm' = Roadmap, 'k' = Satellite
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);
  const [isJsMapLoaded, setIsJsMapLoaded] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Filter helpers matching selected city (Da Nang, Hoi An, Hue)
  const cityHelpers = helpers.filter((h) => {
    const loc = (h.location || h.city || '').toLowerCase();
    const cName = selectedCity.name.toLowerCase();
    if (cName === 'da nang') return loc.includes('da nang') || loc.includes('đà nẵng');
    if (cName === 'hoi an') return loc.includes('hoi an') || loc.includes('hội an');
    if (cName === 'hue') return loc.includes('hue') || loc.includes('huế');
    return loc.includes(cName);
  });

  // Check if API key is provided and load Google Maps JS SDK
  useEffect(() => {
    if (!apiKey || apiKey.trim() === '') {
      setApiKeyAvailable(false);
      return;
    }

    setApiKeyAvailable(true);

    if (window.google?.maps) {
      setIsJsMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsJsMapLoaded(true);
      script.onerror = () => {
        console.warn('Google Maps JS API failed to load with provided key. Falling back to embedded view.');
        setApiKeyAvailable(false);
      };
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // Initialize or update real Google Map when JS API is available
  useEffect(() => {
    if (!isJsMapLoaded || !window.google?.maps || !mapContainerRef.current) return;

    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: selectedCity.lat, lng: selectedCity.lng },
        zoom: selectedCity.zoom,
        mapTypeId: mapType === 'k' ? 'satellite' : 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
    } else {
      googleMapInstance.current.panTo({ lat: selectedCity.lat, lng: selectedCity.lng });
      googleMapInstance.current.setZoom(selectedCity.zoom);
      googleMapInstance.current.setMapTypeId(mapType === 'k' ? 'satellite' : 'roadmap');
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add City Center Marker
    const cityMarker = new window.google.maps.Marker({
      position: { lat: selectedCity.lat, lng: selectedCity.lng },
      map: googleMapInstance.current,
      title: selectedCity.name,
      animation: window.google.maps.Animation.DROP,
    });

    cityMarker.addListener('click', () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div style="padding: 10px; max-width: 220px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #0f172a;">${selectedCity.name}</strong>
            <p style="margin: 4px 0; font-size: 12px; color: #64748b;">${selectedCity.tagline}</p>
            <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: bold;">
              ${selectedCity.badge}
            </span>
          </div>
        `);
        infoWindowRef.current.open(googleMapInstance.current, cityMarker);
      }
    });

    markersRef.current.push(cityMarker);

    // Add Helper Markers with slight coordinate offsets around city center
    cityHelpers.forEach((h, index) => {
      // Deterministic small jitter based on index
      const offsetLat = (index % 2 === 0 ? 1 : -1) * (0.008 + (index * 0.005));
      const offsetLng = (index % 3 === 0 ? 1 : -1) * (0.009 + (index * 0.004));
      const helperPos = { lat: selectedCity.lat + offsetLat, lng: selectedCity.lng + offsetLng };

      const marker = new window.google.maps.Marker({
        position: helperPos,
        map: googleMapInstance.current,
        title: h.name || h.fullName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/cyan-dot.png',
          scaledSize: new window.google.maps.Size(36, 36),
        },
      });

      marker.addListener('click', () => {
        setActiveGuide(h);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 10px; max-width: 240px; font-family: sans-serif; text-align: left;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <img src="${h.img || h.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" 
                     style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #06b6d4;" />
                <div>
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${h.name || h.fullName}</h4>
                  <div style="font-size: 11px; color: #0284c7; font-weight: 600;">★ ${h.rating || 5.0} • $${h.price || h.hourlyRate || 12}/hr</div>
                </div>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569; line-height: 1.4;">${h.title || h.bio || 'Local Guide'}</p>
              <a href="/helper/${h.id || h._id}" style="display: block; text-align: center; background: #0891b2; color: #ffffff; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; text-decoration: none;">View Profile & Book</a>
            </div>
          `);
          infoWindowRef.current.open(googleMapInstance.current, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [isJsMapLoaded, selectedCity, mapType, cityHelpers]);

  // Direct Google Maps Search URL
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCity.name + ' Vietnam')}`;

  return (
    <section className="py-20 px-6 md:px-10 max-w-7xl mx-auto" id="explore-map">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">map</span>
            <span>Google Maps Experience</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Destinations & Guides on <span className="text-cyan-700">Google Maps</span>
          </h2>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm md:text-base">
            Discover verified local guides in real time across Vietnam. Switch destinations, pinpoint helper locations, and plan your authentic tour.
          </p>
        </div>

        {/* View on external Google Maps button */}
        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-cyan-400 bg-white hover:bg-cyan-50/50 text-slate-700 hover:text-cyan-900 text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg"
            alt="Google Maps"
            className="w-4 h-4 object-contain"
          />
          <span>Open {selectedCity.name} in Google Maps</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>

      {/* City Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {DESTINATIONS.map((dest) => {
          const isSelected = selectedCity.id === dest.id;
          return (
            <button
              key={dest.id}
              onClick={() => {
                setSelectedCity(dest);
                setActiveGuide(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isSelected ? 'location_on' : 'pin_drop'}
              </span>
              <span>{dest.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {dest.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Map & Guide Companion Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-4 md:p-6 border border-slate-200/80 shadow-xl">
        {/* Left Column: Google Map Container (7 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Map Controls Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-slate-800">{selectedCity.name}, Vietnam</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{selectedCity.tagline}</span>
            </div>

            {/* Satellite / Map toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setMapType('m')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  mapType === 'm' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMapType('k')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  mapType === 'k' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>

          {/* Map Frame */}
          <div className="relative w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner group">
            {apiKeyAvailable && isJsMapLoaded ? (
              // Real Google Maps JavaScript SDK Canvas
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              // High-performance Google Maps Embed Frame
              <iframe
                title={`Google Map of ${selectedCity.name}`}
                width="100%"
                height="100%"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${selectedCity.lat},${selectedCity.lng}&hl=en&t=${mapType}&z=${selectedCity.zoom}&output=embed`}
              />
            )}

            {/* Quick Floating City Overlay Card */}
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-xs bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-100 shadow-lg pointer-events-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-cyan-700 text-sm">explore</span>
                  {selectedCity.name} Highlights
                </span>
                <span className="text-[10px] bg-cyan-100 text-cyan-900 font-bold px-2 py-0.5 rounded-full">
                  {cityHelpers.length} Local Guides
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedCity.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                  >
                    📍 {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sleek City Exploration Banner */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-base">near_me</span>
              <span>
                Exploring <strong>{selectedCity.name}</strong>: Zoom, drag or switch to Satellite view to discover local attractions.
              </span>
            </div>
            <button
              onClick={() => navigate(`/search?location=${encodeURIComponent(selectedCity.name)}`)}
              className="font-bold text-teal-700 hover:text-teal-900 underline shrink-0 cursor-pointer text-left sm:text-right"
            >
              Search Guides in {selectedCity.name} →
            </button>
          </div>
        </div>

        {/* Right Column: Local Guides & City Details Companion (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-700 text-lg">supervised_user_circle</span>
                <span>Guides in {selectedCity.name}</span>
              </h3>
              <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                {cityHelpers.length} available
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {selectedCity.description}
            </p>

            {/* Guides List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {cityHelpers.length > 0 ? (
                cityHelpers.map((guide) => (
                  <div
                    key={guide.id || guide._id}
                    onClick={() => setActiveGuide(guide)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeGuide?.id === guide.id
                        ? 'border-cyan-600 bg-cyan-50/40 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={guide.img || guide.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={guide.name || guide.fullName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {guide.name || guide.fullName}
                          </h4>
                          <span className="text-xs font-extrabold text-cyan-800">
                            ${guide.price || guide.hourlyRate || 12}/hr
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {guide.title || 'Local Culture & Food Specialist'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span>{guide.rating || 5.0}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">
                            {(guide.languages || ['English']).slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/helper/${guide.id || guide._id}`);
                        }}
                        className="text-cyan-800 hover:text-cyan-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Profile & Schedule</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/request/${guide.id || guide._id}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">person_search</span>
                  <p className="text-xs font-semibold text-slate-700">No guides registered in this city yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Be the first local expert to offer tours in {selectedCity.name}!</p>
                  <button
                    onClick={() => navigate('/login?tab=signup&role=guide')}
                    className="mt-3 text-xs font-bold text-cyan-800 hover:underline cursor-pointer"
                  >
                    Become a Helper →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action: Search all guides in this destination */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => navigate(`/search?location=${encodeURIComponent(selectedCity.name)}`)}
              className="w-full py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-md shadow-cyan-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">search</span>
              <span>Find All Guides in {selectedCity.name}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
