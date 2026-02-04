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

const provider = new OpenStreetMapProvider({
  params: {
    countrycodes: 'kg',
  },
});

const KYRGYZ_BOUNDS: L.LatLngBoundsExpression = [
  [39.1, 69.1], // Southwest
  [43.3, 80.3], // Northeast
];

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
    try {
      const res = await provider.search({ query: q });
      setSuggestions(res.slice(0, 5));
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const debouncedSearch = debounce(search, 400);

  // 🧭 Geolocation - restricted to KG
  useEffect(() => {
    if (value || position) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Simple check if within KG (approximate)
      if (lat > 39 && lat < 44 && lng > 69 && lng < 81) {
        setPosition([lat, lng]);
        onChange(lat, lng);
      }
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

  function ChangeView({ center }: { center: [number, number] }) {
    const map = useMapEvents({});
    useEffect(() => {
      map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
  }

  useEffect(() => {
    if (value && (value.lat !== position?.[0] || value.lng !== position?.[1])) {
       setPosition([value.lat, value.lng]);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      {/* 🔍 Search */}
      <div className="relative" style={{ zIndex: 10000 }}>
        <Input
          placeholder="Поиск адреса в Кыргызстане..."
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
          maxBounds={KYRGYZ_BOUNDS}
          minZoom={6}
          style={{ height: "100%", borderRadius: 12 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {position && <ChangeView center={position} />}

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
