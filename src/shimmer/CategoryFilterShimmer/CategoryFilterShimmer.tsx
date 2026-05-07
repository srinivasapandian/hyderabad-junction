import React from 'react';
import '../shimmer.css';
import './CategoryFilterShimmer.css';

interface CategoryFilterShimmerProps {
  filterRef: React.RefObject<HTMLDivElement | null>;
}

const PILL_WIDTHS: number[] = [120, 88, 150, 78, 115, 135, 68, 100];

function CategoryFilterShimmer({ filterRef }: CategoryFilterShimmerProps): React.JSX.Element {
  return (
    <div className="mn-filter-outer" ref={filterRef as React.LegacyRef<HTMLDivElement>}>
      <div className="mn-filter-inner">
        <div className="mn-pills">
          {PILL_WIDTHS.map((w, i) => (
            <div
              key={i}
              className="shim-pill"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryFilterShimmer;
