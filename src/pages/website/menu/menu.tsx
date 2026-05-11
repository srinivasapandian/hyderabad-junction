import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './menu.css';
import OrderingBar from '../../../components/orderingBar/OrderingBar';
import CategoryFilter from '../../../components/categoryFilter/CategoryFilter';
import MenuGrid from '../../../components/menuGrid/MenuGrid';
import { useMenuData } from '../../../hooks/useMenuData';
import { setOrderTypeAction } from '../../../redux/cart/cartReducer';
import { toSlug } from '../../../utils/slugify';
import ClosedBar from '../../../components/ClosedBar/ClosedBar';
import ClosingSoonBar from '../../../components/ClosingSoonBar/ClosingSoonBar';

import PageBg from '../../../components/pageBg/PageBg';
import PageBanner from '../../../components/pageBanner/PageBanner';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';

function Menu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categorySlug: urlCategorySlug } = useParams<{ categorySlug: string }>();

  const [availableNow, setAvailableNow] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Menu page is Pickup-only — ensure cart orderType is synced
  useEffect(() => {
    dispatch(setOrderTypeAction('Pickup'));
  }, [dispatch]);

  const {
    loading, error,
    sectionCats, grouped,
    exclusiveItems, hasExclusive, getCategoryCount,
    activeId,
    filterRef, pillsRef, sectionRefs,
    scrollToSection,
  } = useMenuData('Pickup', { availableNow });

  // ── Scroll to section from URL param on initial load ─────────────────
  useEffect(() => {
    if (!urlCategorySlug || loading || !sectionCats.length) return;

    if (urlCategorySlug === 'todays-exclusive' && hasExclusive) {
      scrollToSection('exclusive');
      return;
    }
    const matched = sectionCats.find((cat) => toSlug(cat.name) === urlCategorySlug);
    if (matched) scrollToSection(matched.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategorySlug, loading]);

  // ── Category pill click → scroll + update URL ─────────────────────────
  const handleCategorySelect = useCallback((catId: string) => {
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(`/indian-restaurant-menu/all`, { replace: true });
      return;
    }
    scrollToSection(catId);
    const slug =
      catId === 'exclusive'
        ? 'todays-exclusive'
        : toSlug(sectionCats.find((c) => c.id === catId)?.name || catId);
    navigate(`/indian-restaurant-menu/${slug}`, { replace: true });
  }, [scrollToSection, sectionCats, navigate]);

  return (
    <PageBg className="mn-page">
      <PageBanner title="Our Menu" backgroundImage={BANNER_IMAGES.menu} />
      <div className="mn-bg">
        <div className="mn-bg-scrim" />
        <OrderingBar
          orderType="Pickup"
          onOrderTypeChange={() => {}}
          availableNow={availableNow}
          onAvailableNowChange={setAvailableNow}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hideOrderType
          sectionCats={sectionCats}
          hasExclusive={hasExclusive}
          getCategoryCount={getCategoryCount}
          onCategorySelect={handleCategorySelect}
          activeId={activeId}
        />
        <CategoryFilter
          loading={loading}
          activeId={activeId}
          sectionCats={sectionCats}
          hasExclusive={hasExclusive}
          getCategoryCount={getCategoryCount}
          onSelect={handleCategorySelect}
          filterRef={filterRef}
          pillsRef={pillsRef}
          withOrderBar
        />
        <MenuGrid
          loading={loading}
          error={error}
          sectionCats={sectionCats}
          grouped={grouped}
          hasExclusive={hasExclusive}
          exclusiveItems={exclusiveItems}
          sectionRefs={sectionRefs}
        />
      </div>

      {/* Menu page is Pickup-only — always use Pickup ETA for closing-soon window */}
      <ClosingSoonBar orderType="Pickup" />
      <ClosedBar />
    </PageBg>
  );
}

export default Menu;
