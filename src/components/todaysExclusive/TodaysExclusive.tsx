import ExclusiveItemCard from '../exclusiveItemCard/ExclusiveItemCard';
import CategoryTitle from '../categoryTitle/CategoryTitle';
import design2 from '../../assets/design2.png';
import './TodaysExclusive.css';
import type { MenuItem } from '../../types';

interface TodaysExclusiveProps {
  items: MenuItem[];
}

function TodaysExclusive({ items }: TodaysExclusiveProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="te-wrap">
      {/* ── Header ── */}
      <div className="te-header">
        <CategoryTitle>Today's Exclusive</CategoryTitle>
      </div>
      <img src={design2} alt="" aria-hidden="true" className="te-design" />

      {/* ── Horizontal slider ── */}
      <div className="te-slider">
        {items.map((item) => (
          <div key={item.id} className="te-slide">
            <ExclusiveItemCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodaysExclusive;
