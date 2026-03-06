"use client";

import { Modal, Form, Input, message } from "antd";
import { useState } from "react";
import { api } from "../shared";

interface ClientBroadcastModalProps {
  open: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  {
    label: "👋 Забота",
    text: "Привет! На связи команда <b>Город Мастеров</b> 🏠\n\nМы заботимся о вас и хотим убедиться, что всё в порядке.\n\nНужна ли вам помощь мастера? Мы готовы помочь в любой момент!",
  },
  {
    label: "🎉 Акция",
    text: "Привет! У нас для вас специальное предложение от <b>Город Мастеров</b> 🏠\n\n",
  },
  {
    label: "📢 Объявление",
    text: "Привет! На связи команда <b>Город Мастеров</b> 🏠\n\n",
  },
  {
    label: "⭐ Отзыв",
    text: "Привет! Мы надеемся, что наш мастер справился с задачей на отлично 🙌\n\nБудем рады вашему отзыву — это помогает нам становиться лучше!",
  },
];

export default function ClientBroadcastModal({ open, onClose }: ClientBroadcastModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await api.post("/clients/broadcast-now", { text: values.text });
      message.success(`Сообщение отправлено ${res.data.sent} из ${res.data.total} клиентов`);
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
      title="Рассылка сообщений клиентам"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Отправить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical">
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
            placeholder="Введите текст сообщения для клиентов... Можно использовать HTML теги (<b>, <i>, и т.д.)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
