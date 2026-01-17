import { OrderStatus } from "./model";

export const mapOrderStatusToLabel = {
  [OrderStatus.NEW]: 'Новый',
  [OrderStatus.IN_PROGRESS]: 'В работе',
  [OrderStatus.DONE]: 'Завершён',
};