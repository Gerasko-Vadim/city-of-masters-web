"use client";

import { Modal, Form, Input, message, Switch, Divider, Typography, Tabs, DatePicker, Button, List, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { api } from "../shared";
import dayjs, { Dayjs } from "dayjs";

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
  {
    label: "🎊 Праздник",
    text: "Привет! Команда <b>Город Мастеров</b> поздравляет вас с праздником! 🎉\n\nЖелаем тепла, уюта и надёжных мастеров рядом!",
  },
];

function TemplateButtons({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.label}
          type="button"
          onClick={() => onSelect(tpl.text)}
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
  );
}

export default function ClientBroadcastModal({ open, onClose }: ClientBroadcastModalProps) {
  // Now tab
  const [nowForm] = Form.useForm();
  const [nowLoading, setNowLoading] = useState(false);

  // Schedule tab
  const [schedText, setSchedText] = useState("");
  const [schedDate, setSchedDate] = useState<Dayjs | null>(null);
  const [schedLoading, setSchedLoading] = useState(false);
  const [scheduled, setScheduled] = useState<{ id: string; text: string; scheduledAt: string }[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Auto tab
  const [autoText, setAutoText] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoToggling, setAutoToggling] = useState(false);

  const loadScheduled = () =>
    api.get("/clients/broadcast-scheduled").then(res => setScheduled(res.data)).catch(() => {});

  useEffect(() => {
    if (!open) return;
    api.get("/clients/broadcast-auto-text").then(res => setAutoText(res.data.text)).catch(() => {});
    api.get("/clients/broadcast-status").then(res => setAutoEnabled(res.data.enabled)).catch(() => {});
    loadScheduled();
  }, [open]);

  // ── Now ──────────────────────────────────────────────────────────────────
  const handleSendNow = async () => {
    try {
      const values = await nowForm.validateFields();
      setNowLoading(true);
      const res = await api.post("/clients/broadcast-now", { text: values.text });
      message.success(`Отправлено ${res.data.sent} из ${res.data.total} клиентов`);
      nowForm.resetFields();
      onClose();
    } catch {
      message.error("Не удалось отправить рассылку");
    } finally {
      setNowLoading(false);
    }
  };

  // ── Schedule ─────────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!schedText.trim()) return message.warning("Введите текст");
    if (!schedDate) return message.warning("Выберите дату и время");
    setSchedLoading(true);
    try {
      await api.post("/clients/broadcast-schedule", {
        text: schedText,
        scheduledAt: schedDate.toISOString(),
      });
      message.success("Рассылка запланирована");
      setSchedText("");
      setSchedDate(null);
      loadScheduled();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Ошибка");
    } finally {
      setSchedLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await api.delete(`/clients/broadcast-scheduled/${id}`);
      setScheduled(prev => prev.filter(s => s.id !== id));
    } catch {
      message.error("Ошибка отмены");
    } finally {
      setCancellingId(null);
    }
  };

  // ── Auto ─────────────────────────────────────────────────────────────────
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

  const handleToggleAuto = async () => {
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

  const items = [
    {
      key: "now",
      label: "Отправить сейчас",
      children: (
        <Form form={nowForm} layout="vertical">
          <Form.Item label="Текст" style={{ marginBottom: 0 }}>
            <TemplateButtons onSelect={t => nowForm.setFieldValue("text", t)} />
          </Form.Item>
          <Form.Item
            name="text"
            rules={[{ required: true, message: "Введите текст" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea rows={6} placeholder="Текст для немедленной отправки... Поддерживается HTML (<b>, <i>)" />
          </Form.Item>
          <Button type="primary" loading={nowLoading} onClick={handleSendNow} block>
            Отправить всем клиентам
          </Button>
        </Form>
      ),
    },
    {
      key: "schedule",
      label: "Запланировать",
      children: (
        <div>
          <div style={{ marginBottom: 8 }}>
            <TemplateButtons onSelect={setSchedText} />
          </div>
          <Input.TextArea
            rows={5}
            value={schedText}
            onChange={e => setSchedText(e.target.value)}
            placeholder="Текст поздравления или объявления..."
            style={{ marginBottom: 12 }}
          />
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="DD.MM.YYYY HH:mm"
            placeholder="Выберите дату и время"
            value={schedDate}
            onChange={setSchedDate}
            disabledDate={d => d.isBefore(dayjs(), "day")}
            style={{ width: "100%", marginBottom: 12 }}
          />
          <Button type="primary" loading={schedLoading} onClick={handleSchedule} block>
            Запланировать рассылку
          </Button>

          {scheduled.length > 0 && (
            <>
              <Divider style={{ margin: "16px 0 8px" }} />
              <Typography.Text strong style={{ fontSize: 13 }}>Запланированные:</Typography.Text>
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={scheduled}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="del"
                        title="Отменить рассылку?"
                        onConfirm={() => handleCancel(item.id)}
                        okText="Да"
                        cancelText="Нет"
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={cancellingId === item.id}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#1677ff", marginBottom: 2 }}>
                        {dayjs(item.scheduledAt).format("DD.MM.YYYY HH:mm")}
                      </div>
                      <div style={{ fontSize: 13, color: "#333", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.text}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      ),
    },
    {
      key: "auto",
      label: "Авторассылка",
      children: (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Typography.Text>Каждую субботу в 09:00 (Бишкек)</Typography.Text>
            <Switch
              checked={autoEnabled}
              loading={autoToggling}
              onChange={handleToggleAuto}
              checkedChildren="Вкл"
              unCheckedChildren="Выкл"
            />
          </div>
          <Input.TextArea
            rows={7}
            value={autoText}
            onChange={e => setAutoText(e.target.value)}
            placeholder="Текст авторассылки..."
            style={{ marginBottom: 12 }}
          />
          <Button onClick={handleSaveAutoText} loading={autoSaving} block>
            Сохранить текст авторассылки
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Рассылка клиентам"
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
    >
      <Tabs items={items} />
    </Modal>
  );
}
