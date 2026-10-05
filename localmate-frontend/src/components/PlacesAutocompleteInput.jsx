import React, { useState, useEffect, useRef } from 'react';

const POPULAR_DESTINATIONS = [
  { city: 'Da Nang', province: 'Central Vietnam', country: 'Vietnam', tag: 'Trending' },
  { city: 'Hoi An', province: 'Quang Nam', country: 'Vietnam', tag: 'Heritage' },
  { city: 'Hue', province: 'Thua Thien Hue', country: 'Vietnam', tag: 'Imperial City' },
];

export default function PlacesAutocompleteInput({
  value,
  onChange,
  onSelectPlace,
  placeholder = 'Where are you going?',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState(value || '');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    setFilterText(value || '');
  }, [value]);

  // Connect Google Maps Places Autocomplete if script is available
  useEffect(() => {
    if (window.google?.maps?.places && inputRef.current && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.name) {
            const cityName = place.name;
            setFilterText(cityName);
            if (onChange) onChange(cityName);
            if (onSelectPlace) onSelectPlace(place);
            setIsOpen(false);
          }
        });
      } catch (err) {
        console.warn('Google Places Autocomplete initialization notice:', err);
      }
    }
  }, [onChange, onSelectPlace]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setFilterText(val);
    if (onChange) onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (dest) => {
    setFilterText(dest.city);
    if (onChange) onChange(dest.city);
    if (onSelectPlace) onSelectPlace({ name: dest.city, ...dest });
    setIsOpen(false);
  };

  const filtered = POPULAR_DESTINATIONS.filter((d) =>
    d.city.toLowerCase().includes(filterText.toLowerCase()) ||
    d.province.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={filterText}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Quick suggestions dropdown if Google Places dropdown isn't active or for instant picks */}
      {isOpen && !window.google?.maps?.places && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-72 overflow-y-auto py-2 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Popular Destinations</span>
            <span className="flex items-center gap-1 text-cyan-700">
              <span className="material-symbols-outlined text-xs">pin_drop</span>
              <span>Vietnam</span>
            </span>
          </div>
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.city}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-cyan-50/70 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-cyan-100 group-hover:text-cyan-800 transition-colors">
                    <span className="material-symbols-outlined text-sm">location_city</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-cyan-900">
                      {item.city}
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.province}, {item.country}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-cyan-100 group-hover:text-cyan-800">
                  {item.tag}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">
              No matching cities found. Press enter to search freely.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
