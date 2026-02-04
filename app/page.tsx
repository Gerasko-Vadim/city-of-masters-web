"use client";

import { Tabs, Typography } from "antd";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OrdersTable from "./components/OrdersTable";
import SpecialistsTable from "./components/SpecialistsTable";
import GlobalMap from "./components/GlobalMap";

const { Title } = Typography;

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="p-6">
       <Title level={2} className="mb-6">Панель управления</Title>
       <Tabs
         defaultActiveKey="orders"
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
             key: 'map',
             label: 'Карта',
             children: <GlobalMap />,
           },
         ]}
       />
    </div>
  );
}
