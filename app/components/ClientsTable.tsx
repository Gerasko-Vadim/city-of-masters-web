"use client";

import { Table, Tag, Space, Row, Col, Card, Statistic, Button, message } from "antd";
import { useEffect, useState, useRef } from "react";
import { api } from "../shared";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

function formatCountdown(targetIso: string): string | null {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return "сейчас";
  if (diff > 24 * 60 * 60 * 1000) return null; // only show within 24h
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `через ${h}ч ${m}м`;
  return `через ${m}м`;
}

export default function ClientsTable() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [broadcastStatus, setBroadcastStatus] = useState<{
    enabled: boolean;
    nextAt: string;
    lastSentAt: string | null;
  } | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("clients_page");
    if (savedPage) setCurrentPage(parseInt(savedPage, 10));
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBroadcastStatus = async () => {
    try {
      const res = await api.get("/clients/broadcast-status");
      setBroadcastStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch broadcast status", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchBroadcastStatus();
  }, []);

  useEffect(() => {
    if (!broadcastStatus?.enabled || !broadcastStatus.nextAt) {
      setCountdown("");
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const update = () => setCountdown(formatCountdown(broadcastStatus.nextAt) ?? "");
    update();
    timerRef.current = setInterval(update, 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [broadcastStatus]);

  const handleToggleBroadcast = async () => {
    setBroadcastLoading(true);
    try {
      const res = await api.post("/clients/broadcast-toggle");
      setBroadcastStatus(res.data);
      message.success(res.data.enabled ? "Рассылка запущена" : "Рассылка остановлена");
    } catch (err) {
      message.error("Ошибка");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const columns = [
    {
      title: "Имя",
      dataIndex: "firstName",
      key: "firstName",
      render: (text: string, record: any) => `${text || ""} ${record.lastName || ""}`.trim() || record.username || "Без имени",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text: string) => text ? `@${text}` : "-",
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Статус",
      key: "alerts",
      render: (_: any, record: any) => (
        <Space>
          {record.hasNewOrder && <Tag color="gold">Новый заказ</Tag>}
          {record.unreadCount > 0 && <Tag color="red">Сообщений: {record.unreadCount}</Tag>}
          {!record.hasNewOrder && record.unreadCount === 0 && <Tag color="default">Ок</Tag>}
        </Space>
      ),
    },
    {
      title: "Дата регистрации",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm"),
    },
  ];

  const broadcastEnabled = broadcastStatus?.enabled ?? true;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }} styles={{ body: { padding: '10px 16px' } }}>
            <Statistic
              title="Всего клиентов"
              value={clients.length}
              valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col span={18} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {broadcastStatus?.lastSentAt && (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              Отправлено: {dayjs(broadcastStatus.lastSentAt).format("DD.MM HH:mm")}
            </span>
          )}
          {countdown && (
            <span style={{ fontSize: 12, color: '#1677ff' }}>
              Рассылка отправится {countdown}
            </span>
          )}
          <Button
            type="primary"
            loading={broadcastLoading}
            onClick={handleToggleBroadcast}
          >
            {broadcastEnabled ? "Остановить рассылку" : "Запустить рассылку"}
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={clients}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          onChange: (page) => {
            setCurrentPage(page);
            sessionStorage.setItem("clients_page", page.toString());
          }
        }}
        onRow={(record: any) => ({
          onClick: () => router.push(`/clients/${record.id}`),
          style: {
            cursor: 'pointer',
            backgroundColor: record.unreadCount > 0 ? '#fff1f0' : (record.hasNewOrder ? '#fffbe6' : 'inherit')
          }
        })}
      />
    </>
  );
}
