"use client";

import { Tabs, Typography } from "antd";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const OrdersTable = dynamic(() => import("./components/OrdersTable"), { ssr: false });
const SpecialistsTable = dynamic(() => import("./components/SpecialistsTable"), { ssr: false });
const GlobalMap = dynamic(() => import("./components/GlobalMap"), { ssr: false });

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
