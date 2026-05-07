import type { Customization, DigiMenuMedia, MenuItem, TaxEntry } from './menu';

export interface Modifier {
  typeId: string;
  optionId: string;
  typeName?: string;
  optionName: string;
  price: number | string;
}

export interface CartLine {
  lineId: string;
  itemId: string;
  itemName: string;
  itemAltName: string;
  itemImage: string | null;
  itemType: string | null;
  basePrice: number;
  modifiers: Modifier[];
  qty: number;
  customization: Customization[];
  tax: TaxEntry[];
  digiMenuMedia: DigiMenuMedia[];
  _item: MenuItem;
  unavailable?: boolean;
  comment?: string;
}

export type OrderType = 'Pickup' | 'Delivery' | 'DineIn';

export interface CartState {
  cartLines: CartLine[];
  orderType: OrderType;
}
