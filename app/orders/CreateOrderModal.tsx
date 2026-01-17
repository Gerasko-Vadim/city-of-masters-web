"use client";

import { Modal, Form, Input, InputNumber, message } from "antd";
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

        <Form.Item
          label="Сумма"
          name="totalAmount"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

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
