export interface CreateOrderDto {
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  lat: number;
  lng: number;
}
