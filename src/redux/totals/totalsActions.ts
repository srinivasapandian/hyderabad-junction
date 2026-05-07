import {
  FETCH_TOTALS_REQUEST,
  CLEAR_TOTALS,
} from './totalsConstants';
import type { ReduxAction } from '../../types';

interface FetchTotalsOptions {
  deliveryFee?: number | null;
}

export const fetchTotalsRequest = (options: FetchTotalsOptions = {}): ReduxAction<FetchTotalsOptions> => ({ type: FETCH_TOTALS_REQUEST, payload: options });
export const clearTotals        = (): ReduxAction => ({ type: CLEAR_TOTALS });
