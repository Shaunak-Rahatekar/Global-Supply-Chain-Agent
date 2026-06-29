import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a custom glowing pulse icon using a div
const pulseIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="relative flex h-6 w-6">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-6 w-6 bg-cyan-500 border-2 border-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.8)]"></span>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapComponent({ lat, lon }) {
  const position = [lat, lon];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl relative z-0">
      <MapContainer 
        center={position} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Dark Matter Tile Layer from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={position} icon={pulseIcon}>
          <Popup className="custom-popup">
            <div className="text-slate-900 font-semibold">
              Cargo Vessel: CGO-TEST-123
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Overlay gradient to blend map edges softly */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10 shadow-[inset_0_0_50px_rgba(15,23,42,0.8)] z-[400]" />
    </div>
  );
}
