"use client";

import { useEffect, useRef, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { getSpecialists } from "../shared";

declare const DG: any;

type Props = {
  value?: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
};

const provider = new OpenStreetMapProvider({ params: { countrycodes: 'kg' } });

const KYRGYZ_BOUNDS = [
  [39.1, 69.1], // Southwest
  [43.3, 80.3], // Northeast
];

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`,
      { headers: { 'User-Agent': 'CityOfMasters-Admin/1.0' } }
    );
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(', ');
      return parts.slice(0, 3).join(', ');
    }
  } catch {}
  return '';
}

export default function TwoGisMap({ value, onChange, onAddressChange }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapRef.current || !markerRef.current) return;
    setIsSearching(true);
    try {
      const results = await provider.search({ query: searchQuery });
      if (results && results.length > 0) {
        const lat = results[0].y;
        const lng = results[0].x;
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 17);
        onChange(lat, lng);
        if (onAddressChange) {
          const label = results[0].label.split(', ').slice(0, 3).join(', ');
          onAddressChange(label);
        }
      }
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Load specialists
  useEffect(() => {
    getSpecialists()
      .then((list: any[]) => setSpecialists(list))
      .catch(() => {});
  }, []);

  // Initialize Map
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically require 2gis-maps to ensure it's client-side only
    const DG = require("2gis-maps");

    const initialPos = value ? [value.lat, value.lng] : [42.8746, 74.5698];
    
    mapRef.current = DG.map(mapContainerRef.current, {
      center: initialPos,
      zoom: 17,
      maxBounds: KYRGYZ_BOUNDS,
      minZoom: 6,
    });

    const activeOrderIcon = DG.divIcon({
      html: `
        <div style="position: relative; background: white; border-radius: 50%; padding: 2px; border: 3px solid #ff4d4f; box-shadow: 0 0 10px rgba(255, 77, 79, 0.5); animation: pulse-shadow 2s infinite;">
          <img src="https://cdn-icons-png.flaticon.com/512/950/950299.png" style="width: 32px; height: 32px; display: block;" />
          <style>
            @keyframes pulse-shadow {
              0% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(255, 77, 79, 0); }
              100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); }
            }
          </style>
        </div>
      `,
      className: 'active-order-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    markerRef.current = DG.marker(initialPos, {
      draggable: true,
      icon: activeOrderIcon
    }).addTo(mapRef.current);

    markerRef.current.on('dragend', async () => {
      const { lat, lng } = markerRef.current.getLatLng();
      onChange(lat, lng);
      if (onAddressChange) {
        const addr = await reverseGeocode(lat, lng);
        if (addr) onAddressChange(addr);
      }
    });

    mapRef.current.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      markerRef.current.setLatLng([lat, lng]);
      onChange(lat, lng);
      if (onAddressChange) {
        const addr = await reverseGeocode(lat, lng);
        if (addr) onAddressChange(addr);
      }
    });

    setIsLoaded(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Sync with external value changes
  useEffect(() => {
    if (isLoaded && value && mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== value.lat || currentPos.lng !== value.lng) {
        markerRef.current.setLatLng([value.lat, value.lng]);
        mapRef.current.setView([value.lat, value.lng], 17);
      }
    }
  }, [value, isLoaded]);

  // Render Specialist markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    const specialistMarkers: any[] = [];
    const DG = require("2gis-maps");

    specialists.forEach(s => {
      if (s.lat && s.lng) {
        const borderColor = s.isOnShift ? "#52c41a" : "#d9d9d9";
        const opacity = s.isOnShift ? 1 : 0.6;
        const icon = DG.divIcon({
          html: `
            <div style="position: relative; background: white; border-radius: 50%; padding: 2px; border: 2px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.2); opacity: ${opacity};">
              <img src="https://cdn-icons-png.flaticon.com/512/4631/4631824.png" style="width: 28px; height: 28px; display: block; filter: ${s.isOnShift ? 'none' : 'grayscale(100%)'};" />
            </div>
          `,
          className: 'spec-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        const m = DG.marker([s.lat, s.lng], { icon }).addTo(mapRef.current);
        m.bindPopup(`👨‍🔧 ${s.name || "Специалист"} ${s.isOnShift ? "" : "(Не на смене)"}`);
        specialistMarkers.push(m);
      }
    });

    return () => {
      specialistMarkers.forEach(m => m.remove());
    };
  }, [specialists, isLoaded]);

  return (
    <div className="space-y-2">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Поиск адреса в Бишкеке..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          style={{
            flex: 1,
            padding: '6px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          style={{
            padding: '6px 16px',
            background: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: isSearching ? 'not-allowed' : 'pointer',
            fontSize: 14,
            opacity: isSearching ? 0.7 : 1,
          }}
        >
          {isSearching ? '...' : 'Найти'}
        </button>
      </div>
      <div
        ref={mapContainerRef}
        style={{ height: 400, width: "100%", borderRadius: 12, border: "1px solid #ddd" }}
      />
    </div>
  );
}
