import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './ordering.css';
import OrderingBar from '../../../components/orderingBar/OrderingBar';
import CategoryFilter from '../../../components/categoryFilter/CategoryFilter';
import MenuGrid from '../../../components/menuGrid/MenuGrid';
import { useMenuData } from '../../../hooks/useMenuData';
import { setOrderTypeAction } from '../../../redux/cart/cartReducer';
import { validateCartItemsRequest } from '../../../redux/cart/cartActions';
import { toSlug } from '../../../utils/slugify';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import type { OrderType } from '../../../types';
import ClosedBar from '../../../components/ClosedBar/ClosedBar';
import ClosingSoonBar from '../../../components/ClosingSoonBar/ClosingSoonBar';
import PageBg from '../../../components/pageBg/PageBg';

const VALID_ORDER_TYPES: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery' };

function Ordering() {
  const dispatch = useDispatch();
  const { orderType: urlOrderType } = useParams<{ orderType: string }>();
  const navigate = useNavigate();

  const resolvedType = VALID_ORDER_TYPES[urlOrderType?.toLowerCase() ?? ''] || 'Pickup';
  const [orderType, setOrderType] = useState<OrderType>(resolvedType as OrderType);
  const [availableNow, setAvailableNow] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync local state + Redux cart orderType when URL param changes
  useEffect(() => {
    setOrderType(resolvedType as OrderType);
    dispatch(setOrderTypeAction(resolvedType as OrderType));
  }, [resolvedType, dispatch]);

  // Update URL + Redux when user toggles order type, then validate cart items
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    dispatch(setOrderTypeAction(type));
    dispatch(validateCartItemsRequest({ source: 'ordering' }));
    navigate(`/order-online/${LOCATION_SLUG}/${type.toLowerCase()}`, { replace: true });
  };

  const {
    loading, error,
    sectionCats, grouped,
    exclusiveItems, hasExclusive, getCategoryCount,
    activeId,
    filterRef, pillsRef, sectionRefs,
    scrollToSection,
  } = useMenuData(orderType, { availableNow });

  // ── Category pill click → scroll + silently update URL ───────────────
  // We use window.history.replaceState instead of navigate() to avoid
  // remounting the component (different route pattern would cause a remount
  // and kill the scroll before it completes).
  const handleCategorySelect = useCallback((catId: string) => {
    scrollToSection(catId);
    const slug =
      catId === 'exclusive'
        ? 'todays-exclusive'
        : toSlug(sectionCats.find((c) => c.id === catId)?.name || catId);
    window.history.replaceState(
      null,
      '',
      `/order-online/${LOCATION_SLUG}/${orderType.toLowerCase()}/${slug}`
    );
  }, [scrollToSection, sectionCats, orderType]);

  const hasFilters = availableNow || searchQuery.trim().length > 0;
  const emptyMessage = hasFilters
    ? 'No items match your search.'
    : 'No items available.';

  return (
    <PageBg className="mn-page">
      <div className="mn-bg mn-bg--no-hero">
        <div className="mn-bg-scrim" />
        <OrderingBar
          orderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
          availableNow={availableNow}
          onAvailableNowChange={setAvailableNow}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
          emptyMessage={emptyMessage}
        />
      </div>
      
      {/* ETA switches with orderType: Pickup → defaultPickUpETA, Delivery → defaultDeliveryETA */}
      <ClosingSoonBar orderType={orderType} />
      <ClosedBar />
    </PageBg>
  );
}

export default Ordering;
