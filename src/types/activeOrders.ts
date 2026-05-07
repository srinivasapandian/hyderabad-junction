export interface ActiveOrder {
  orderId: string;
  orderNo: string;
  orderType: string;
  orderStatus: number;
  etaDate: string | null;
  etaTime: string | null;
  grandTotal: number | string | null;
  addedAt: number;
  _raw: Record<string, unknown> | null;
}

export interface ActiveOrdersState {
  orders: ActiveOrder[];
}
