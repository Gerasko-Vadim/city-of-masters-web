"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../shared";
import { Order, OrderStatus } from "../../shared/order";
import { Button, Card, Form, Input, InputNumber, Select, message, Spin, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { MapPicker } from "../MapPicker";
import { mapOrderStatusToLabel } from "../lib";

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

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const res = await api.patch(`/order/${id}`, values);
      setOrder(res.data);
      message.success("Заказ обновлен");
    } catch (err: any) {
      console.error(err);
      message.error("Не удалось обновить заказ");
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
                >
                  <Input />
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
                      `₽ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => {
                      const parsed = value?.replace(/₽\s?|(,*)/g, "") || "0";
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
