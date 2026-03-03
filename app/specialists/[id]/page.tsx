"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../shared";
import { Button, Card, Form, Input, Table, Tag, Typography, Spin, message } from "antd";
import { ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { mapOrderStatusToLabel } from "../../orders/lib";
import ChatBox from "../../components/ChatBox";
import { io } from "socket.io-client";
import { API_PATH } from "../../shared";

const { Title, Text } = Typography;

function getDisplayName(specialist: any): string {
  return specialist.fullName || specialist.name || `Специалист #${specialist.id}`;
}

export default function SpecialistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrderDuration, setActiveOrderDuration] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();

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
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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
      setSpecialist((prev: any) => {
        if (!prev) return prev;
        let newActiveOrder = prev.activeOrder;
        if (prev.activeOrder && prev.activeOrder.id === updatedOrder.id) {
          newActiveOrder = updatedOrder;
        }
        const newOrders = prev.orders?.map((o: any) => o.id === updatedOrder.id ? updatedOrder : o);
        return { ...prev, activeOrder: newActiveOrder, orders: newOrders };
      });
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const handleBan = async () => {
    setBanLoading(true);
    try {
      const newStatus = !specialist.isBanned;
      await api.patch(`/specialists/${id}/ban`, { isBanned: newStatus });
      setSpecialist((prev: any) => ({ ...prev, isBanned: newStatus }));
      message.success(newStatus ? "Специалист заблокирован" : "Специалист разблокирован");
    } catch (err) {
      message.error("Не удалось изменить статус блокировки");
    } finally {
      setBanLoading(false);
    }
  };

  const startEditing = () => {
    form.setFieldsValue({
      fullName: specialist.fullName || "",
      phone: specialist.phone || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);
      const res = await api.patch(`/specialists/${id}`, values);
      setSpecialist((prev: any) => ({ ...prev, ...res.data }));
      setEditing(false);
      message.success("Данные сохранены");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Ошибка сохранения");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <Spin className="flex justify-center mt-10" />;
  if (!specialist) return <div>Специалист не найден</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mb-4">
        Назад
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[70%]">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <Title level={2} style={{ marginBottom: 2 }}>
                {getDisplayName(specialist)}
              </Title>
              {specialist.username && (
                <a
                  href={`https://t.me/${specialist.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#8c8c8c', fontSize: 14 }}
                >
                  @{specialist.username}
                </a>
              )}
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Telegram ID: {specialist.telegramId}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {specialist.isBanned && <Tag color="error">Заблокирован</Tag>}
              <Tag color={specialist.isOnShift ? "green" : "default"}>
                {specialist.isOnShift ? "На смене" : "Не на смене"}
              </Tag>
              <Button
                danger={!specialist.isBanned}
                type={specialist.isBanned ? "default" : "primary"}
                onClick={handleBan}
                loading={banLoading}
              >
                {specialist.isBanned ? "Разблокировать" : "Заблокировать"}
              </Button>
            </div>
          </div>

          {/* Active order */}
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
                  <div className="text-3xl font-mono text-blue-600">{activeOrderDuration}</div>
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

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card
              title="Информация"
              extra={
                !editing ? (
                  <Button size="small" icon={<EditOutlined />} onClick={startEditing}>
                    Редактировать
                  </Button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" icon={<CloseOutlined />} onClick={cancelEditing}>
                      Отмена
                    </Button>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saveLoading}>
                      Сохранить
                    </Button>
                  </div>
                )
              }
            >
              {editing ? (
                <Form form={form} layout="vertical" size="small">
                  <Form.Item label="ФИО" name="fullName">
                    <Input placeholder="Иванов Иван Иванович" />
                  </Form.Item>
                  <Form.Item
                    label="Телефон"
                    name="phone"
                    rules={[{ pattern: /^[\d+\s()-]+$/, message: 'Введите корректный номер' }]}
                  >
                    <Input placeholder="+996 (555) 000-000" />
                  </Form.Item>
                </Form>
              ) : (
                <>
                  <p>
                    <strong>ФИО:</strong>{" "}
                    {specialist.fullName || <Text type="secondary">Не указано</Text>}
                  </p>
                  <p>
                    <strong>Телефон:</strong>{" "}
                    {specialist.phone
                      ? <a href={`tel:${specialist.phone}`}>{specialist.phone}</a>
                      : <Text type="secondary">Не указан</Text>
                    }
                  </p>
                  <p>
                    <strong>Username:</strong>{" "}
                    {specialist.username
                      ? <a href={`https://t.me/${specialist.username}`} target="_blank" rel="noopener noreferrer">@{specialist.username}</a>
                      : <Text type="secondary">Не указан</Text>
                    }
                  </p>
                  <p><strong>Дата регистрации:</strong> {new Date(specialist.createdAt).toLocaleString()}</p>
                  <p>
                    <strong>Последняя локация:</strong>{" "}
                    {specialist.lat && specialist.lng
                      ? `${specialist.lat.toFixed(6)}, ${specialist.lng.toFixed(6)}`
                      : <Text type="secondary">Неизвестно</Text>
                    }
                  </p>
                </>
              )}
            </Card>

            <Card title="Статистика">
              <p><strong>Всего заказов:</strong> {specialist.orders?.length || 0}</p>
            </Card>
          </div>

          {/* Orders history */}
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
                  if (!record.completedAt && record.status === 'IN_PROGRESS') return <Tag color="blue">В процессе</Tag>;
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
          <ChatBox specialistId={specialist.id} title={`Чат с ${getDisplayName(specialist)}`} />
        </div>
      </div>
    </div>
  );
}
