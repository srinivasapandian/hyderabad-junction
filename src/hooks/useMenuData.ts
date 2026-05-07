import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMenuRequest } from '../redux/menu/menuActions';
import { getItemUnavailability, transformMenuResponse } from '../utils/menuTransformer';
import type { RootState, MenuItem, Category, GroupedCategory, SubCategoryGroup } from '../types';

interface UseMenuDataOptions {
  availableNow?: boolean;
  searchQuery?: string;
}

interface UseMenuDataReturn {
  loading: boolean;
  error: string | null;
  sectionCats: Category[];
  grouped: Record<string, GroupedCategory>;
  exclusiveItems: MenuItem[];
  hasExclusive: boolean;
  getCategoryCount: (catId: string) => number;
  activeId: string;
  filterRef: React.RefObject<HTMLDivElement | null>;
  pillsRef: React.RefObject<HTMLDivElement | null>;
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement>>;
  scrollToSection: (catId: string) => void;
}

/**
 * useMenuData — all data-fetching, transform, observer, and scroll logic
 * for both the /menu and /ordering pages.
 *
 * @param orderType  - 'Pickup' | 'Delivery' (default: 'Pickup')
 */
export function useMenuData(orderType: string = 'Pickup', options: UseMenuDataOptions = {}): UseMenuDataReturn {
  const { availableNow = false, searchQuery = '' } = options || {};
  const dispatch = useDispatch();
  const { data: rawMenuData, loading, error, orderType: cachedOrderType } = useSelector((state: RootState) => state.menu);

  // ── Transform raw API response → UI-ready shape ─────────────────────
  const menuData = useMemo(
    () => (rawMenuData ? transformMenuResponse(rawMenuData as Parameters<typeof transformMenuResponse>[0]) : null),
    [rawMenuData]
  );

  const categories     = menuData?.categories     || [];
  const grouped        = menuData?.grouped        || {};
  const exclusiveItems = menuData?.exclusiveItems || [];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const isAvailableNow = useCallback((item: MenuItem): boolean => {
    const { isTemporarilyUnavailable, isOutOfStock, isUnAvailableUntil } =
      getItemUnavailability(item);
    return (
      item.enable !== false &&
      item.display !== false &&
      item.available !== false &&
      item.itemOff !== true &&
      !isTemporarilyUnavailable &&
      !isOutOfStock &&
      !isUnAvailableUntil
    );
  }, []);

  const matchesSearch = useCallback((item: MenuItem): boolean => {
    if (!normalizedQuery) return true;
    return (item.itemName ?? '').toLowerCase().includes(normalizedQuery);
  }, [normalizedQuery]);

  const shouldIncludeItem = useCallback((item: MenuItem): boolean => {
    if (availableNow && !isAvailableNow(item)) return false;
    if (normalizedQuery && !matchesSearch(item)) return false;
    return true;
  }, [availableNow, isAvailableNow, matchesSearch, normalizedQuery]);

  const filteredGrouped = useMemo(() => {
    if (!menuData) return {};
    const next: Record<string, GroupedCategory> = {};
    Object.entries(grouped).forEach(([catId, group]) => {
      const direct = group.direct.filter(shouldIncludeItem);
      const subCategories: Record<string, SubCategoryGroup> = {};
      Object.entries(group.subCategories).forEach(([subId, subData]) => {
        const items = subData.items.filter(shouldIncludeItem);
        if (items.length) {
          subCategories[subId] = { ...subData, items };
        }
      });
      if (direct.length || Object.keys(subCategories).length) {
        next[catId] = { direct, subCategories };
      }
    });
    return next;
  }, [grouped, menuData, shouldIncludeItem]);

  const filteredExclusive = useMemo(
    () => (menuData ? exclusiveItems.filter(shouldIncludeItem) : []),
    [exclusiveItems, menuData, shouldIncludeItem]
  );

  const sectionCats = categories.filter(
    (cat) => !cat.categoryOff && filteredGrouped[cat.id]
  );

  const hasExclusive = filteredExclusive.length > 0;

  const getCategoryCount = useCallback((catId: string): number => {
    const group = filteredGrouped[catId];
    if (!group) return 0;
    const subCount = Object.values(group.subCategories).reduce(
      (sum, sub) => sum + sub.items.length, 0
    );
    return group.direct.length + subCount;
  }, [filteredGrouped]);

  // ── Section lookup maps ──────────────────────────────────────────────
  const { sectionToCat, catFirstSection } = useMemo(() => {
    const sectionToCat: Record<string, string>    = {};
    const catFirstSection: Record<string, string> = {};
    if (hasExclusive) {
      sectionToCat['exclusive']    = 'exclusive';
      catFirstSection['exclusive'] = 'exclusive';
    }
    sectionCats.forEach((cat) => {
      sectionToCat[cat.id]    = cat.id;
      catFirstSection[cat.id] = cat.id;
    });
    return { sectionToCat, catFirstSection };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCats.map((c) => c.id).join(','), hasExclusive]);

  // ── State ────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState('');

  // ── Refs ─────────────────────────────────────────────────────────────
  const filterRef         = useRef<HTMLDivElement | null>(null);
  const pillsRef          = useRef<HTMLDivElement | null>(null);
  const sectionRefs       = useRef<Record<string, HTMLElement>>({});
  const observerRef       = useRef<IntersectionObserver | null>(null);
  const intersectingRef   = useRef<Set<string>>(new Set());
  const programmaticRef   = useRef<boolean>(false);

  // ── Fetch menu on mount (skip if data already cached for same order type) ──
  useEffect(() => {
    if (rawMenuData && cachedOrderType === orderType) return;
    dispatch(getMenuRequest(orderType));
  }, [dispatch, orderType, rawMenuData, cachedOrderType]);

  // ── Set initial active pill once data loads ──────────────────────────
  useEffect(() => {
    const ids: string[] = [];
    if (hasExclusive) ids.push('exclusive');
    sectionCats.forEach((cat) => ids.push(cat.id));
    if (!ids.length) {
      if (activeId) setActiveId('');
      return;
    }
    if (!activeId || !ids.includes(activeId)) {
      setActiveId(ids[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExclusive, sectionCats.map((c) => c.id).join(',')]);

  // ── Dynamic header height ────────────────────────────────────────────
  const getHeaderHeight = useCallback((): number => {
    const navbar = document.querySelector('.header') as HTMLElement | null;
    return navbar ? navbar.offsetHeight : 98;
  }, []);

  // ── Auto-center active pill ──────────────────────────────────────────
  useEffect(() => {
    if (!activeId || !pillsRef.current) return;
    const pill = pillsRef.current.querySelector(`[data-id="${activeId}"]`);
    if (pill) pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  // ── IntersectionObserver: scroll → active pill ──────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    intersectingRef.current.clear();
    if (!sectionCats.length && !hasExclusive) return;

    // Ordered list of all section ids (top → bottom)
    const orderedIds: string[] = [];
    if (hasExclusive) orderedIds.push('exclusive');
    sectionCats.forEach((cat) => orderedIds.push(cat.id));

    const pickActive = () => {
      if (programmaticRef.current) return;
      // Always pick the topmost currently-intersecting section
      const first = orderedIds.find((id) => intersectingRef.current.has(id));
      if (first) {
        setActiveId(first);
        return;
      }
      // Fallback: if scrolled past all sections (short last section), pick last
      const lastEl = sectionRefs.current[orderedIds[orderedIds.length - 1]];
      if (lastEl) {
        const rect = lastEl.getBoundingClientRect();
        if (rect.bottom < window.innerHeight * 0.5) {
          setActiveId(orderedIds[orderedIds.length - 1]);
        }
      }
    };

    observerRef.current = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          const id = sectionToCat[(entry.target as HTMLElement).dataset.catId as string];
          if (!id) return;
          if (entry.isIntersecting) {
            intersectingRef.current.add(id);
          } else {
            intersectingRef.current.delete(id);
          }
        });
        pickActive();
      },
      { rootMargin: '-10% 0px -55% 0px', threshold: 0 }
    );

    const exclusiveEl = sectionRefs.current['exclusive'];
    if (exclusiveEl) observerRef.current!.observe(exclusiveEl);

    sectionCats.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCats.map((c) => c.id).join(','), hasExclusive]);

  // ── Click pill → scroll to section ──────────────────────────────────
  const scrollToSection = useCallback((catId: string) => {
    setActiveId(catId);
    const sectionId = catFirstSection[catId] || catId;
    const el = sectionRefs.current[sectionId];
    if (!el) return;
    const headerH  = getHeaderHeight();
    const obBar    = document.querySelector('.ob-wrap') as HTMLElement | null;
    const obH      = obBar ? obBar.offsetHeight : 0;
    const filterH  = (filterRef.current?.offsetHeight || 48) + headerH + obH + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - filterH;

    // Guard: suppress observer updates during programmatic scroll
    programmaticRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { programmaticRef.current = false; }, 800);
  }, [catFirstSection, getHeaderHeight]);

  return {
    loading,
    error,
    sectionCats:    loading ? [] : sectionCats,
    grouped:        loading ? {} : filteredGrouped,
    exclusiveItems: loading ? [] : filteredExclusive,
    hasExclusive:   loading ? false : hasExclusive,
    getCategoryCount,
    activeId,
    filterRef,
    pillsRef,
    sectionRefs,
    scrollToSection,
  };
}
