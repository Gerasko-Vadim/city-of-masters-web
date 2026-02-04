"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../shared";
import { Order, OrderStatus } from "../../shared/order";
import { Button, Card, Form, Input, InputNumber, Select, message, Spin, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { MapPicker } from "../MapPicker";
import { mapOrderStatusToLabel } from "../lib";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { io } from "socket.io-client";
import { API_PATH } from "../../shared";



const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length === 0) return '';
  if (!v.startsWith('996')) v = '996' + v;
  v = v.slice(0, 12); // Max 12 digits
  
  if (v.length <= 3) return `+${v}`;
  if (v.length <= 6) return `+${v.slice(0, 3)}(${v.slice(3)}`;
  if (v.length <= 9) return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6)}`;
  return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6, 9)}-${v.slice(9)}`;
};

const { Title } = Typography;
const { Option } = Select;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

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
    }
  }, [id, form]);

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    socket.on("orderUpdate", (updatedOrder: any) => {
      if (updatedOrder.id === Number(id)) {
        setOrder(updatedOrder);
        form.setFieldsValue(updatedOrder);
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

      // Geocoding: find location by address if address is provided
      if (values.address && (!lat || !lng || values.address !== order?.address)) {
        const provider = new OpenStreetMapProvider({
          params: {
            countrycodes: 'kg',
          },
        });
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
        {/* Center column: 100% */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <Title level={2}>Заказ #{order.id}</Title>
          </div>

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
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Телефон"
                  name="phone"
                  rules={[{ required: true, message: "Введите телефон" }]}
                  normalize={formatPhone}
                >
                  <Input placeholder="+996(555)662-999" />
                </Form.Item>
              </Card>

              <Card title="Детали заказа" bordered={false}>
                <Form.Item
                  label="Статус"
                  name="status"
                  rules={[{ required: true }]}
                >
                  <Select>
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
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Сумма"
                  name="totalAmount"
                  rules={[{ required: true, message: "Введите сумму" }]}
                >
                  <InputNumber
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
              </Card>
            </div>

            <Card title="Расположение" className="mt-6" bordered={false}>
              <Form.Item name="lat" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="lng" hidden>
                <Input />
              </Form.Item>

              <Form.Item>
                <MapPicker
                  value={{ lat: order.lat, lng: order.lng }}
                  onChange={(lat, lng) => {
                    form.setFieldsValue({ lat, lng });
                  }}
                />
              </Form.Item>
            </Card>

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
          </Form>
        </div>
      </div>
    </div>
  );
}
