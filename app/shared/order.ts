export interface CreateOrderDto {
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  description?: string;
  assignedSpecialistId?: number;
  lat: number;
  lng: number;
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

export interface Order extends CreateOrderDto {
  id: number;
  status: OrderStatus;
}
