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
import type { OrderState, PlacedOrder, CustomerOrder, RestaurantDetails, ReduxAction } from '../../types';

const initialState: OrderState = {
  // ── Place order ──────────────────────────────────────────────────────────────
  loading:      false,
  error:        null,
  currentOrder: null, // { orderId, orderNo, orderType, grandTotal, etaDate, etaTime, order }

  // ── Customer orders list ─────────────────────────────────────────────────────
  ordersLoading: false,
  ordersError:   null,
  ordersLoaded:  false,
  customerOrders: [],  // array of past orders from fetchCustomerOrdersApi

  // ── Order tracking ───────────────────────────────────────────────────────────
  trackingLoading:   false,
  trackingError:     null,
  trackingOrder:     null, // live order data from fetchOrderDetailsApi
  restaurantDetails: null, // restaurant info from fetchRestaurantDetailsApi
};

export default function orderReducer(state: OrderState = initialState, action: ReduxAction): OrderState {
  switch (action.type) {

    // ── Place Order ────────────────────────────────────────────────────────────
    case PLACE_ORDER_REQUEST:
      return { ...state, loading: true, error: null, currentOrder: null };
    case PLACE_ORDER_SUCCESS:
      return { ...state, loading: false, currentOrder: action.payload as PlacedOrder };
    case PLACE_ORDER_FAILURE:
      return { ...state, loading: false, error: action.payload as string };
    case PLACE_ORDER_RESET:
      return initialState;

    // ── Customer Orders ────────────────────────────────────────────────────────
    case FETCH_CUSTOMER_ORDERS_REQUEST:
      return { ...state, ordersLoading: true, ordersError: null, ordersLoaded: false };
    case FETCH_CUSTOMER_ORDERS_SUCCESS:
      return { ...state, ordersLoading: false, ordersLoaded: true, customerOrders: action.payload as CustomerOrder[] };
    case FETCH_CUSTOMER_ORDERS_FAILURE:
      return { ...state, ordersLoading: false, ordersLoaded: true, ordersError: action.payload as string };

    // ── Order Tracking ─────────────────────────────────────────────────────────
    case FETCH_ORDER_TRACKING_REQUEST:
      return { ...state, trackingLoading: true, trackingError: null, trackingOrder: null };
    case FETCH_ORDER_TRACKING_SUCCESS: {
      const trackingPayload = action.payload as { orderData: CustomerOrder | null; restaurantDetails: RestaurantDetails | null };
      return {
        ...state,
        trackingLoading:   false,
        trackingOrder:     trackingPayload.orderData,
        restaurantDetails: trackingPayload.restaurantDetails ?? state.restaurantDetails,
      };
    }
    case FETCH_ORDER_TRACKING_FAILURE:
      return { ...state, trackingLoading: false, trackingError: action.payload as string };
    case CLEAR_ORDER_TRACKING:
      return {
        ...state,
        trackingLoading: false,
        trackingError:   null,
        trackingOrder:   null,
        restaurantDetails: null,
      };

    default:
      return state;
  }
}
