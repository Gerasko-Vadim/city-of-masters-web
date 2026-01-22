export interface CreateOrderDto {
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  lat: number;
  lng: number;
}

export enum OrderStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface Order extends CreateOrderDto {
  id: number;
  status: OrderStatus;
}
