"use client";

import { Modal, Form, Input, message, Switch, Divider, Typography } from "antd";
import { useEffect, useState } from "react";
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
  const [autoText, setAutoText] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoToggling, setAutoToggling] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/clients/broadcast-auto-text").then(res => setAutoText(res.data.text)).catch(() => {});
    api.get("/clients/broadcast-status").then(res => setAutoEnabled(res.data.enabled)).catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await api.post("/clients/broadcast-now", { text: values.text });
      message.success(`Отправлено ${res.data.sent} из ${res.data.total} клиентов`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error("Не удалось отправить рассылку");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoText = async () => {
    setAutoSaving(true);
    try {
      await api.post("/clients/broadcast-auto-text", { text: autoText });
      message.success("Текст авторассылки сохранён");
    } catch {
      message.error("Ошибка сохранения");
    } finally {
      setAutoSaving(false);
    }
  };

  const handleToggleAuto = async (checked: boolean) => {
    setAutoToggling(true);
    try {
      const res = await api.post("/clients/broadcast-toggle");
      setAutoEnabled(res.data.enabled);
      message.success(res.data.enabled ? "Авторассылка включена" : "Авторассылка выключена");
    } catch {
      message.error("Ошибка");
    } finally {
      setAutoToggling(false);
    }
  };

  return (
    <Modal
      title="Рассылка сообщений клиентам"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Отправить сейчас"
      cancelText="Закрыть"
      width={560}
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
            rows={5}
            placeholder="Текст для немедленной отправки... Поддерживается HTML (<b>, <i>)"
          />
        </Form.Item>
      </Form>

      <Divider />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Typography.Text strong>Авторассылка (каждую субботу в 09:00)</Typography.Text>
          <Switch
            checked={autoEnabled}
            loading={autoToggling}
            onChange={handleToggleAuto}
            checkedChildren="Вкл"
            unCheckedChildren="Выкл"
          />
        </div>
        <Input.TextArea
          rows={4}
          value={autoText}
          onChange={e => setAutoText(e.target.value)}
          placeholder="Текст авторассылки..."
          style={{ marginBottom: 8 }}
        />
        <button
          type="button"
          disabled={autoSaving}
          onClick={handleSaveAutoText}
          style={{
            padding: "4px 16px",
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid #1677ff",
            background: "#e6f4ff",
            color: "#1677ff",
            cursor: "pointer",
          }}
        >
          {autoSaving ? "Сохранение..." : "Сохранить текст авторассылки"}
        </button>
      </div>
    </Modal>
  );
}
