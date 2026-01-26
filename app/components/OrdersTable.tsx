"use client";

import { Table, Button, message, Tag, Select } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../shared";
import CreateOrderModal from "../orders/CreateOrderModal";
import { mapOrderStatusToLabel } from "../orders/lib";
import { OrderStatus } from "../orders/model";
import { io } from "socket.io-client";
import axios from "axios";

const statusColors: Record<string, string> = {
  [OrderStatus.NEW]: "blue",
  [OrderStatus.PAID]: "gold",
  [OrderStatus.IN_PROGRESS]: "cyan",
  [OrderStatus.COMPLETED]: "green",
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/order");
      setOrders(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error("Сессия истекла. Пожалуйста, войдите снова.");
        router.push('/login');
      } else {
        message.error("Ошибка загрузки заказов");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('orderUpdate', (updatedOrder: any) => {
      console.log('Order update received:', updatedOrder);
      setOrders((prevOrders) => {
        const index = prevOrders.findIndex((o) => o.id === updatedOrder.id);
        if (index > -1) {
          const newOrders = [...prevOrders];
          newOrders[index] = updatedOrder;
          return newOrders;
        } else {
          return [updatedOrder, ...prevOrders];
        }
      });
      message.info(`Заказ #${updatedOrder.id} обновлен`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        type="primary"
        style={{ marginBottom: 16 }}
      >
        Создать заказ
      </Button>

      <Table
        loading={loading}
        rowKey="id"
        dataSource={orders}
        columns={[
          { title: "ID", dataIndex: "id", width: 60 },
          { title: "Имя", dataIndex: "customerName" },
          { title: "Телефон", dataIndex: "phone" },
          { title: "Адрес", dataIndex: "address" },
          { 
             title: "Сумма", 
             dataIndex: "totalAmount",
             render: (val: number) => `${val} ₽`
          },
          {
            title: "Статус",
            dataIndex: "status",
            render: (status: OrderStatus, record: any) => {
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={status}
                    style={{ width: 140 }}
                    onChange={async (newStatus) => {
                      try {
                        await api.patch(`/order/${record.id}`, { status: newStatus });
                        message.success(`Статус заказа #${record.id} обновлен`);
                        loadOrders();
                      } catch (err) {
                        message.error("Не удалось обновить статус");
                      }
                    }}
                  >
                    {Object.values(OrderStatus).map((s) => (
                      <Select.Option key={s} value={s}>
                        <Tag color={statusColors[s] || "default"} style={{ border: 'none', margin: 0 }}>
                          {mapOrderStatusToLabel[s] || s}
                        </Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              );
            },
          },
        ]}
        onRow={(record: any) => {
          return {
            onClick: () => {
              router.push(`/orders/${record.id}`);
            },
            style: { cursor: "pointer" },
          };
        }}
      />

      <CreateOrderModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadOrders}
      />
    </>
  );
}
