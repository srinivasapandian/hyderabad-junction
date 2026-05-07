import { VALIDATE_CART_ITEMS_REQUEST } from './cartConstants';
import type { ReduxAction } from '../../types';

/**
 * @param {{ source: 'ordering' | 'cart' }} options
 *   source: 'cart'     → triggers Totals API after validation
 *   source: 'ordering' → no Totals API call
 */
export const validateCartItemsRequest = ({ source }: { source: 'ordering' | 'cart' }): ReduxAction<{ source: 'ordering' | 'cart' }> => ({
  type: VALIDATE_CART_ITEMS_REQUEST,
  payload: { source },
});
