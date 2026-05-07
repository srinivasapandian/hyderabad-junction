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

        {onSearchChange !== undefined && (
          <div className="mn-search-wrap">
            <i className="fas fa-search mn-search-icon" />
            <input
              type="text"
              className="mn-search-input"
              placeholder="Craving something delicious? Search here..."
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className="mn-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        )}

        <div className="mn-pills" ref={pillsRef as React.LegacyRef<HTMLDivElement>}>
          {hasExclusive && (
            <button
              data-id="exclusive"
              className={`mn-pill${activeId === 'exclusive' ? ' active' : ''}`}
              onClick={() => onSelect('exclusive')}
            >
              Today's Exclusive
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
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

export default CategoryFilter;
