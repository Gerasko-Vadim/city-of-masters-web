"use client";

import { Tabs, Typography } from "antd";
import OrdersTable from "./components/OrdersTable";
import SpecialistsTable from "./components/SpecialistsTable";

const { Title } = Typography;

export default function DashboardPage() {
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
         ]}
       />
    </div>
  );
}
