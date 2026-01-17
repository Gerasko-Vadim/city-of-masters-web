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

// Fix marker icon bug in Next
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

export function MapPicker({ value, onChange }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  // 🔍 Search address
  const search = async (q: string) => {
    if (!q) return setSuggestions([]);
    const res = await provider.search({ query: q });
    setSuggestions(res.slice(0, 5));
  };

  const debouncedSearch = debounce(search, 400);

  // 🧭 Auto geolocation
  useEffect(() => {
    if (value || position) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      onChange(lat, lng);
    });
  }, []);

  // 👨‍🔧 Load specialists nearby
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/specialists/on-shift`)
      .then((r) => r.json())
      .then(setSpecialists)
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
      <div className="relative">
        <Input
          placeholder="Поиск адреса..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />

        {suggestions.length > 0 && (
          <div className="absolute z-50 bg-white border rounded w-full shadow">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
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

      {/* 🗺️ Map */}
      <MapContainer
        center={position || [42.8746, 74.5698]} // Бишкек default
        zoom={14}
        style={{ height: 320, borderRadius: 12 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapClickHandler />

        {/* 📍 Selected marker */}
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
                  "https://cdn-icons-png.flaticon.com/512/2942/2942813.png",
                iconSize: [32, 32],
              })
            }
          >
            <Popup>👨‍🔧 {s.name || "Специалист"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
