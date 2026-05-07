export interface WorkingHour {
  locationId?: string;
  weekday: string;
  openingTime: string;
  closingTime: string;
  isEnabled: string | number;
  dayValue?: number;
  onlineCutoff?: string | null;
  pickupCutoff?: string | null;
}

export interface SlugOrderType {
  id: string;
  typeName?: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface Branch {
  locationSlug?: string;
  latitude?: number;
  longitude?: number;
  serviceDisable?: {
    isReservation?: number | string | boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type CustomerAppViewType = 'LIST' | 'GRID';

export interface UiFeatureFlags {
  customerAppViewType?: CustomerAppViewType | string;
  [key: string]: unknown;
}

export interface NextSession {
  nextSessionStartTime: string; // "HH:MM:SS"
  nextSessionDay: string;       // "TODAY" | "TOMORROW" | etc.
}

export interface SlugData {
  id: string;
  name: string;
  slug: string;
  activeSessionEndTime?: string | null;
  isLastActiveSession?: boolean;
  nextSession?: NextSession | null;
  timeZoneCd?: string;
  timeZone?: string;              // Display label e.g. "Eastern Time (ET)"
  defaultPickUpETA?: string | number;   // Pickup prep time in minutes
  defaultDeliveryETA?: string | number; // Delivery prep time in minutes
  country?: string;
  countryCd?: string;
  countryCode?: string;
  currency?: string;
  phone?: string;
  mobileNo?: string;
  email?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCd?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  restaurantName?: string;
  orderTypes?: SlugOrderType[];
  branch?: Branch[];
  workingHours?: WorkingHour[];
  onlineWorkingHours?: WorkingHour[];
  uiFeatureFlags?: UiFeatureFlags;
  locationDeliveryProviders?: {
    deliveryProviderId?: string;
    [key: string]: unknown;
  };
  body?: {
    orderTypes?: SlugOrderType[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SlugState {
  loading: boolean;
  data: SlugData | null;
  error: string | null;
}
