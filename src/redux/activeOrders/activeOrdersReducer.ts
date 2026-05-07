import type { ReduxAction, ActiveOrder, ActiveOrdersState } from '../../types';

// ── Action types ──────────────────────────────────────────────────────────────
export const ADD_ACTIVE_ORDER            = 'activeOrders/ADD';
export const REMOVE_ACTIVE_ORDER         = 'activeOrders/REMOVE';
export const UPDATE_ACTIVE_ORDERS        = 'activeOrders/UPDATE_ALL';
export const UPDATE_SINGLE_ACTIVE_ORDER  = 'activeOrders/UPDATE_SINGLE';
export const CLEAR_ACTIVE_ORDERS         = 'activeOrders/CLEAR';

// ── Action creators ───────────────────────────────────────────────────────────
export const addActiveOrderAction            = (order: ActiveOrder): ReduxAction<ActiveOrder>           => ({ type: ADD_ACTIVE_ORDER,           payload: order });
export const removeActiveOrderAction         = (orderId: string): ReduxAction<string>                   => ({ type: REMOVE_ACTIVE_ORDER,         payload: orderId });
export const updateActiveOrdersAction        = (orders: ActiveOrder[]): ReduxAction<ActiveOrder[]>      => ({ type: UPDATE_ACTIVE_ORDERS,        payload: orders });
export const updateSingleActiveOrderAction   = (freshOrder: Record<string, unknown>): ReduxAction<Record<string, unknown>> => ({ type: UPDATE_SINGLE_ACTIVE_ORDER,  payload: freshOrder });
export const clearActiveOrdersAction         = (): ReduxAction                                          => ({ type: CLEAR_ACTIVE_ORDERS });

// ── Reducer ───────────────────────────────────────────────────────────────────
const initialState: ActiveOrdersState = {
  orders: [],
};

export default function activeOrdersReducer(state: ActiveOrdersState = initialState, action: ReduxAction): ActiveOrdersState {
  switch (action.type) {

    case ADD_ACTIVE_ORDER: {
      const order = action.payload as ActiveOrder;
      // Duplicate guard — don't add same orderId twice
      if (state.orders.some((o) => o.orderId === order.orderId)) return state;
      return {
        ...state,
        orders: [
          ...state.orders,
          {
            orderId:     order.orderId,
            orderNo:     order.orderNo,
            orderType:   order.orderType,
            orderStatus: order.orderStatus ?? 0,
            etaDate:     order.etaDate  ?? null,
            etaTime:     order.etaTime  ?? null,
            grandTotal:  order.grandTotal ?? null,
            addedAt:     Date.now(),
            _raw:        order._raw || null,
          },
        ],
      };
    }

    case REMOVE_ACTIVE_ORDER:
      return {
        ...state,
        orders: state.orders.filter((o) => o.orderId !== (action.payload as string)),
      };

    case UPDATE_ACTIVE_ORDERS:
      return { ...state, orders: action.payload as ActiveOrder[] };

    // Single-order sync — called by OrderTracking after its fetchOrderDetailsApi fetch
    // so the active bar pill reflects the real status without waiting for the 30s poll
    case UPDATE_SINGLE_ACTIVE_ORDER: {
      const fresh = action.payload as Record<string, unknown>;
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.orderId === fresh.orderId
            ? {
                ...o,
                orderStatus: (fresh.status     ?? fresh.orderStatus ?? o.orderStatus) as number,
                etaDate:     (fresh.etaDate    ?? o.etaDate) as string | null,
                etaTime:     (fresh.etaTime    ?? o.etaTime) as string | null,
                grandTotal:  (fresh.orderTotal || o.grandTotal) as number | string | null,
                _raw:        { ...o._raw, ...fresh },
              }
            : o
        ),
      };
    }

    case CLEAR_ACTIVE_ORDERS:
      return { ...state, orders: [] };

    default:
      return state;
  }
}
