import {
  PLACE_ORDER_REQUEST,
  PLACE_ORDER_SUCCESS,
  PLACE_ORDER_FAILURE,
  PLACE_ORDER_RESET,
  FETCH_CUSTOMER_ORDERS_REQUEST,
  FETCH_CUSTOMER_ORDERS_SUCCESS,
  FETCH_CUSTOMER_ORDERS_FAILURE,
  FETCH_ORDER_TRACKING_REQUEST,
  FETCH_ORDER_TRACKING_SUCCESS,
  FETCH_ORDER_TRACKING_FAILURE,
  CLEAR_ORDER_TRACKING,
} from './orderConstants';
import type { ReduxAction, PlacedOrder, CustomerOrder, RestaurantDetails } from '../../types';

export const placeOrderRequest = (payload: unknown): ReduxAction => ({ type: PLACE_ORDER_REQUEST, payload });
export const placeOrderSuccess = (order: PlacedOrder): ReduxAction<PlacedOrder>   => ({ type: PLACE_ORDER_SUCCESS, payload: order });
export const placeOrderFailure = (error: string): ReduxAction<string>   => ({ type: PLACE_ORDER_FAILURE, payload: error });
export const placeOrderReset   = (): ReduxAction        => ({ type: PLACE_ORDER_RESET });

// ── Customer Orders ───────────────────────────────────────────────────────────
export const fetchCustomerOrdersRequest = (): ReduxAction => ({ type: FETCH_CUSTOMER_ORDERS_REQUEST });
export const fetchCustomerOrdersSuccess = (orders: CustomerOrder[]): ReduxAction<CustomerOrder[]> => ({ type: FETCH_CUSTOMER_ORDERS_SUCCESS, payload: orders });
export const fetchCustomerOrdersFailure = (error: string): ReduxAction<string>  => ({ type: FETCH_CUSTOMER_ORDERS_FAILURE, payload: error });

// ── Order Tracking ────────────────────────────────────────────────────────────
export const fetchOrderTrackingRequest = (orderId: string, locationId: string): ReduxAction<{ orderId: string; locationId: string }> => ({
  type: FETCH_ORDER_TRACKING_REQUEST,
  payload: { orderId, locationId },
});
export const fetchOrderTrackingSuccess = (payload: { orderData: CustomerOrder | null; restaurantDetails: RestaurantDetails | null }): ReduxAction<{ orderData: CustomerOrder | null; restaurantDetails: RestaurantDetails | null }> => ({
  type: FETCH_ORDER_TRACKING_SUCCESS,
  payload, // { orderData, restaurantDetails }
});
export const fetchOrderTrackingFailure = (error: string): ReduxAction<string> => ({
  type: FETCH_ORDER_TRACKING_FAILURE,
  payload: error,
});
export const clearOrderTracking = (): ReduxAction => ({ type: CLEAR_ORDER_TRACKING });
