"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../shared";
import { Button, Card, Table, Tag, Typography, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { mapOrderStatusToLabel } from "../../orders/lib";
import ChatBox from "../../components/ChatBox";

const { Title, Text } = Typography;

export default function SpecialistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
                { title: "Сумма", dataIndex: "totalAmount", render: (v: number) => `${v} ₽` },
                { 
                  title: "Статус", 
                  dataIndex: "status",
                  render: (status: any) => mapOrderStatusToLabel[status as keyof typeof mapOrderStatusToLabel] || status
                },
                { title: "Дата", dataIndex: "createdAt", render: (d: string) => new Date(d).toLocaleDateString() }
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
