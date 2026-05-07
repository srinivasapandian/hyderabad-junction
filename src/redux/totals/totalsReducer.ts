import {
  FETCH_TOTALS_REQUEST,
  FETCH_TOTALS_SUCCESS,
  FETCH_TOTALS_FAILURE,
  CLEAR_TOTALS,
} from './totalsConstants';
import type { TotalsState, ReduxAction } from '../../types';
import type { OrderTotal } from '../../types';

const initialState: TotalsState = {
  loading: false,
  totals: null,      // array of { code, title, value, sortOrder }
  grandTotal: null,  // number or string
  error: null,
};

export default function totalsReducer(state: TotalsState = initialState, action: ReduxAction): TotalsState {
  switch (action.type) {
    case FETCH_TOTALS_REQUEST:
      return { ...state, loading: true, error: null };

    case FETCH_TOTALS_SUCCESS: {
      const { totals, grandTotal } = action.payload as { totals: OrderTotal[] | null; grandTotal: number | string | null };
      return {
        ...state,
        loading: false,
        totals,
        grandTotal,
      };
    }

    case FETCH_TOTALS_FAILURE:
      return { ...state, loading: false, error: action.payload as string };

    case CLEAR_TOTALS:
      return initialState;

    default:
      return state;
  }
}
