"use client";

import { useEffect, useRef, useState } from "react";

type Specialist = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  isOnShift: boolean;
};

type Props = {
  specialists: Specialist[];
};

const KYRGYZ_BOUNDS = [
  [39.1, 69.1], // Southwest
  [43.3, 80.3], // Northeast
];

export default function SpecialistsTwoGisMap({ specialists }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    const DG = require("2gis-maps");

    const firstWithLoc = specialists.find(s => s.lat && s.lng);
    const initialPos = firstWithLoc ? [firstWithLoc.lat, firstWithLoc.lng] : [42.8746, 74.5698];

    mapRef.current = DG.map(mapContainerRef.current, {
      center: initialPos,
      zoom: 15,
      maxBounds: KYRGYZ_BOUNDS,
      minZoom: 6,
    });

    setIsLoaded(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const DG = require("2gis-maps");
    const markers: any[] = [];

    specialists.filter(s => s.lat && s.lng).forEach((s) => {
      const borderColor = s.isOnShift ? "#52c41a" : "#d9d9d9";
      const opacity = s.isOnShift ? 1 : 0.7;

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
      
      const popupContent = `
        <div style="padding: 5px; font-family: sans-serif;">
          <b style="font-size: 14px;">👨‍🔧 ${s.name}</b>
          <div style="margin-top: 4px;">
            Статус: ${s.isOnShift ? '<span style="color: #52c41a; font-weight: bold;">На смене</span>' : '<span style="color: #999;">Вне смены (Последняя локация)</span>'}
          </div>
          <div style="margin-top: 8px;">
             <a href="/specialists/${s.id}" style="color: #1890ff; text-decoration: none; font-weight: bold;">Профиль специалиста</a>
          </div>
        </div>
      `;
      
      m.bindPopup(popupContent);
      markers.push(m);
    });

    return () => {
      markers.forEach(m => m.remove());
    };
  }, [specialists, isLoaded]);

  return (
    <div style={{ height: 500, width: "100%", marginTop: 20 }}>
      <div 
        ref={mapContainerRef} 
        style={{ height: "100%", borderRadius: 12, border: "1px solid #ddd" }} 
      />
    </div>
  );
}
