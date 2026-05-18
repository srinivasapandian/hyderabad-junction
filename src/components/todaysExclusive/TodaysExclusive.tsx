import MenuItemCard from '../menuItemCard/MenuItemCard';
import CategoryTitle from '../categoryTitle/CategoryTitle';
import './TodaysExclusive.css';
import type { MenuItem } from '../../types';

interface TodaysExclusiveProps {
  items: MenuItem[];
}

function TodaysExclusive({ items }: TodaysExclusiveProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="te-wrap">
      <div className="mn-group-header">
        <div className="mn-header-left">
          <CategoryTitle className="mn-header-banner">Today's Exclusive</CategoryTitle>
        </div>
        <div className="mn-header-right">
          <span className="mn-item-count">{String(items.length).padStart(2, '0')} ITEMS</span>
          <div className="mn-group-line" />
        </div>
      </div>

      <div className="mn-card-grid">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} categorySlug="todays-exclusive" />
        ))}
      </div>
    </div>
  );
}

export default TodaysExclusive;
