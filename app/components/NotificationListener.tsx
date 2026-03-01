"use client";

import { useEffect } from "react";
import { notification } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import { API_PATH } from "../shared/api";
import { useRouter } from "next/navigation";

export default function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    const socket = io(API_PATH, { transports: ["websocket", "polling"] });

    const playSound = () => {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {/* autoplay blocked or file missing */});
    };

    socket.on("admin_notification", (data: any) => {
      console.log("New admin notification:", data);
      
      if (data.type === "CHAT_MESSAGE") {
        playSound();
        notification.open({
          message: `Новое сообщение от: ${data.specialistName || data.clientName || 'Клиента'}`,
          description: data.text,
          icon: <MessageOutlined style={{ color: "#1890ff" }} />,
          onClick: () => {
            if (data.specialistId) router.push(`/specialists/${data.specialistId}`);
            else if (data.clientId) router.push(`/clients/${data.clientId}`);
          },
          duration: 5,
        });
      }

      if (data.type === "NEW_ORDER") {
        playSound();
        notification.success({
          message: `🔥 Новый заказ! #${data.orderId}`,
          description: `Клиент: ${data.customerName || 'Без имени'}`,
          onClick: () => {
            router.push(`/orders/${data.orderId}`);
          },
          duration: 10,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  return null;
}
