"use client";

import { Modal, Form, Input, InputNumber, message, Tag } from "antd";
import { api } from "../shared";
import { MapPicker } from "./MapPicker";
import { CreateOrderDto } from "../shared/order";



const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length === 0) return '';
  if (!v.startsWith('996')) v = '996' + v;
  v = v.slice(0, 12); // Max 12 digits for +996 (XXX) XXX-XXX
  
  if (v.length <= 3) return `+${v}`;
  if (v.length <= 6) return `+${v.slice(0, 3)}(${v.slice(3)}`;
  if (v.length <= 9) return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6)}`;
  return `+${v.slice(0, 3)}(${v.slice(3, 6)})${v.slice(6, 9)}-${v.slice(9)}`;
};


type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateOrderModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();

  const calculateCommission = (amount: number) => {
    return Math.max(500, Math.floor(amount * 0.15));
  };

  const onFinish = async (values: CreateOrderDto) => {
    try {
      let { lat, lng } = values;

      if (values.address && (!lat || !lng)) {
        const { OpenStreetMapProvider } = await import("leaflet-geosearch");
        const provider = new OpenStreetMapProvider({
          params: {
            countrycodes: 'kg',
          },
        });
        const results = await provider.search({ query: values.address });
        if (results && results.length > 0) {
          lat = results[0].y;
          lng = results[0].x;
          message.info(`Локация определена: ${results[0].label}`);
        }
      }

      await api.post("/order", {
        ...values,
        lat: lat ? parseFloat(lat.toString()) : undefined,
        lng: lng ? parseFloat(lng.toString()) : undefined,
        commission: values.commission ? parseFloat(values.commission.toString()) : calculateCommission(values.totalAmount),
      });
      message.success("Заказ создан");
      form.resetFields();
      onClose();
      onCreated();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Ошибка создания заказа");
    }
  };

  const onValuesChange = (changedValues: any) => {
    if (changedValues.totalAmount !== undefined) {
      form.setFieldsValue({
        commission: calculateCommission(changedValues.totalAmount),
      });
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
      <Form layout="vertical" form={form} onFinish={onFinish} onValuesChange={onValuesChange}>
        <Form.Item
          label="Имя клиента"
          name="customerName"
          rules={[{ required: true }]}
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

        <Form.Item
          label="Комиссия"
          name="commission"
          rules={[{ required: true }]}
          extra="Минимум 500 сом или 15% от суммы"
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Быстрый выбор цены:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[5000, 8000, 10000, 15000, 20000, 25000, 30000].map((p) => (
              <Tag 
                key={p} 
                color="blue"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  form.setFieldsValue({ 
                    totalAmount: p,
                    commission: calculateCommission(p)
                  });
                }}
              >
                {p} сом
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
