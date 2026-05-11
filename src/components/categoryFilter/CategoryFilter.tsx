import React from 'react';
import './CategoryFilter.css';
import CategoryFilterShimmer from '../../shimmer/CategoryFilterShimmer/CategoryFilterShimmer';
import type { Category } from '../../types';

interface CategoryFilterProps {
  loading: boolean;
  activeId: string;
  sectionCats: Category[];
  hasExclusive: boolean;
  getCategoryCount: (catId: string) => number;
  onSelect: (catId: string) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
  pillsRef: React.RefObject<HTMLDivElement | null>;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  withOrderBar?: boolean;
}

function CategoryFilter({
  loading,
  activeId,
  sectionCats,
  hasExclusive,
  getCategoryCount,
  onSelect,
  filterRef,
  pillsRef,
  searchQuery,
  onSearchChange,
  withOrderBar = false,
}: CategoryFilterProps) {
  if (loading) return <CategoryFilterShimmer filterRef={filterRef} />;
  return (
    <div
      className={`mn-filter-outer${withOrderBar ? ' mn-filter-outer--with-ob' : ''}`}
      ref={filterRef as React.LegacyRef<HTMLDivElement>}
    >
      <div className="mn-filter-inner">
        <div className="mn-maroon-bar">
          <div className="mn-pills-container">
            <div className="mn-pills" ref={pillsRef as React.LegacyRef<HTMLDivElement>}>
              {/* "All" Category */}
              <button
                data-id="all"
                className={`mn-pill ${activeId === '' || activeId === 'all' ? 'active' : ''}`}
                onClick={() => onSelect('all')}
              >
                All
                <span className="mn-pill-count">
                  {sectionCats.reduce((acc, cat) => acc + getCategoryCount(cat.id), 0)}
                </span>
                {activeId === 'all' && <div className="mn-pill-underline" />}
              </button>

              {hasExclusive && (
                <button
                  data-id="exclusive"
                  className={`mn-pill${activeId === 'exclusive' ? ' active' : ''}`}
                  onClick={() => onSelect('exclusive')}
                >
                  Today's Exclusive
                  <span className="mn-pill-count">{getCategoryCount('exclusive')}</span>
                  {activeId === 'exclusive' && <div className="mn-pill-underline" />}
                </button>
              )}

              {sectionCats.map((cat) => (
                <button
                  key={cat.id}
                  data-id={cat.id}
                  className={`mn-pill${activeId === cat.id ? ' active' : ''}`}
                  onClick={() => onSelect(cat.id)}
                >
                  {cat.name}
                  <span className="mn-pill-count">{getCategoryCount(cat.id)}</span>
                  {activeId === cat.id && <div className="mn-pill-underline" />}
                </button>
              ))}
            </div>
          </div>
          <div className="mn-scroll-arrow right">
            <i className="fa-solid fa-chevron-right" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryFilter;
