export interface ReduxAction<T = unknown> {
  type: string;
  payload?: T;
  [key: string]: unknown;
}
