"use client";

import { Table, Tag, Space } from "antd";
import { useEffect, useState } from "react";
import { api } from "../shared";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function ClientsTable() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("clients_page");
    if (savedPage) {
      setCurrentPage(parseInt(savedPage, 10));
    }
  }, []);

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
      title: "Статус",
      key: "alerts",
      render: (_: any, record: any) => (
        <Space>
          {record.hasNewOrder && <Tag color="gold">Новый заказ</Tag>}
          {record.unreadCount > 0 && <Tag color="red">Сообщений: {record.unreadCount}</Tag>}
          {!record.hasNewOrder && record.unreadCount === 0 && <Tag color="default">Ок</Tag>}
        </Space>
      ),
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
      pagination={{
        current: currentPage,
        onChange: (page) => {
          setCurrentPage(page);
          sessionStorage.setItem("clients_page", page.toString());
        }
      }}
      onRow={(record: any) => ({
        onClick: () => router.push(`/clients/${record.id}`),
        style: { 
          cursor: 'pointer',
          backgroundColor: record.unreadCount > 0 ? '#fff1f0' : (record.hasNewOrder ? '#fffbe6' : 'inherit')
        }
      })}
    />
  );
}
