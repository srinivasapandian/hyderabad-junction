/**
 * menuTransformer.ts
 * Filters and transforms raw menu API response into UI-ready data.
 */

import type { MenuItem, Category, GroupedCategory, SpecialGroup, ItemUnavailability, TransformedMenu } from '../types';

// ─── Filter Rules ─────────────────────────────────────────────────────────────
const shouldRemoveItem = (item: MenuItem): boolean => {
  const { categoryOff, categoryId, subCategoryId, category } = item;

  // Rule 1: categoryOff flag is true
  if (categoryOff === true) return true;

  // Rule 2: both categoryId and subCategoryId are null
  if (categoryId == null && subCategoryId == null) return true;

  // Rule 3: (categoryId is null OR category is null) AND subCategoryId is non-null
  if ((categoryId == null || category == null) && subCategoryId != null) return true;

  return false;
};

// ─── Grouping Logic ───────────────────────────────────────────────────────────
// categoryId = 'x', subCategoryId = null  → direct category item
// categoryId = 'x', subCategoryId = 'x'  → sub-category item
const groupItems = (filteredItems: MenuItem[]): Record<string, GroupedCategory> => {
  const grouped: Record<string, GroupedCategory> = {};

  filteredItems.forEach((item) => {
    const { categoryId, subCategoryId, subCategoryName, subCategory, category } = item;

    if (!grouped[categoryId as string]) {
      grouped[categoryId as string] = { direct: [], subCategories: {} };
    }

    if (subCategoryId != null) {
      // Item under sub-category — store name from first occurrence
      if (!grouped[categoryId as string].subCategories[subCategoryId]) {
        grouped[categoryId as string].subCategories[subCategoryId] = {
          name: subCategoryName || subCategory || '',
          items: [],
        };
      }
      grouped[categoryId as string].subCategories[subCategoryId].items.push(item);
    } else if (!category && subCategory) {
      // subCategoryId is null but subCategory name exists and category is null
      // (API inconsistency) — synthesize a sub-category keyed by the name
      const syntheticId = `__sub__${subCategory}`;
      if (!grouped[categoryId as string].subCategories[syntheticId]) {
        grouped[categoryId as string].subCategories[syntheticId] = {
          name: subCategory,
          items: [],
        };
      }
      grouped[categoryId as string].subCategories[syntheticId].items.push(item);
    } else {
      // Direct item under category
      grouped[categoryId as string].direct.push(item);
    }
  });

  return grouped;
};

// ─── Item Unavailability ───────────────────────────────────────────────────────
// Format ISO date-time → 12-hour string (e.g. "11:30 AM" or "Tomorrow, 11:30 AM")
export const get12HoursTime = (isoString: string | null, nextAvailableDay = ''): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return nextAvailableDay ? `${nextAvailableDay}, ${time}` : time;
};

// Derives all unavailability flags for a single item
// isTemporarilyUnavailable : year > 3000 → unavailable with no resume time
// isOutOfStock             : stockQuantity is non-null and < 1, or isCategoryOff is true
// isUnAvailableUntil       : year < 3000 → returns formatted resume time string
export const getItemUnavailability = (item: MenuItem): ItemUnavailability => {
  const { stockQuantity, itemUnAvailableUntil, nextAvailableDay, isCategoryOff } = item;

  const isTemporarilyUnavailable =
    new Date(itemUnAvailableUntil as string).getFullYear() > 3000;

  const isOutOfStock =
    (stockQuantity !== null && Number(stockQuantity) < 1) || isCategoryOff === true;

  const isUnAvailableUntil =
    new Date(itemUnAvailableUntil as string).getFullYear() < 3000 &&
    get12HoursTime(
      itemUnAvailableUntil,
      nextAvailableDay != null ? nextAvailableDay : ''
    );

  return { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil };
};

// ─── Today's Exclusive Filter ─────────────────────────────────────────────────
// Items shown in the exclusive slider (also present in their category grouping)
const getExclusiveItems = (items: MenuItem[]): MenuItem[] =>
  items.filter(
    (item) =>
      item.isExclusiveCategoryItem &&
      item.enable &&
      item.display &&
      !((item.stockQuantity !== null && Number(item.stockQuantity) < 1) ||
        item.isCategoryOff === true)
  );

