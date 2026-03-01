"use client";

import { Tabs, Typography } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const OrdersTable = dynamic(() => import("./components/OrdersTable"), { ssr: false });
const SpecialistsTable = dynamic(() => import("./components/SpecialistsTable"), { ssr: false });
const ClientsTable = dynamic(() => import("./components/ClientsTable"), { ssr: false });
const GlobalMap = dynamic(() => import("./components/GlobalMap"), { ssr: false });

const { Title } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("orders");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Restore persistent tab
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, [router]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    localStorage.setItem("activeTab", key);
  };

  return (
    <div className="p-6">
       <Title level={2} className="mb-6">Панель управления</Title>
       <Tabs
         activeKey={activeTab}
         onChange={handleTabChange}
         items={[
           {
             key: 'orders',
             label: 'Заказы',
             children: <OrdersTable />,
           },
           {
             key: 'specialists',
             label: 'Специалисты',
             children: <SpecialistsTable />,
           },
           {
             key: 'clients',
             label: 'Клиенты',
             children: <ClientsTable />,
           },
           {
             key: 'map',
             label: 'Карта',
             children: <GlobalMap />,
           },
         ]}
       />
    </div>
  );
}
