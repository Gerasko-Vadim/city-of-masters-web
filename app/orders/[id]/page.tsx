"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "../../shared";
import { Order, OrderStatus } from "../../shared/order";
import {
  Button, Card, Form, Input, InputNumber, Select, message,
  Spin, Typography, Tag, Alert, Timeline,
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined, UserOutlined, PhoneOutlined,
  LinkOutlined, HistoryOutlined,
} from "@ant-design/icons";
import { MapPicker } from "../MapPicker";
import { mapOrderStatusToLabel } from "../lib";
import { io } from "socket.io-client";
import { API_PATH } from "../../shared";

const OrderTrackMap = dynamic(() => import("../OrderTrackMap"), { ssr: false });

type OrderHistoryEntry = {
  id: number;
  orderId: number;
  event: string;
  createdAt: string;
};

const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length === 0) return '';
  if (!v.startsWith('996')) v = '996' + v;
  v = v.slice(0, 12);

  if (v.length <= 3) return `+${v}`;
  if (v.length <= 6) return `+${v.slice(0, 3)}(${v.slice(3)}`;
  if (v.length <= 9) return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6)}`;
  return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6, 9)}-${v.slice(9)}`;
};

const { Title } = Typography;
const { Option } = Select;

const EDITABLE_STATUSES: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PAID];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [form] = Form.useForm();

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/order/${id}/history`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/order/${id}`);
        setOrder(res.data);
        form.setFieldsValue(res.data);
      } catch (err) {
        message.error("Не удалось загрузить заказ");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
      fetchHistory();
    }
  }, [id, form]);

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    socket.on("orderUpdate", (updatedOrder: any) => {
      if (updatedOrder.id === Number(id)) {
        setOrder(updatedOrder);
        form.setFieldsValue(updatedOrder);
        fetchHistory();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, form]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      let { lat, lng } = values;

      if (values.address && (!lat || !lng || values.address !== order?.address)) {
        const { OpenStreetMapProvider } = await import("leaflet-geosearch");
        const provider = new OpenStreetMapProvider({ params: { countrycodes: 'kg' } });
        const results = await provider.search({ query: values.address });
        if (results && results.length > 0) {
          lat = results[0].y;
          lng = results[0].x;
          message.info(`Координаты обновлены по адресу: ${results[0].label}`);
        }
      }

      if (!order) {
        message.error("Заказ не загружен");
        return;
      }

      const payload = {
        ...values,
        lat: lat ? parseFloat(lat.toString()) : order.lat,
        lng: lng ? parseFloat(lng.toString()) : order.lng,
        totalAmount: parseFloat(values.totalAmount?.toString() || "0"),
      };
      const res = await api.patch(`/order/${id}`, payload);
      const updatedOrder = res.data;
      setOrder(updatedOrder);
      form.setFieldsValue(updatedOrder);
      await fetchHistory();
      message.success("Заказ обновлен");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || "Не удалось обновить заказ";
      message.error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <div>Заказ не найден</div>;
  }

  const isEditable = EDITABLE_STATUSES.includes(order.status as OrderStatus);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Назад к списку
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <Title level={2}>Заказ #{order.id}</Title>
            <Tag color={
              order.status === OrderStatus.NEW ? "blue" :
              order.status === OrderStatus.PAID ? "gold" :
              order.status === OrderStatus.IN_PROGRESS ? "cyan" : "green"
            } style={{ fontSize: 14, padding: "4px 12px" }}>
              {mapOrderStatusToLabel[order.status as OrderStatus]}
            </Tag>
          </div>

          {!isEditable && (
            <Alert
              message="Редактирование недоступно"
              description={`Заказ в статусе «${mapOrderStatusToLabel[order.status as OrderStatus]}» — изменения не разрешены. Редактирование доступно только для статусов: Новый и Оплачен.`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={order}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Информация о клиенте" bordered={false}>
                <Form.Item
                  label="Имя клиента"
                  name="customerName"
                  rules={[{ required: true, message: "Введите имя" }]}
                >
                  <Input disabled={!isEditable} />
                </Form.Item>
                <Form.Item
                  label="Телефон"
                  name="phone"
                  rules={[{ required: true, message: "Введите телефон" }]}
                  normalize={formatPhone}
                >
                  <Input placeholder="+996(555)662-999" disabled={!isEditable} />
                </Form.Item>
              </Card>

              <Card title="Детали заказа" bordered={false}>
                <Form.Item
                  label="Статус"
                  name="status"
                  rules={[{ required: true }]}
                >
                  <Select disabled={!isEditable}>
                    {Object.values(OrderStatus).map((status) => (
                      <Option key={status} value={status}>
                        {mapOrderStatusToLabel[status]}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Адрес"
                  name="address"
                  rules={[{ required: true, message: "Введите адрес" }]}
                >
                  <Input disabled={!isEditable} />
                </Form.Item>

                <Form.Item
                  label="Сумма"
                  name="totalAmount"
                  rules={[{ required: true, message: "Введите сумму" }]}
                >
                  <InputNumber
                    disabled={!isEditable}
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value} сом`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => {
                      const parsed = value?.replace(/сом\s?|(,*)/g, "") || "0";
                      return Number(parsed);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Комиссия"
                  name="commission"
                >
                  <InputNumber
                    disabled
                    style={{ width: "100%", color: "#595959" }}
                    formatter={(value) =>
                      `${value} сом`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => {
                      const parsed = value?.replace(/сом\s?|(,*)/g, "") || "0";
                      return Number(parsed);
                    }}
                  />
                </Form.Item>

                <Form.Item label="Описание" name="description">
                  <Input.TextArea rows={2} disabled={!isEditable} />
                </Form.Item>
              </Card>
            </div>

            {order.assignedSpecialist && (
              <Card
                title={<span>👷 Мастер</span>}
                className="mt-6"
                bordered={false}
                extra={
                  <div className="flex items-center gap-3">
                    <Tag color="processing">В работе</Tag>
                    <Link href={`/specialists/${order.assignedSpecialist.id}`}>
                      <Button size="small" icon={<LinkOutlined />}>Профиль мастера</Button>
                    </Link>
                  </div>
                }
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold text-base">{order.assignedSpecialist.name}</span>
                  </div>
                  {order.assignedSpecialist.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <PhoneOutlined />
                      <span>{order.assignedSpecialist.phone}</span>
                    </div>
                  )}
                  {order.assignedSpecialist.username && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>@{order.assignedSpecialist.username}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>Telegram ID: {order.assignedSpecialist.telegramId}</span>
                  </div>
                  {order.startedAt && (
                    <div className="text-gray-400 text-sm">
                      Начал работу: {new Date(order.startedAt).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <OrderTrackMap
                    orderLat={order.lat}
                    orderLng={order.lng}
                    specialistLat={order.assignedSpecialist.lat}
                    specialistLng={order.assignedSpecialist.lng}
                    specialistName={order.assignedSpecialist.name}
                  />
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>📍 Красный — заказ</span>
                    <span>👷 Зелёный — мастер</span>
                  </div>
                </div>
              </Card>
            )}

            {isEditable && (
              <Card title="Расположение" className="mt-6" bordered={false}>
                <Form.Item name="lat" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="lng" hidden>
                  <Input />
                </Form.Item>

                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                  Кликните на карту или воспользуйтесь поиском — адрес и координаты обновятся автоматически.
                </div>
                <Form.Item>
                  <MapPicker
                    value={{ lat: order.lat, lng: order.lng }}
                    onChange={(lat, lng) => {
                      form.setFieldsValue({ lat, lng });
                    }}
                    onAddressChange={(address) => {
                      form.setFieldsValue({ address });
                    }}
                  />
                </Form.Item>
              </Card>
            )}

            {isEditable && (
              <div className="mt-6 flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                >
                  Сохранить изменения
                </Button>
              </div>
            )}
          </Form>

          {/* Order History */}
          <Card
            title={
              <span>
                <HistoryOutlined style={{ marginRight: 8 }} />
                История изменений
              </span>
            }
            className="mt-6"
            bordered={false}
          >
            {history.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
                История пуста
              </div>
            ) : (
              <Timeline
                items={history.map((h) => ({
                  color: h.event.startsWith('Статус') ? 'blue'
                    : h.event.startsWith('Мастер') ? 'green'
                    : h.event.startsWith('Заказ завершён') ? 'green'
                    : h.event.startsWith('Заказ создан') ? 'gray'
                    : 'orange',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{h.event}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {new Date(h.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
