import '../shimmer.css';
import './MenuItemCardShimmer.css';

interface MenuItemCardShimmerProps {
  variant?: 'grid' | 'list';
}

function MenuItemCardShimmer({ variant = 'grid' }: MenuItemCardShimmerProps): React.JSX.Element {
  const isList = variant === 'list';
  return (
    <div className={`shim-card${isList ? ' shim-card--list' : ''}`}>
      <div className="shim shim-card-img" />
      <div className="shim-card-body">
        <div className="shim-card-name-row">
          <div className="shim shim-card-name" />
          <div className="shim shim-card-price" />
        </div>
        <div className="shim shim-card-desc" />
        <div className="shim shim-card-desc shim-card-desc--short" />
      </div>
    </div>
  );
}

export default MenuItemCardShimmer;
