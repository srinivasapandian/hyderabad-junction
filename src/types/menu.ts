export interface DigiMenuMedia {
  tag?: string;
  url?: string;
  [key: string]: unknown;
}

export interface TaxEntry {
  code?: string;
  name?: string;
  value?: number | string;
  percentage?: number | string;
  [key: string]: unknown;
}

export interface CustomizationFlat {
  typeId: string;
  type: string;
  typeName?: string;
  modifierOptionId: string;
  optionId?: string;
  optionName: string;
  price: number | string;
  typeAvailable?: number;
  optionAvailable?: number;
  minRequired?: number;
  maxRequired?: number;
  sortOrder?: number;
  optionSortOrder?: number;
}

export interface CustomizationOption {
  optionId: string;
  modifierOptionId?: string;
  optionName: string;
  price: number | string;
  optionAvailable: number;
  optionSortOrder?: number;
  isSpinnerEnabled?: boolean;
  quantity?: string;
  singleItemOptionQuantity?: number;
}

export interface CustomizationGrouped {
  typeId: string;
  type: string;
  typeName?: string;
  typeAvailable: number;
  minRequired: number;
  maxRequired: number;
  sortOrder?: number;
  isBase?: null;
  options: CustomizationOption[];
}

export type Customization = CustomizationFlat | CustomizationGrouped;

export interface MenuItem {
  id: string | number;
  itemId: string;
  itemName: string;
  itemAltName: string;
  price: string | number;
  description: string;
  itemImage: string | null;
  itemType: string | null;
  categoryId: string | null;
  category: string | null;
  categoryName?: string;
  subCategoryId: string | null;
  subCategory: string | null;
  subCategoryName?: string;
  available: boolean;
  enable: boolean;
  display: boolean;
  itemOff: boolean;
  categoryOff: boolean;
  isCategoryOff?: boolean;
  isExclusiveCategoryItem: boolean;
  isSpecial: boolean;
  specialName?: string;
  categoryDescription?: string;
  customization: Customization[];
  digiMenuMedia: DigiMenuMedia[];
  tax: TaxEntry[];
  stockQuantity: number | null;
  itemUnAvailableUntil: string | null;
  nextAvailableDay: string | null;
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
  categoryOff: boolean;
}

export interface SubCategoryGroup {
  name: string;
  items: MenuItem[];
}

export interface GroupedCategory {
  direct: MenuItem[];
  subCategories: Record<string, SubCategoryGroup>;
}

export interface SpecialGroupContent {
  image: DigiMenuMedia[];
  dishName: string;
  menuData: MenuItem;
}

export interface SpecialGroup {
  title: string;
  displayType: string | null;
  desc: string;
  content: SpecialGroupContent[];
}

export interface TransformedMenu {
  categories: Category[];
  items: MenuItem[];
  grouped: Record<string, GroupedCategory>;
  exclusiveItems: MenuItem[];
  specialGroups: SpecialGroup[];
}

export interface ItemUnavailability {
  isTemporarilyUnavailable: boolean;
  isOutOfStock: boolean;
  isUnAvailableUntil: string | false;
}
