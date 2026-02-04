"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../shared";
import { Button, Card, Table, Tag, Typography, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { mapOrderStatusToLabel } from "../../orders/lib";
import ChatBox from "../../components/ChatBox";
import { io } from "socket.io-client";
import { API_PATH } from "../../shared";

const { Title, Text } = Typography;

export default function SpecialistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrderDuration, setActiveOrderDuration] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (specialist?.activeOrder?.startedAt) {
      const updateTimer = () => {
        const start = new Date(specialist.activeOrder.startedAt).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setActiveOrderDuration(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [specialist]);

  useEffect(() => {
    const fetchSpecialist = async () => {
      try {
        const res = await api.get(`/specialists/${id}`);
        setSpecialist(res.data);
      } catch (err) {
        message.error("Не удалось загрузить специалиста");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSpecialist();
  }, [id]);

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    socket.on("specialistUpdate", (updatedSpec: any) => {
      if (updatedSpec.id === Number(id)) {
        setSpecialist((prev: any) => ({ ...prev, ...updatedSpec }));
      }
    });

    socket.on("orderUpdate", (updatedOrder: any) => {
      // If the update is for the specialist's active order, or relates to them
      setSpecialist((prev: any) => {
        if (!prev) return prev;
        
        // Update active order if it matches
        let newActiveOrder = prev.activeOrder;
        if (prev.activeOrder && prev.activeOrder.id === updatedOrder.id) {
          newActiveOrder = updatedOrder;
        }

        // Update orders history if it exists
        const newOrders = prev.orders?.map((o: any) => o.id === updatedOrder.id ? updatedOrder : o);

        return { ...prev, activeOrder: newActiveOrder, orders: newOrders };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) return <Spin className="flex justify-center mt-10" />;
  if (!specialist) return <div>Специалист не найден</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mb-4">
        Назад
      </Button>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[70%]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Title level={2}>{specialist.name || `Специалист #${specialist.id}`}</Title>
              <Text type="secondary">Telegram ID: {specialist.telegramId}</Text>
            </div>
            <Tag color={specialist.isOnShift ? "green" : "default"}>
              {specialist.isOnShift ? "На смене" : "Не на смене"}
            </Tag>
          </div>

      {specialist.activeOrder && (
        <Card title="👉 Активный заказ в работе" className="mb-6 border-blue-400 bg-blue-50">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <Title level={4}>Заказ #{specialist.activeOrder.id}</Title>
              <p><strong>Адрес:</strong> {specialist.activeOrder.address}</p>
              <p><strong>Сумма:</strong> {specialist.activeOrder.totalAmount} сом</p>
              {specialist.activeOrder.description && (
                <p><strong>Описание:</strong> {specialist.activeOrder.description}</p>
              )}
            </div>
            <div className="text-center md:text-right mt-4 md:mt-0">
              <Text type="secondary">Время в работе:</Text>
              <div className="text-3xl font-mono text-blue-600">
                {activeOrderDuration}
              </div>
              <Button 
                type="primary" 
                className="mt-2"
                onClick={() => router.push(`/orders/${specialist.activeOrder.id}`)}
              >
                Перейти к заказу
              </Button>
            </div>
          </div>
        </Card>
      )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card title="Информация">
                <p><strong>Username:</strong> {specialist.username ? <a href={`https://t.me/${specialist.username}`} target="_blank" rel="noopener noreferrer">@{specialist.username}</a> : 'Не указан'}</p>
                <p><strong>Дата регистрации:</strong> {new Date(specialist.createdAt).toLocaleString()}</p>
                <p><strong>Последняя локация:</strong> {specialist.lat ? `${specialist.lat.toFixed(6)}, ${specialist.lng.toFixed(6)}` : 'Неизвестно'}</p>
            </Card>
            <Card title="Статистика">
                <p><strong>Всего заказов:</strong> {specialist.orders?.length || 0}</p>
            </Card>
          </div>

          <Title level={3}>История заказов</Title>
          <Table 
            dataSource={specialist.orders || []}
            rowKey="id"
            columns={[
                { title: "ID", dataIndex: "id", width: 60 },
                { title: "Клиент", dataIndex: "customerName" },
                { title: "Адрес", dataIndex: "address" },
                { title: "Сумма", dataIndex: "totalAmount", render: (v: number) => `${v} сом` },
                { 
                  title: "Статус", 
                  dataIndex: "status",
                  render: (status: any) => mapOrderStatusToLabel[status as keyof typeof mapOrderStatusToLabel] || status
                },
                { title: "Дата", dataIndex: "createdAt", render: (d: string) => new Date(d).toLocaleDateString() },
                { 
                  title: "Время работы", 
                  render: (_: any, record: any) => {
                    if (!record.startedAt) return "—";
                    
                    const end = record.completedAt ? new Date(record.completedAt).getTime() : 
                                record.status === 'IN_PROGRESS' ? null : null;
                    
                    if (!end && record.status === 'IN_PROGRESS') return <Tag color="blue">В процессе</Tag>;
                    if (!record.completedAt) return "—";

                    const diff = new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime();
                    const s = Math.floor(diff / 1000);
                    const h = Math.floor(s / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    const remS = s % 60;
                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
                  }
                }
            ]}
            onRow={(record: any) => ({
                onClick: () => router.push(`/orders/${record.id}`),
                style: { cursor: 'pointer' }
            })}
          />
        </div>

        <div className="lg:w-[30%]">
          <ChatBox specialistId={specialist.id} title={`Чат с ${specialist.name || 'специалистом'}`} />
        </div>
      </div>
    </div>
  );
}
