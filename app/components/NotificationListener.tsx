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

    socket.on("admin_notification", (data: any) => {
      console.log("New admin notification:", data);
      
      if (data.type === "CHAT_MESSAGE") {
        notification.open({
          message: `Новое сообщение от: ${data.specialistName}`,
          description: data.text,
          icon: <MessageOutlined style={{ color: "#1890ff" }} />,
          onClick: () => {
            router.push(`/specialists/${data.specialistId}`);
          },
          duration: 5,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  return null;
}
