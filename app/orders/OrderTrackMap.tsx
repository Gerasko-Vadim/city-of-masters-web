"use client";

import { useEffect, useRef } from "react";

declare const DG: any;

type Props = {
  orderLat: number;
  orderLng: number;
  specialistLat?: number | null;
  specialistLng?: number | null;
  specialistName?: string;
};

export default function OrderTrackMap({
  orderLat,
  orderLng,
  specialistLat,
  specialistLng,
  specialistName,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    const DG = require("2gis-maps");

    mapRef.current = DG.map(mapContainerRef.current, {
      center: [orderLat, orderLng],
      zoom: 14,
    });

    // Order marker (red)
    const orderIcon = DG.divIcon({
      html: `
        <div style="background:white;border-radius:50%;padding:2px;border:3px solid #ff4d4f;box-shadow:0 0 10px rgba(255,77,79,0.5);">
          <img src="https://cdn-icons-png.flaticon.com/512/950/950299.png" style="width:32px;height:32px;display:block;" />
        </div>
      `,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    DG.marker([orderLat, orderLng], { icon: orderIcon })
      .addTo(mapRef.current)
      .bindPopup("📍 Заказ");

    // Specialist marker (green) — only if coords available
    if (specialistLat && specialistLng) {
      const specIcon = DG.divIcon({
        html: `
          <div style="background:white;border-radius:50%;padding:2px;border:3px solid #52c41a;box-shadow:0 0 10px rgba(82,196,26,0.5);">
            <img src="https://cdn-icons-png.flaticon.com/512/4631/4631824.png" style="width:32px;height:32px;display:block;" />
          </div>
        `,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      DG.marker([specialistLat, specialistLng], { icon: specIcon })
        .addTo(mapRef.current)
        .bindPopup(`👷 ${specialistName || "Мастер"}`);

      // Fit map to show both markers
      const bounds = DG.latLngBounds(
        [orderLat, orderLng],
        [specialistLat, specialistLng]
      );
      mapRef.current.fitBounds(bounds, { padding: [60, 60] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [orderLat, orderLng, specialistLat, specialistLng]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: 380, width: "100%", borderRadius: 12, border: "1px solid #ddd" }}
    />
  );
}
