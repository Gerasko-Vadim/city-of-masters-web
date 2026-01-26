"use client";

import { Modal, Form, Input, InputNumber, message, Tag } from "antd";
import { api } from "../shared";
import { MapPicker } from "./MapPicker";
import { CreateOrderDto } from "../shared/order";


type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateOrderModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();

  const onFinish = async (values: CreateOrderDto) => {
    try {
      await api.post("/order", values);
      message.success("Заказ создан");
      form.resetFields();
      onClose();
      onCreated();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Ошибка создания заказа");
    }
  };

  return (
    <Modal
      title="Создание заказа"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Создать"
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Имя клиента"
          name="customerName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Телефон" name="phone" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Адрес" name="address" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Описание" name="description">
          <Input.TextArea rows={3} placeholder="Введите описание или выберите из списка" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Сантехника:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Замена крана", "Установка унитаза", "Чистка засора"].map((s) => (
              <Tag 
                key={s} 
                style={{ cursor: "pointer" }}
                onClick={() => form.setFieldsValue({ description: s })}
              >
                {s}
              </Tag>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Электрика:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Замена розетки", "Установка люстры", "Ремонт проводки"].map((s) => (
              <Tag 
                key={s} 
                style={{ cursor: "pointer" }}
                onClick={() => form.setFieldsValue({ description: s })}
              >
                {s}
              </Tag>
            ))}
          </div>
        </div>

        <Form.Item
          label="Сумма"
          name="totalAmount"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Быстрый выбор цены:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[500, 1000, 1500, 2000, 3000, 5000].map((p) => (
              <Tag 
                key={p} 
                color="blue"
                style={{ cursor: "pointer" }}
                onClick={() => form.setFieldsValue({ totalAmount: p })}
              >
                {p}₽
              </Tag>
            ))}
          </div>
        </div>

        <Form.Item name="lat" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="lng" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="Точка на карте">
          <MapPicker
            onChange={(lat, lng) => {
              form.setFieldsValue({ lat, lng });
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
