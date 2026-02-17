"use client";

import { Table, Tag, message, Badge } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../shared";
import SpecialistsMap from "./SpecialistsMap";
import { io } from "socket.io-client";
import { API_PATH } from "../shared/api";

export default function SpecialistsTable() {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  const loadSpecialists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/specialists");
      // Specialists now include unreadCount from backend (raw query returns strings for counts usually, so parse it)
      const data = res.data.map((s: any) => ({
        ...s,
        unreadCount: parseInt(s.unreadCount || "0", 10)
      }));
      setSpecialists(data);
    } catch (error) {
       message.error("Ошибка загрузки специалистов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecialists();
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [loadSpecialists]);

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });
    
    socket.on("admin_notification", (data: any) => {
      if (data.type === "CHAT_MESSAGE") {
        setSpecialists(prev => prev.map(s => {
          if (s.id === data.specialistId) {
            return { ...s, unreadCount: (s.unreadCount || 0) + 1 };
          }
          return s;
        }));
      }
    });

    socket.on("specialistUpdate", (updatedSpec: any) => {
      setSpecialists(prev => prev.map(s => {
        if (s.id === updatedSpec.id) {
          return { ...s, ...updatedSpec };
        }
        return s;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatDuration = (start: string | Date | null) => {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const diffMs = now.getTime() - startTime;
    if (diffMs < 0) return "0м";

    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) return `${hours}ч ${mins}м`;
    return `${mins}м`;
  };

  return (
    <>
    <Table
      loading={loading}
      rowKey="id"
      dataSource={specialists}
      columns={[
        { title: "ID", dataIndex: "id", width: 60 },
        { 
          title: "Имя", 
          render: (_, record: any) => (
            <Badge count={record.unreadCount} offset={[10, 0]}>
              {record.name || `Спец #${record.id}`}
            </Badge>
          )
        },
        { 
          title: "Username", 
          dataIndex: "username",
          render: (username: string) => username ? <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer">@{username}</a> : '-' 
        },
        { 
          title: "Статус", 
          dataIndex: "isOnShift",
          render: (val: boolean) => val ? <Tag color="green">На смене</Tag> : <Tag color="default">Не на смене</Tag>
        },
        {
          title: "Начало смены",
          dataIndex: "lastShiftStartedAt",
          render: (date: string, record: any) => record.isOnShift && date ? new Date(date).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' }) : '-'
        },
        {
          title: "В работе",
          render: (_, record: any) => record.isOnShift ? formatDuration(record.lastShiftStartedAt) : '-'
        }
      ]}
      onRow={(record: any) => {
        return {
          onClick: () => {
            router.push(`/specialists/${record.id}`);
          },
          style: { cursor: "pointer" },
        };
      }}
      rowClassName={(record) => record.isBanned ? "bg-red-50 hover:!bg-red-100" : ""}
    />

    <div style={{ marginTop: 40 }}>
      <h3 style={{ marginBottom: 16 }}>Карта специалистов</h3>
      <SpecialistsMap specialists={specialists} />
    </div>
    </>
  );
}
