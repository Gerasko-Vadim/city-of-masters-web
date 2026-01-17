"use client";

import { Table, Button, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { api } from "../shared";
import CreateOrderModal from "./CreateOrderModal";
import { mapOrderStatusToLabel } from "./lib";
import { OrderStatus } from "./model";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get("/order");
      setOrders(res.data);
    } catch {
      message.error("Ошибка загрузки заказов");
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
        rowKey="id"
        dataSource={orders}
        columns={[
          { title: "Имя", dataIndex: "customerName" },
          { title: "Телефон", dataIndex: "phone" },
          { title: "Адрес", dataIndex: "address" },
          { title: "Сумма", dataIndex: "totalAmount" },
          {
            title: "Статус",
            dataIndex: "status",
            render: (status: OrderStatus) => {
              return mapOrderStatusToLabel[status];
            },
          },
        ]}
      />

      <CreateOrderModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadOrders}
      />
    </>
  );
}
