import '../shimmer.css';
import './MenuItemCardShimmer.css';

function MenuItemCardShimmer(): React.JSX.Element {
  return (
    <div className="shim-card">
      {/* Image placeholder */}
      <div className="shim shim-card-img" />

      {/* Content */}
      <div className="shim-card-body">
        {/* Name + price */}
        <div className="shim-card-name-row">
          <div className="shim shim-card-name" />
          <div className="shim shim-card-price" />
        </div>

        {/* Accent line */}
        <div className="shim shim-card-line" />

        {/* Description */}
        <div className="shim shim-card-desc" />
        <div className="shim shim-card-desc shim-card-desc--short" />

        {/* Action buttons */}
        <div className="shim-card-actions">
          <div className="shim shim-card-btn" />
          <div className="shim shim-card-btn" />
          <div className="shim shim-card-add" />
        </div>
      </div>
    </div>
  );
}

export default MenuItemCardShimmer;
