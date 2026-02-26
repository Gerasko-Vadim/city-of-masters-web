"use client";

import { Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { api } from "../shared";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function ClientsTable() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const columns = [
    {
      title: "Имя",
      dataIndex: "firstName",
      key: "firstName",
      render: (text: string, record: any) => `${text || ""} ${record.lastName || ""}`.trim() || record.username || "Без имени",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text: string) => text ? `@${text}` : "-",
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Telegram ID",
      dataIndex: "telegramId",
      key: "telegramId",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Дата регистрации",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm"),
    },
  ];

  return (
    <Table
      dataSource={clients}
      columns={columns}
      rowKey="id"
      loading={loading}
      onRow={(record) => ({
        onClick: () => router.push(`/clients/${record.id}`),
        style: { cursor: 'pointer' }
      })}
    />
  );
}
