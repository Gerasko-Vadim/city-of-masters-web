"use client";

import { useEffect, useState, useRef } from "react";
import { Input, Button, Card, List, Typography, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import { api, API_PATH } from "../shared/api";

const { Text } = Typography;

type Message = {
  id: number;
  text: string;
  imageUrl?: string;
  senderType: "SPECIALIST" | "OPERATOR" | "CLIENT";
  createdAt: string;
};

type Props = {
  orderId?: number;
  specialistId?: number;
  clientId?: number;
  title?: string;
};

export default function ChatBox({ orderId, specialistId, clientId, title = "Чат" }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine the endpoint and socket event based on props
    let fetchUrl = "";
    let socketEvent = "";

    if (orderId) {
      fetchUrl = `/chat/${orderId}`;
      socketEvent = `chat_${orderId}`;
    } else if (specialistId) {
      fetchUrl = `/chat/specialist/${specialistId}`;
      socketEvent = `chat_specialist_${specialistId}`;
    } else if (clientId) {
      fetchUrl = `/chat/client/${clientId}`;
      socketEvent = `chat_client_${clientId}`;
    }

    if (fetchUrl) {
      // Load history
      api.get(fetchUrl).then((res) => {
        setMessages(res.data);
      });
    }

    // Connect to WebSocket
    console.log("Connecting to WebSocket at", API_PATH);
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });
    
    socket.on("connect", () => {
      console.log("WebSocket connected, listening for", socketEvent);
    });

    socket.on(socketEvent, (msg: Message) => {
      console.log("Received message on", socketEvent, msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, specialistId, clientId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = async () => {
    if (!inputValue.trim()) return;
    try {
      await api.post("/chat/send", { orderId, specialistId, clientId, text: inputValue });
      setInputValue("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card title={title} bordered={false}>
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
                  {item.senderType === "OPERATOR" ? "Вы" : item.senderType === "CLIENT" ? "Клиент" : "Специалист"}
                </div>
                <div>{item.text}</div>
                {item.imageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a href={item.imageUrl.startsWith('/') ? `${API_PATH}${item.imageUrl}` : item.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={item.imageUrl.startsWith('/') ? `${API_PATH}${item.imageUrl}` : item.imageUrl} 
                        alt="attachment" 
                        style={{ maxWidth: "100%", borderRadius: 8, cursor: "pointer" }}
                      />
                    </a>
                  </div>
                )}
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
