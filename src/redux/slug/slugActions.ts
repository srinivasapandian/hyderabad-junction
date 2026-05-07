import { GET_SLUG_REQUEST, GET_SLUG_SUCCESS, GET_SLUG_FAILURE } from './slugConstants';
import type { ReduxAction, SlugData } from '../../types';

export const getSlugRequest = (): ReduxAction => ({ type: GET_SLUG_REQUEST });
export const getSlugSuccess = (data: SlugData): ReduxAction<SlugData> => ({ type: GET_SLUG_SUCCESS, payload: data });
export const getSlugFailure = (error: string): ReduxAction<string> => ({ type: GET_SLUG_FAILURE, payload: error });
