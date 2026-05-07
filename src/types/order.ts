export interface OrderTotal {
  code: string;
  title: string;
  value: number | string;
  sortOrder: number;
}

export interface PlacedOrder {
  orderId: string;
  orderNo: string;
  orderType: string;
  grandTotal: number | string | null;
  etaDate: string | null;
  etaTime: string | null;
  order?: unknown;
  [key: string]: unknown;
}

export interface CustomerOrder {
  orderId: string;
  orderNo?: string;
  orderType?: string;
  orderStatus?: string | number;
  orderDate?: string;
  orderTotal?: number | string;
  grandTotal?: number | string;
  status?: string | number;
  isTransactionCompleted?: boolean;
  items?: unknown[];
  totals?: OrderTotal[];
  etaDate?: string | null;
  etaTime?: string | null;
  paymentStatus?: number;
  [key: string]: unknown;
}

export interface RestaurantDetails {
  id?: string;
  name?: string;
  phone?: string;
  mobileNo?: string;
  email?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCd?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

export interface OrderState {
  loading: boolean;
  error: string | null;
  currentOrder: PlacedOrder | null;
  ordersLoading: boolean;
  ordersError: string | null;
  ordersLoaded: boolean;
  customerOrders: CustomerOrder[];
  trackingLoading: boolean;
  trackingError: string | null;
  trackingOrder: CustomerOrder | null;
  restaurantDetails: RestaurantDetails | null;
}
