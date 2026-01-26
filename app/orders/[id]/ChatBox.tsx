"use client";

import { useEffect, useState, useRef } from "react";
import { Input, Button, Card, List, Typography, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import { api, API_PATH } from "../../shared";

const { Text } = Typography;

type Message = {
  id: number;
  text: string;
  senderType: "SPECIALIST" | "OPERATOR";
  createdAt: string;
};

type Props = {
  orderId: number;
};

export default function ChatBox({ orderId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    api.get(`/chat/${orderId}`).then((res) => {
      setMessages(res.data);
    });

    // Connect to WebSocket
    const socket = io(API_PATH);
    socket.on(`chat_${orderId}`, (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = async () => {
    if (!inputValue.trim()) return;
    try {
      await api.post("/chat/send", { orderId, text: inputValue });
      setInputValue("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card title="Чат со специалистом" bordered={false}>
      <div 
        ref={scrollRef}
        style={{ height: 600, overflowY: "auto", marginBottom: 16, border: "1px solid #f0f0f0", padding: 12, borderRadius: 8 }}
      >
        <List
          dataSource={messages}
          renderItem={(item) => (
            <div style={{ 
                display: "flex", 
                justifyContent: item.senderType === "OPERATOR" ? "flex-end" : "flex-start",
                marginBottom: 12 
            }}>
              <div style={{ 
                maxWidth: "80%", 
                padding: "8px 12px", 
                borderRadius: 12, 
                backgroundColor: item.senderType === "OPERATOR" ? "#1890ff" : "#f5f5f5",
                color: item.senderType === "OPERATOR" ? "#fff" : "#000",
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>
                  {item.senderType === "OPERATOR" ? "Вы" : "Специалист"}
                </div>
                <div>{item.text}</div>
                <div style={{ fontSize: 10, opacity: 0.6, textAlign: "right", marginTop: 4 }}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )}
        />
      </div>
      <Space.Compact style={{ width: "100%" }}>
        <Input 
          placeholder="Введите сообщение..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={onSend}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={onSend}>
          Отправить
        </Button>
      </Space.Compact>
    </Card>
  );
}
