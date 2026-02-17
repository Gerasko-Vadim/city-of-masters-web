"use client";

import { Table, Button, message, Tag, Select, Tabs } from "antd";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, API_PATH } from "../shared";
import CreateOrderModal from "../orders/CreateOrderModal";
import { mapOrderStatusToLabel } from "../orders/lib";
import { OrderStatus } from "../shared/order";
import { io } from "socket.io-client";
import axios from "axios";

const statusColors: Record<string, string> = {
  [OrderStatus.NEW]: "blue",
  [OrderStatus.PAID]: "gold",
  [OrderStatus.IN_PROGRESS]: "cyan",
  [OrderStatus.COMPLETED]: "green",
};

const statusPriority: Record<string, number> = {
  [OrderStatus.NEW]: 1,
  [OrderStatus.PAID]: 2,
  [OrderStatus.IN_PROGRESS]: 3,
  [OrderStatus.COMPLETED]: 4,
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");
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
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('orderUpdate', (updatedOrder: any) => {
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
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sortedAndFilteredOrders = useMemo(() => {
    return orders
      .filter((o) => activeTab === "ALL" || o.status === activeTab)
      .sort((a, b) => {
        const pA = statusPriority[a.status] || 99;
        const pB = statusPriority[b.status] || 99;
        if (pA !== pB) return pA - pB;
        // Secondary sort by ID desc if priority is same
        return b.id - a.id;
      });
  }, [orders, activeTab]);

  const tabItems = [
    { key: "ALL", label: "Все" },
    { key: OrderStatus.NEW, label: mapOrderStatusToLabel[OrderStatus.NEW] },
    { key: OrderStatus.PAID, label: mapOrderStatusToLabel[OrderStatus.PAID] },
    { key: OrderStatus.IN_PROGRESS, label: mapOrderStatusToLabel[OrderStatus.IN_PROGRESS] },
    { key: OrderStatus.COMPLETED, label: mapOrderStatusToLabel[OrderStatus.COMPLETED] },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />
        <Button
          onClick={() => setOpen(true)}
          type="primary"
        >
          Создать заказ
        </Button>
      </div>

      <Table
        loading={loading}
        rowKey="id"
        dataSource={sortedAndFilteredOrders}
        columns={[
          { title: "ID", dataIndex: "id", width: 60 },
          { title: "Имя", dataIndex: "customerName" },
          { title: "Телефон", dataIndex: "phone" },
          { title: "Адрес", dataIndex: "address" },
          { 
             title: "Сумма", 
             dataIndex: "totalAmount",
             render: (val: number) => `${val} сом`
          },
          { 
            title: "Комиссия", 
            dataIndex: "commission",
            render: (val: number) => `${val || 0} сом`
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
                    {[OrderStatus.NEW, OrderStatus.PAID, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED].map((s) => (
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
