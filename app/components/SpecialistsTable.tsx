"use client";

import { Table, Tag, Switch, Space, message, Button, Badge, Statistic, Row, Col, Card } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../shared";
import SpecialistsMap from "./SpecialistsMap";
import { io } from "socket.io-client";
import { API_PATH } from "../shared/api";
import BroadcastModal from "./BroadcastModal";

export default function SpecialistsTable() {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
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
            return { ...s, unreadCount: (parseInt(String(s.unreadCount || 0), 10)) + 1 };
          }
          return s;
        }));
      }
    });

    socket.on("specialistUpdate", (updatedSpec: any) => {
      setSpecialists(prev => prev.map(s => {
        if (s.id === updatedSpec.id) {
          return {
            ...s,
            ...updatedSpec,
            unreadCount: parseInt(String(updatedSpec.unreadCount ?? s.unreadCount ?? 0), 10),
          };
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

  const onShiftCount = specialists.filter(s => s.isOnShift).length;

  return (
    <>
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
          <Statistic
            title="На смене"
            value={onShiftCount}
            suffix={`/ ${specialists.length}`}
            valueStyle={{ color: '#52c41a', fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false} style={{ background: '#f5f5f5', borderRadius: 8 }}>
          <Statistic
            title="Всего мастеров"
            value={specialists.length}
            valueStyle={{ color: '#595959', fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          onClick={() => setIsBroadcastModalOpen(true)}
          style={{ background: '#212121' }}
        >
          Рассылка мастерам
        </Button>
      </Col>
    </Row>

    <Table
      loading={loading}
      rowKey="id"
      dataSource={[...specialists].sort((a, b) => {
        if (a.isOnShift && !b.isOnShift) return -1;
        if (!a.isOnShift && b.isOnShift) return 1;
        if (a.isOnShift && b.isOnShift) {
          const aTime = a.lastShiftStartedAt ? new Date(a.lastShiftStartedAt).getTime() : 0;
          const bTime = b.lastShiftStartedAt ? new Date(b.lastShiftStartedAt).getTime() : 0;
          return aTime - bTime; // oldest start first = longest on shift
        }
        return 0;
      })}
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

    <BroadcastModal 
      open={isBroadcastModalOpen} 
      onClose={() => setIsBroadcastModalOpen(false)} 
    />
    </>
  );
}
