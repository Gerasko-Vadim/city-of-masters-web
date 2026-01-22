"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Input } from "antd";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import debounce from "lodash.debounce";
import { getSpecialistsOnShift } from "../shared";

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Specialist = {
  id: number;
  lat: number;
  lng: number;
  name?: string;
};

type Props = {
  value?: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
};

const provider = new OpenStreetMapProvider();

export default function LeafletMap({ value, onChange }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  // 🔍 Address search
  const search = async (q: string) => {
    if (!q) return setSuggestions([]);
    const res = await provider.search({ query: q });
    setSuggestions(res.slice(0, 5));
  };

  const debouncedSearch = debounce(search, 400);

  // 🧭 Geolocation
  useEffect(() => {
    if (value || position) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      onChange(lat, lng);
    });
  }, []);

  // 👨‍🔧 Specialists on shift
  useEffect(() => {
    getSpecialistsOnShift()
      .then((list: Specialist[]) => setSpecialists(list))
      .catch(() => {});
  }, []);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onChange(lat, lng);
      },
    });
    return null;
  }

  return (
    <div className="space-y-2">
      {/* 🔍 Search */}
      <div className="relative" style={{ zIndex: 10000 }}>
        <Input
          placeholder="Поиск адреса..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />

        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
              zIndex: 9999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{ padding: "8px 12px", cursor: "pointer" }}
                onClick={() => {
                  const lat = s.y;
                  const lng = s.x;
                  setPosition([lat, lng]);
                  onChange(lat, lng);
                  setQuery(s.label);
                  setSuggestions([]);
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🗺 Map */}
      <div style={{ height: 400, width: "100%" }}>
        <MapContainer
          center={position || [42.8746, 74.5698]}
          zoom={14}
          style={{ height: "100%", borderRadius: 12 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapClickHandler />

          {/* 📍 Order marker */}
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend(e) {
                  const p = e.target.getLatLng();
                  setPosition([p.lat, p.lng]);
                  onChange(p.lat, p.lng);
                },
              }}
            >
              <Popup>Точка заказа</Popup>
            </Marker>
          )}

          {/* 👨‍🔧 Specialists */}
          {specialists.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://cdn-icons-png.flaticon.com/512/4631/4631824.png",
                  iconSize: [32, 32],
                })
              }
            >
              <Popup>👨‍🔧 {s.name || "Специалист"}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
