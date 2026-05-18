import React, { useState, useEffect } from 'react';
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
  withOrderBar = false,
}: CategoryFilterProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (pillsRef && pillsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = pillsRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const el = pillsRef?.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      // Re-check after a short delay to account for rendering
      const timer = setTimeout(checkScroll, 100);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [pillsRef, sectionCats, loading]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (pillsRef && pillsRef.current) {
      const container = pillsRef.current;
      const scrollAmount = container.clientWidth * 0.6;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return <CategoryFilterShimmer filterRef={filterRef} />;

  return (
    <div
      className={`mn-filter-outer${withOrderBar ? ' mn-filter-outer--with-ob' : ''}`}
      ref={filterRef as React.LegacyRef<HTMLDivElement>}
    >
      <div className="mn-filter-inner">
        <div className="mn-maroon-bar">
          {showLeftArrow && (
            <div className="mn-scroll-arrow left" onClick={() => handleScroll('left')}>
              <i className="fa-solid fa-chevron-left" />
            </div>
          )}
          
          <div className="mn-pills-container">
            <div className="mn-pills" ref={pillsRef as React.LegacyRef<HTMLDivElement>}>

              {hasExclusive && (
                <button
                  data-id="exclusive"
                  className={`mn-pill${activeId === 'exclusive' ? ' active' : ''}`}
                  onClick={() => onSelect('exclusive')}
                >
                  <span className="mn-pill-content">
                    Today's Exclusive
                    <span className="mn-pill-count">{getCategoryCount('exclusive')}</span>
                  </span>
                  <span className="mn-pill-underline"></span>
                </button>
              )}

              {sectionCats.map((cat) => (
                <button
                  key={cat.id}
                  data-id={cat.id}
                  className={`mn-pill${activeId === cat.id ? ' active' : ''}`}
                  onClick={() => onSelect(cat.id)}
                >
                  <span className="mn-pill-content">
                    {cat.name}
                    <span className="mn-pill-count">{getCategoryCount(cat.id)}</span>
                  </span>
                  <span className="mn-pill-underline"></span>
                </button>
              ))}
            </div>
          </div>

          {showRightArrow && (
            <div className="mn-scroll-arrow right" onClick={() => handleScroll('right')}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryFilter;

