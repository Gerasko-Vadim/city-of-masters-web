"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, Card, Descriptions, Tag, Typography, Button, Space, message, Tabs, Select } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../../shared";
import dayjs from "dayjs";
import { mapOrderStatusToLabel } from "../../orders/lib";
import { OrderStatus } from "../../shared/order";
import ChatBox from "../../components/ChatBox";

const statusColors: Record<string, string> = {
  [OrderStatus.NEW]: "blue",
  [OrderStatus.PAID]: "gold",
  [OrderStatus.IN_PROGRESS]: "cyan",
  [OrderStatus.COMPLETED]: "green",
};

const statusPriority: Record<string, number> = {
  [OrderStatus.NEW]: 1,
  [OrderStatus.PAID]: 2,
  [OrderStatus.IN_PROGRESS]: 3,
  [OrderStatus.COMPLETED]: 4,
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await api.get(`/clients/${id}`);
        setClient(res.data);
      } catch (err) {
        message.error("Не удалось загрузить данные клиента");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  if (loading) return <div className="p-6">Загрузка...</div>;
  if (!client) return <div className="p-6">Клиент не найден</div>;

  const sortedOrders = [...(client.orders || [])].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.id - a.id;
  });

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await api.patch(`/order/${orderId}`, { status: newStatus });
      message.success("Статус заказа обновлен");
      // Refresh client data to show updated status
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
    } catch (err) {
      message.error("Не удалось обновить статус заказа");
      console.error(err);
    }
  };

  const orderColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Адрес",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Сумма",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (val: number) => `${val} сом`,
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status: OrderStatus, record: any) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
          <Tag color={statusColors[status] || "default"}>
            {mapOrderStatusToLabel[status] || status}
          </Tag>
          <Select
            value={status}
            onChange={(value: OrderStatus) => handleStatusChange(record.id, value)}
            style={{ width: 130 }}
            options={Object.values(OrderStatus).map(s => ({
              value: s,
              label: mapOrderStatusToLabel[s] || s
            }))}
          />
        </div>
      ),
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm"),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => router.back()}
        className="mb-6"
      >
        Назад к списку
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[70%] space-y-6">
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>Информация о клиенте</span>
                <Button
                  type="primary"
                  href={client.username ? `https://t.me/${client.username}` : `tg://user?id=${client.telegramId}`}
                  target={client.username ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  icon={<span>✈️</span>}
                >
                  Написать в Telegram
                </Button>
              </div>
            }
          >
            <Descriptions bordered>
              <Descriptions.Item label="Имя">{client.firstName} {client.lastName}</Descriptions.Item>
              <Descriptions.Item label="Username">{client.username ? `@${client.username}` : "-"}</Descriptions.Item>
              <Descriptions.Item label="Телефон">{client.phone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Telegram ID">{client.telegramId}</Descriptions.Item>
              <Descriptions.Item label="Дата регистрации">{dayjs(client.createdAt).format("DD.MM.YYYY HH:mm")}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="История заказов">
            <Table 
              dataSource={sortedOrders} 
              columns={orderColumns} 
              rowKey="id" 
              onRow={(record: any) => ({
                onClick: () => router.push(`/orders/${record.id}`),
                style: { cursor: 'pointer' }
              })}
            />
          </Card>
        </div>

        <div className="lg:w-[30%]">
          <ChatBox clientId={client.id} title={`Чат с ${client.firstName || 'клиентом'}`} />
        </div>
      </div>
    </div>
  );
}
