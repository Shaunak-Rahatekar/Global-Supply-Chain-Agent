import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function PortDropdown({ value, onChange, placeholder }) {
  const [ports, setPorts] = useState([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetch('/app/ports.json')
      .then(res => res.json())
      .then(data => setPorts(data))
      .catch(err => console.error("Failed to load ports", err));
  }, []);

  useEffect(() => {
    if (value && value.name) {
      setQuery(value.name);
    } else if (value && typeof value === 'string') {
      setQuery(value);
    } else {
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPorts = query === '' 
    ? ports.slice(0, 50) 
    : ports.filter(port => port.name.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-10 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(null); // Clear selection if typing manually
          }}
          onFocus={() => setIsOpen(true)}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {filteredPorts.length > 0 ? (
            filteredPorts.map((port, idx) => (
              <div
                key={idx}
                className="px-4 py-3 hover:bg-slate-700 cursor-pointer flex items-center gap-3 transition-colors"
                onClick={() => {
                  setQuery(port.name);
                  onChange(port);
                  setIsOpen(false);
                }}
              >
                <MapPin className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className="text-sm font-medium text-white">{port.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{port.lat.toFixed(4)}°, {port.lon.toFixed(4)}°</div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">No ports found</div>
          )}
        </div>
      )}
    </div>
  );
}
