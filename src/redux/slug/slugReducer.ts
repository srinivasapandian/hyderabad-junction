import { GET_SLUG_REQUEST, GET_SLUG_SUCCESS, GET_SLUG_FAILURE } from './slugConstants';
import type { ReduxAction, SlugData, SlugState } from '../../types';

const initialState: SlugState = {
  loading: false,
  data: null,
  error: null,
};

const slugReducer = (state: SlugState = initialState, action: ReduxAction): SlugState => {
  switch (action.type) {
    case GET_SLUG_REQUEST:
      return { ...state, loading: true, error: null };
    case GET_SLUG_SUCCESS:
      return { ...state, loading: false, data: action.payload as SlugData };
    case GET_SLUG_FAILURE:
      return { ...state, loading: false, error: action.payload as string };
    default:
      return state;
  }
};

export default slugReducer;
