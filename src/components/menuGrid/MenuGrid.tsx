import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import CategoryTitle from '../categoryTitle/CategoryTitle';
import MenuItemCard from '../menuItemCard/MenuItemCard';
import TodaysExclusive from '../todaysExclusive/TodaysExclusive';
import MenuItemCardShimmer from '../../shimmer/MenuItemCardShimmer/MenuItemCardShimmer';
import { toSlug } from '../../utils/slugify';
import { getCustomerAppViewType } from '../../utils/branchConfig';
import '../../shimmer/shimmer.css';
import './MenuGrid.css';
import type { Category, GroupedCategory, MenuItem, RootState } from '../../types';

interface MenuGridProps {
  loading: boolean;
  error: string | null;
  sectionCats: Category[];
  grouped: Record<string, GroupedCategory>;
  hasExclusive: boolean;
  exclusiveItems: MenuItem[];
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  emptyMessage?: string;
}

const BLOB_STEP_VH = 70;

/* Pattern repeats every 10 blobs */
const BLOB_PATTERN = [
  'left', 'right', 'center',
  'left', 'right',
  'left', 'right', 'center',
  'left', 'right',
] as const;

function getBlobStyle(index: number): React.CSSProperties {
  const top = `${index * BLOB_STEP_VH}vh`;
  const pos = BLOB_PATTERN[index % BLOB_PATTERN.length];
  if (pos === 'center') return { top, left: '50%', transform: 'translateX(-50%)' };
  if (pos === 'right') return { top, right: '-150px' };
  return { top, left: '-120px' };
}

function MenuGrid({
  loading,
  error,
  sectionCats,
  grouped,
  hasExclusive,
  exclusiveItems,
  sectionRefs,
  emptyMessage,
}: MenuGridProps) {
  const mainRef = useRef<HTMLElement>(null);
  const [blobCount, setBlobCount] = useState(0);
  const viewType = useSelector((s: RootState) => getCustomerAppViewType(s.slug.data));
  const gridClass = viewType === 'LIST' ? 'mn-card-grid mn-card-grid--list' : 'mn-card-grid';

  const recalcBlobs = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const stepPx = window.innerHeight * (BLOB_STEP_VH / 100);
    setBlobCount(Math.ceil(el.offsetHeight / stepPx) + 1);
  }, []);

  useEffect(() => {
    recalcBlobs();
    const ro = new ResizeObserver(recalcBlobs);
    if (mainRef.current) ro.observe(mainRef.current);
    return () => ro.disconnect();
  }, [recalcBlobs]);

  const showEmptyState = !loading && !error && !hasExclusive && sectionCats.length === 0;

  return (
    <main className="mn-main" ref={mainRef}>
      {/* Decorative blurred blobs — count driven by actual content height */}
      {Array.from({ length: blobCount }, (_, i) => (
        <span key={i} className="mn-blob" aria-hidden="true" style={getBlobStyle(i)} />
      ))}

      <div className="mn-container">

        {/* Today's Exclusive Slider */}
        {!loading && !error && hasExclusive && (
          <div
            data-cat-id="exclusive"
            ref={(el) => { sectionRefs.current['exclusive'] = el; }}
          >
            <TodaysExclusive items={exclusiveItems} />
          </div>
        )}

        {/* Loading — shimmer skeleton (2 partitions: Today's Exclusive + Menu Listing) */}
        {loading && (
          <>
            {/* Today's Exclusive shimmer — identical UI for GRID/LIST, all screen sizes */}
            <div className="mn-group">
              <div className="mn-sub-section">
                <div className="mn-group-header">
                  <div className="shim shim-section-title" />
                  <div className="mn-group-line" />
                </div>
                <div className="te-slider">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="te-slide shim shim-te-slide" />
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Listing shimmer — variant matches the view type */}
            <div className="mn-group">
              <div className="mn-sub-section">
                <div className="mn-group-header">
                  <div className="shim shim-section-title" />
                  <div className="mn-group-line" />
                </div>
                <div className={gridClass}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <MenuItemCardShimmer key={i} variant={viewType === 'LIST' ? 'list' : 'grid'} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mn-state mn-state--error">
            <p>Failed to load menu. Please try again.</p>
          </div>
        )}

        {/* Empty */}
        {showEmptyState && (
          <div className="mn-state">
            <p>{emptyMessage || 'No items available.'}</p>
          </div>
        )}

        {/* Menu sections */}
        {!loading && !error && sectionCats.map((cat) => {
          const group = grouped[cat.id];
          if (!group) return null;

          const categorySlug = toSlug(cat.name);
          const hasSubCats = Object.keys(group.subCategories).length > 0;
          const hasDirect = group.direct.length > 0;

          return (
            <section
              key={cat.id}
              data-cat-id={cat.id}
              className="mn-group"
              ref={(el) => { sectionRefs.current[cat.id] = el; }}
            >
              {hasSubCats && Object.entries(group.subCategories).map(([subId, subData]) => (
                <div key={subId} className="mn-sub-section">
                  <div className="mn-group-header">
                    <div className="mn-header-left">
                      <CategoryTitle className="mn-header-banner">{subData.name}</CategoryTitle>
                    </div>
                    <div className="mn-header-right">
                      <span className="mn-item-count">{String(subData.items.length).padStart(2, '0')} ITEMS</span>
                      <div className="mn-group-line" />
                    </div>
                  </div>
                  <div className={gridClass}>
                    {subData.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} categorySlug={categorySlug} />
                    ))}
                  </div>
                </div>
              ))}

              {hasDirect && (
                <div className="mn-sub-section">
                  {!hasSubCats && (
                    <div className="mn-group-header">
                      <div className="mn-header-left">
                        <CategoryTitle className="mn-header-banner">{cat.name}</CategoryTitle>
                      </div>
                      <div className="mn-header-right">
                        <span className="mn-item-count">{String(group.direct.length).padStart(2, '0')} ITEMS</span>
                        <div className="mn-group-line" />
                      </div>
                    </div>
                  )}
                  <div className={gridClass}>
                    {group.direct.map((item) => (
                      <MenuItemCard key={item.id} item={item} categorySlug={categorySlug} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}

      </div>
    </main>
  );
}

export default MenuGrid;
