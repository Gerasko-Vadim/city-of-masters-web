"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix marker icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const specialistIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4631/4631824.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

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

export default function SpecialistsMapLeaflet({ specialists }: Props) {
  const [center, setCenter] = useState<[number, number]>([42.8746, 74.5698]);

  useEffect(() => {
    const firstWithLoc = specialists.find(s => s.lat && s.lng);
    if (firstWithLoc) {
      setCenter([firstWithLoc.lat, firstWithLoc.lng]);
    }
  }, [specialists]);

  return (
    <div style={{ height: 500, width: "100%", marginTop: 20 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", borderRadius: 12, border: "1px solid #ddd" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {specialists.filter(s => s.lat && s.lng).map((s) => (
          <Marker 
            key={s.id} 
            position={[s.lat, s.lng]} 
            icon={specialistIcon}
          >
            <Popup>
              <div style={{ padding: 5 }}>
                <b style={{ fontSize: 14 }}>{s.name}</b>
                <div style={{ marginTop: 4 }}>
                  Статус: {s.isOnShift ? <span style={{ color: 'green' }}>На смене</span> : <span>Не на смене</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                   <a href={`/specialists/${s.id}`}>Профиль</a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
