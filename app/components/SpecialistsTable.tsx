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

    return () => {
      socket.disconnect();
    };
  }, []);

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
        { title: "Telegram ID", dataIndex: "telegramId" },
        { 
          title: "Статус", 
          dataIndex: "isOnShift",
          render: (val: boolean) => val ? <Tag color="green">На смене</Tag> : <Tag color="default">Не на смене</Tag>
        },
        { 
          title: "Локация", 
          render: (_, record: any) => record.lat ? `${record.lat.toFixed(4)}, ${record.lng.toFixed(4)}` : '-'
        },
        {
          title: "Дата регистрации",
          dataIndex: "createdAt",
          render: (date: string) => new Date(date).toLocaleDateString("ru-RU") 
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
    />

    <div style={{ marginTop: 40 }}>
      <h3 style={{ marginBottom: 16 }}>Карта специалистов</h3>
      <SpecialistsMap specialists={specialists} />
    </div>
    </>
  );
}
