import '../shimmer.css';
import './MenuItemCardShimmer.css';

interface MenuItemCardShimmerProps {
  variant?: 'grid' | 'list';
}

function MenuItemCardShimmer({ variant: _ }: MenuItemCardShimmerProps): React.JSX.Element {
  return (
    <div className="shim-arch-card">
      <div className="shim shim-arch-img" />
      <div className="shim-arch-body">
        <div className="shim-arch-name-row">
          <div className="shim shim-arch-name" />
          <div className="shim shim-arch-price" />
        </div>
        <div className="shim shim-arch-btn" />
      </div>
    </div>
  );
}

export default MenuItemCardShimmer;
