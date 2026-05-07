import { GET_MENU_REQUEST, GET_MENU_SUCCESS, GET_MENU_FAILURE } from './menuConstants';
import type { ReduxAction } from '../../types';

export const getMenuRequest = (orderType: string): ReduxAction<string> => ({
  type: GET_MENU_REQUEST,
  payload: orderType,
});

export const getMenuSuccess = (data: unknown): ReduxAction => ({
  type: GET_MENU_SUCCESS,
  payload: data,
});

export const getMenuFailure = (error: string): ReduxAction<string> => ({
  type: GET_MENU_FAILURE,
  payload: error,
});
