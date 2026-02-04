"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "antd";
import debounce from "lodash.debounce";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { getSpecialists } from "../shared";

// 2GIS map requires manual script loading or using the package which often attaches to window.DG
// Since we are using the '2gis-maps' npm package, it provides the DG global.
declare const DG: any;

type Props = {
  value?: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
};

const provider = new OpenStreetMapProvider({
  params: {
    countrycodes: 'kg',
  },
});

const KYRGYZ_BOUNDS = [
  [39.1, 69.1], // Southwest
  [43.3, 80.3], // Northeast
];

export default function TwoGisMap({ value, onChange }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

    markerRef.current.on('dragend', () => {
      const { lat, lng } = markerRef.current.getLatLng();
      onChange(lat, lng);
    });

    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      markerRef.current.setLatLng([lat, lng]);
      onChange(lat, lng);
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
      <div 
        ref={mapContainerRef} 
        style={{ height: 400, width: "100%", borderRadius: 12, border: "1px solid #ddd" }} 
      />
    </div>
  );
}
