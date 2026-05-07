/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { RootState } from '../../../types';
import MenuItemCard from '../../../components/menuItemCard/MenuItemCard';
import { fetchFavouritesRequest, clearFavouritesAction } from '../../../redux/favourites/favouritesActions';
import { getMenuRequest } from '../../../redux/menu/menuActions';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import PageBg from '../../../components/pageBg/PageBg';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import './Favourites.css';

function parsePrice(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function resolvePrice(favouriteItem: any, menuItem: any): number {
  const candidates = [
    favouriteItem?.price,
    favouriteItem?.itemPrice,
    favouriteItem?.itemRate,
    favouriteItem?.rate,
    favouriteItem?.sellingPrice,
    menuItem?.price,
    menuItem?.itemPrice,
    menuItem?.itemRate,
    menuItem?.rate,
    menuItem?.sellingPrice,
  ];

  for (const candidate of candidates) {
    const parsed = parsePrice(candidate);
    if (parsed != null) return parsed;
  }
  return 0;
}

export default function FavouritesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ids   = useSelector((s: RootState) => s.favourites.ids);
  const items = useSelector((s: RootState) => s.favourites.items);
  const { isLoggedIn } = useSelector((s: RootState) => s.auth);
  const rawMenuData = useSelector((s: RootState) => s.menu.data);
  const menuOrderType = useSelector((s: RootState) => s.menu.orderType);
  const cartOrderType = useSelector((s: RootState) => s.cart.orderType);

  // Fetch fresh favourites from API on every mount
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchFavouritesRequest());
    }
  }, [isLoggedIn, dispatch]);

  // Signed-out users should never retain favourites in UI/store.
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(clearFavouritesAction());
    }
  }, [isLoggedIn, dispatch]);

  // Ensure menu data is available in Redux so we can hydrate favourite item details.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (rawMenuData) return;
    const preferredOrderType = cartOrderType || menuOrderType || 'Pickup';
    dispatch(getMenuRequest(preferredOrderType));
  }, [isLoggedIn, rawMenuData, cartOrderType, menuOrderType, dispatch]);

  const menuItemsById = useMemo<Record<string, any>>(() => {
    const menuDataAny = rawMenuData as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const source =
      Array.isArray(rawMenuData?.menu) ? rawMenuData.menu :
      Array.isArray(menuDataAny?.body?.menu) ? menuDataAny.body.menu :
      Array.isArray(rawMenuData) ? rawMenuData :
      [];

    const byId: Record<string, any> = {};
    source.forEach((item: any) => {
      const id = String(item?.itemId ?? item?.id ?? '').trim();
      if (!id) return;
      byId[id] = item;
    });
    return byId;
  }, [rawMenuData]);

  const favouriteList = useMemo(() => {
    if (!isLoggedIn) return [];
    return ids.map((id) => {
      const itemId = String(id ?? '').trim();
      if (!itemId) return null;

      const favouriteItem = items[itemId] || items[id] || null;
      const menuItem = menuItemsById[itemId] || null;
      if (!favouriteItem && !menuItem) return null;

      const merged = {
        ...(menuItem || {}),
        ...(favouriteItem || {}),
      };

      return {
        ...merged,
        id: merged.id ?? merged.itemId ?? itemId,
        itemId: merged.itemId ?? merged.id ?? itemId,
        itemName: merged.itemName || menuItem?.itemName || favouriteItem?.itemName || 'Item',
        description: merged.description || menuItem?.description || favouriteItem?.description || '',
        itemImage: merged.itemImage || menuItem?.itemImage || favouriteItem?.itemImage || null,
        itemType: merged.itemType || menuItem?.itemType || favouriteItem?.itemType || '',
        digiMenuMedia: merged.digiMenuMedia || menuItem?.digiMenuMedia || favouriteItem?.digiMenuMedia || [],
        available: merged.available ?? menuItem?.available ?? favouriteItem?.available,
        itemOff: merged.itemOff ?? menuItem?.itemOff ?? favouriteItem?.itemOff,
        price: resolvePrice(favouriteItem, menuItem),
      };
    }).filter(Boolean);
  }, [isLoggedIn, ids, items, menuItemsById]);

  return (
    <PageBg className="fav-page">

      <div className="fav-header">
        <button className="fav-back" onClick={() => navigate(-1)} type="button" aria-label="Go back">
          <span className="back-icon" aria-hidden="true" />
        </button>
        <h1 className="fav-title">My Favourites</h1>
        {favouriteList.length > 0 && (
          <span className="fav-count">{favouriteList.length} saved</span>
        )}
      </div>

      <main className="fav-inner">

        {/* ── Empty state ── */}
        {favouriteList.length === 0 && (
          <div className="fav-empty">
            <i className="fa-regular fa-heart" />
            <p>No favourites yet.</p>
            <span className="fav-empty__sub">
              Tap the heart on any item while browsing to save it here.
            </span>
            <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="fav-empty__cta">
              Browse Menu
            </Link>
          </div>
        )}

        {/* ── Grid ── */}
        {favouriteList.length > 0 && (
          <div className="fav-grid">
            <AnimatePresence>
              {favouriteList.map((item, index) => {
                const itemId = String(item.id || item.itemId || index);
                return (
                  <motion.div
                    key={itemId}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.28, delay: index * 0.04 }}
                  >
                    <MenuItemCard item={item} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <CtaStrip
        overline="Ready to Order?"
        heading="Order Your Favorites Online"
        btnLabel="Order Online"
        btnHref={`/order-online/${LOCATION_SLUG}/pickup`}
      />
    </PageBg>
  );
}
