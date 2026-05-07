import { GET_MENU_REQUEST, GET_MENU_SUCCESS, GET_MENU_FAILURE } from './menuConstants';
import type { ReduxAction, MenuState } from '../../types';

// data holds the raw API response as-is.
// Transformation into UI-ready shape (categories, grouped, exclusiveItems)
// happens at the component level via transformMenuResponse().
const initialState: MenuState = {
  loading: false,
  data: null,
  error: null,
  orderType: null,
};

const menuReducer = (state: MenuState = initialState, action: ReduxAction): MenuState => {
  switch (action.type) {
    case GET_MENU_REQUEST:
      return { ...state, loading: true, error: null, orderType: action.payload as string };
    case GET_MENU_SUCCESS:
      return { ...state, loading: false, data: action.payload as MenuState['data'] };
    case GET_MENU_FAILURE:
      return { ...state, loading: false, error: action.payload as string };
    default:
      return state;
  }
};

export default menuReducer;