// ─── Special Menu Grouping ────────────────────────────────────────────────────
// Groups items with isSpecial === true by their specialName.
// Returns: [{ title, displayType, desc, content: [{ image, dishName, menuData }] }]
const groupSpecialItems = (items: MenuItem[]): SpecialGroup[] =>
  items.reduce<SpecialGroup[]>((acc, item) => {
    if (!item?.isSpecial) return acc;
    const existing = acc.find((g) => g.title === item.specialName);
    if (existing) {
      if (!existing.displayType && item.digiMenuMedia?.[0]?.tag) {
        existing.displayType = item.digiMenuMedia[0].tag as string;
      }
      existing.content.push({
        image: item.digiMenuMedia || [],
        dishName: item.itemName,
        menuData: item,
      });
    } else {
      acc.push({
        title: item.specialName as string,
        displayType: (item.digiMenuMedia?.[0]?.tag as string) || null,
        desc: (item.categoryDescription as string) || '',
        content: [{
          image: item.digiMenuMedia || [],
          dishName: item.itemName,
          menuData: item,
        }],
      });
    }
    return acc;
  }, []);

// ─── Main Transformer ─────────────────────────────────────────────────────────
export const transformMenuResponse = (rawResponse: { menu?: MenuItem[]; categoryList?: Record<string, unknown>[]; availableCategory?: string[] }): TransformedMenu => {
  const { menu = [], categoryList, availableCategory } = rawResponse;

  // Step 1: Filter
  const filteredItems = menu.filter((item) => !shouldRemoveItem(item));

  console.log(
    `[menuTransformer] Total: ${menu.length} | After filter: ${filteredItems.length} | Removed: ${menu.length - filteredItems.length}`
  );

  // Step 2: Group
  const grouped = groupItems(filteredItems);

  // Step 3: Normalize categories for UI
  // categoryList = array of objects [{id, categoryName, categoryOff}] (old format)
  // availableCategory = array of strings ['Category Name', ...] (new format)
  let categories: Category[];
  if (categoryList && categoryList.length) {
    categories = categoryList.map((cat) => ({
      id: cat.id as string,
      name: (cat.categoryName as string) || (cat.name as string) || '',
      categoryOff: (cat.categoryOff as boolean) || false,
    }));
  } else {
    // Build categories from menu items, filtered by availableCategory names
    const availableSet = new Set(availableCategory || []);
    const seen = new Map<string, Category>();
    filteredItems.forEach((item) => {
      if (!item.categoryId || seen.has(item.categoryId)) return;
      // Some menu payloads omit category/categoryName and only provide subCategory.
      // Fall back so category buttons can still be built and rendered.
      const name =
        item.categoryName ||
        item.category ||
        item.subCategoryName ||
        item.subCategory ||
        '';
      if (availableSet.size === 0 || availableSet.has(name)) {
        seen.set(item.categoryId, {
          id: item.categoryId,
          name,
          categoryOff: item.categoryOff || false,
        });
      }
    });
    // Preserve the order from availableCategory
    if (availableSet.size > 0) {
      const catById = new Map([...seen.values()].map((c) => [c.name, c]));
      categories = [...availableSet]
        .map((name) => catById.get(name))
        .filter((c): c is Category => c !== undefined);
    } else {
      categories = [...seen.values()];
    }
  }

  // Step 4: Today's exclusive items
  const exclusiveItems = getExclusiveItems(filteredItems);

  // Step 5: Special menu groups (isSpecial items grouped by specialName)
  const specialGroups = groupSpecialItems(filteredItems);
  console.log('[menuTransformer] specialGroups:', specialGroups);

  // Step 6: Return UI-ready shape
  return {
    categories,            // → category filter buttons
    items: filteredItems,  // → flat list
    grouped,               // → grouped[categoryId].direct[] | .subCategories[subId].{name, items[]}
    exclusiveItems,        // → today's exclusive slider
    specialGroups,         // → [{ title, displayType, desc, content[] }]
  };
};
