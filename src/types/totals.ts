import type { OrderTotal } from './order';

export interface TotalsState {
  loading: boolean;
  totals: OrderTotal[] | null;
  grandTotal: number | string | null;
  error: string | null;
}
