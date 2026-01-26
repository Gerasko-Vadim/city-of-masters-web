"use client";

import { Button, Form, Input } from "antd";
import axios from "axios";
import { useRouter } from "next/navigation";
import { api, API_PATH } from "../shared";

export type LoginType = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const onFinish = async (values: LoginType) => {
    const res = await api.post('/auth/login', values);

    localStorage.setItem('token', res.data.accessToken);

    router.push('/');
  };

  return (
    <Form onFinish={onFinish} style={{ maxWidth: 300, margin: "100px auto" }}>
      <Form.Item name="username" rules={[{ required: true }]}>
        <Input placeholder="Логин" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true }]}>
        <Input.Password placeholder="Пароль" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block>
        Войти
      </Button>
    </Form>
  );
}
