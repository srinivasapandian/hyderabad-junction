import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTotalsRequest, clearTotals } from '../redux/totals/totalsActions';
import type { RootState, OrderType } from '../types';

/**
 * useTotalsSync — auto-fetches order totals whenever cartLines or orderType change.
 *
 * Use this hook on listing pages (menu, ordering) where quantity changes
 * should immediately trigger a totals recalculation.
 *
 * Do NOT use on item details page — there, dispatch fetchTotalsRequest()
 * manually only when the user confirms "Add to Cart".
 */
export function useTotalsSync(): void {
  const dispatch  = useDispatch();
  const cartLines = useSelector((s: RootState) => s.cart.cartLines);
  const orderType = useSelector((s: RootState) => s.cart.orderType);
  const prevRef   = useRef<{ len: number; orderType: OrderType }>({ len: cartLines.length, orderType });

  useEffect(() => {
    if (cartLines.length === 0) {
      dispatch(clearTotals());
      prevRef.current = { len: 0, orderType };
      return;
    }

    // Dispatch on every cart change — saga handles debounce via takeLatest + delay
    dispatch(fetchTotalsRequest());
    prevRef.current = { len: cartLines.length, orderType };
  }, [cartLines, orderType, dispatch]);
}
