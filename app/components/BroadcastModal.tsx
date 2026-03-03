"use client";

import { Modal, Form, Input, Select, message } from "antd";
import { useState } from "react";
import { api } from "../shared";

interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  {
    label: "📦 Есть заказ",
    text: "Уважаемые мастера, есть заказ на [тип работы] в районе [район]. Кто готов взять — отправьте геопозицию!",
  },
  {
    label: "⚠️ Важно",
    text: "Уважаемые мастера, важное обновление: ",
  },
  {
    label: "✅ Объявление",
    text: "Уважаемые мастера! ",
  },
  {
    label: "🎉 Акция",
    text: "Уважаемые мастера, специальное предложение: ",
  },
];

export default function BroadcastModal({ open, onClose }: BroadcastModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const res = await api.post("/specialists/broadcast", {
        text: values.text,
        filter: values.filter,
      });

      message.success(`Сообщение отправлено ${res.data.sentCount} из ${res.data.total} мастеров`);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Broadcast failed", error);
      message.error("Не удалось отправить рассылку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Рассылка сообщений мастерам"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Отправить"
      cancelText="Отмена"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ filter: "ALL" }}
      >
        <Form.Item
          name="filter"
          label="Кому отправить"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="ALL">Всем</Select.Option>
            <Select.Option value="ON_SHIFT">Тем, кто на смене</Select.Option>
            <Select.Option value="OFF_SHIFT">Тем, кто не на смене</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Текст сообщения" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => form.setFieldValue("text", tpl.text)}
                style={{
                  padding: "4px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                  background: "#fafafa",
                  cursor: "pointer",
                  lineHeight: "1.4",
                }}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </Form.Item>
        <Form.Item
          name="text"
          rules={[{ required: true, message: "Введите текст сообщения" }]}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            rows={6}
            placeholder="Введите текст сообщения для мастеров... Можно использовать HTML теги (<b>, <i>, и т.д.)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
