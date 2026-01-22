"use client";

import { Table, Tag, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../shared";

export default function SpecialistsTable() {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadSpecialists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/specialists");
      setSpecialists(res.data);
    } catch (error) {
       message.error("Ошибка загрузки специалистов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecialists();
  }, [loadSpecialists]);

  return (
    <Table
      loading={loading}
      rowKey="id"
      dataSource={specialists}
      columns={[
        { title: "ID", dataIndex: "id", width: 60 },
        { title: "Имя", dataIndex: "name" },
        { 
          title: "Username", 
          dataIndex: "username",
          render: (username: string) => username ? <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer">@{username}</a> : '-' 
        },
        { title: "Telegram ID", dataIndex: "telegramId" },
        { 
          title: "Статус", 
          dataIndex: "isOnShift",
          render: (val: boolean) => val ? <Tag color="green">На смене</Tag> : <Tag color="default">Не на смене</Tag>
        },
        { 
          title: "Локация", 
          render: (_, record: any) => record.lat ? `${record.lat.toFixed(4)}, ${record.lng.toFixed(4)}` : '-'
        },
        {
          title: "Дата регистрации",
          dataIndex: "createdAt",
          render: (date: string) => new Date(date).toLocaleDateString("ru-RU") 
        }
      ]}
      onRow={(record: any) => {
        return {
          onClick: () => {
            router.push(`/specialists/${record.id}`);
          },
          style: { cursor: "pointer" },
        };
      }}
    />
  );
}
