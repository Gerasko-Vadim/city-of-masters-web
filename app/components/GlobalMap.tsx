"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../shared";
import { OrderStatus } from "../shared/order";
import { mapOrderStatusToLabel } from "../orders/lib";
import { io } from "socket.io-client";
import { API_PATH } from "../shared/api";

const KYRGYZ_BOUNDS = [
  [39.1, 69.1], // Southwest
  [43.3, 80.3], // Northeast
];

const statusColors: Record<string, string> = {
  [OrderStatus.NEW]: "#1890ff",
  [OrderStatus.PAID]: "#faad14",
  [OrderStatus.IN_PROGRESS]: "#13c2c2",
  [OrderStatus.COMPLETED]: "#52c41a",
};

export default function GlobalMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, specialistsRes] = await Promise.all([
          api.get("/order"),
          api.get("/specialists")
        ]);
        setOrders(ordersRes.data);
        setSpecialists(specialistsRes.data);
      } catch (err) {
        console.error("Failed to fetch map data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    socket.on("orderUpdate", (updatedOrder: any) => {
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === updatedOrder.id);
        if (index > -1) {
          const newOrders = [...prev];
          newOrders[index] = updatedOrder;
          return newOrders;
        }
        return [updatedOrder, ...prev];
      });
    });

    socket.on("specialistUpdate", (updatedSpec: any) => {
      setSpecialists(prev => {
        const index = prev.findIndex(s => s.id === updatedSpec.id);
        // Specialist data from direct update might miss unreadCount if not sent by backend
        // but we'll prioritize keeping the current unreadCount if it exists
        if (index > -1) {
          const newSpecs = [...prev];
          newSpecs[index] = { ...prev[index], ...updatedSpec };
          return newSpecs;
        }
        return [updatedSpec, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    const DG = require("2gis-maps");

    const savedPosStr = localStorage.getItem("global_map_pos");
    const savedPos = savedPosStr ? JSON.parse(savedPosStr) : null;
    
    const initialCenter = savedPos?.center || [42.8746, 74.5698];
    const initialZoom = savedPos?.zoom || 13;

    mapRef.current = DG.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      maxBounds: KYRGYZ_BOUNDS,
      minZoom: 6,
    });

    mapRef.current.on('moveend zoomend', () => {
      const center = mapRef.current.getCenter();
      localStorage.setItem("global_map_pos", JSON.stringify({
        center: [center.lat, center.lng],
        zoom: mapRef.current.getZoom()
      }));
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

    // Order markers
    orders.forEach(order => {
      if (order.lat && order.lng) {
        const color = statusColors[order.status] || "#d9d9d9";
        
        const icon = DG.divIcon({
          html: `
            <div style="position: relative; background: white; border-radius: 50%; padding: 2px; border: 2px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              <img src="https://cdn-icons-png.flaticon.com/512/950/950299.png" style="width: 28px; height: 28px; display: block;" />
            </div>
          `,
          className: 'custom-order-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const m = DG.marker([order.lat, order.lng], { icon }).addTo(mapRef.current);
        const label = mapOrderStatusToLabel[order.status as OrderStatus] || order.status;
        m.bindPopup(`
          <div style="font-family: sans-serif;">
            <b style="font-size: 14px;">Заказ #${order.id}</b><br/>
            <span>Статус: <span style="color: ${color}; font-weight: bold;">${label}</span></span><br/>
            <span>Клиент: ${order.customerName}</span><br/>
            <span>Адрес: ${order.address}</span><br/>
            <div style="margin-top: 8px;"><a href="/orders/${order.id}">Подробнее</a></div>
          </div>
        `);
        markers.push(m);
      }
    });

    // Specialist markers
    specialists.forEach(s => {
      if (s.lat && s.lng) {
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
        m.bindPopup(`
          <div style="font-family: sans-serif;">
            <b style="font-size: 14px;">👨‍🔧 ${s.name || s.username}</b><br/>
            <span>Статус: ${s.isOnShift ? '<span style="color: green; font-weight: bold;">На смене</span>' : '<span style="color: #999;">Не на смене (Последняя локация)</span>'}</span><br/>
            <div style="margin-top: 8px;"><a href="/specialists/${s.id}">В профиль</a></div>
          </div>
        `);
        markers.push(m);
      }
    });

    return () => {
      markers.forEach(m => m.remove());
    };
  }, [orders, specialists, isLoaded]);

  return (
    <div style={{ height: "calc(100vh - 200px)", width: "100%", position: "relative" }}>
      <div 
        ref={mapContainerRef} 
        style={{ height: "100%", width: "100%", borderRadius: 12, border: "1px solid #ddd" }} 
      />
      
      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1000,
        fontSize: "12px"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Статусы заказов:</div>
        {Object.entries(OrderStatus).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
            <div style={{ width: 10, height: 10, backgroundColor: statusColors[value], borderRadius: "50%", marginRight: "8px" }}></div>
            {mapOrderStatusToLabel[value] || value}
          </div>
        ))}
      </div>
    </div>
  );
}
