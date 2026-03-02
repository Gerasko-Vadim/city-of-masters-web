export const ORDER_CATEGORIES = [
  'Сантехника',
  'Электрика',
  'Сборка мебели',
  'Уборка',
  'Ремонт техники',
  'Покраска',
  'Двери и замки',
  'Грузчики',
  'Другое',
] as const;

export interface CreateOrderDto {
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  category: string;
  description?: string;
  assignedSpecialistId?: number;
  lat: number;
  lng: number;
  commission?: number;
}

export enum OrderStatus {
  NEW = 'NEW',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const mapOrderStatusToLabel = {
  [OrderStatus.NEW]: 'Новый',
  [OrderStatus.PAID]: 'Оплачен',
  [OrderStatus.IN_PROGRESS]: 'В работе',
  [OrderStatus.COMPLETED]: 'Завершён',
};

export interface AssignedSpecialist {
  id: number;
  telegramId: string;
  name: string;
  username?: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

export interface Order extends CreateOrderDto {
  id: number;
  status: OrderStatus;
  commission: number;
  assignedSpecialist?: AssignedSpecialist;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}
