import './OrderCardShimmer.css';

const SHIMMER_COUNT = 9;

interface OrderCardShimmerProps {
  count?: number;
}

function OrderCardShimmer(): React.JSX.Element {
  return (
    <div className="shim-order-card">
      <div className="shim-order-header">
        <div className="shim-order shim-order-ref" />
        <div className="shim-order shim-order-badge" />
      </div>
      <div className="shim-order-meta">
        <div className="shim-order shim-order-meta-item" />
        <div className="shim-order shim-order-meta-item" />
        <div className="shim-order shim-order-meta-item" />
      </div>
      <div className="shim-order-chips">
        <div className="shim-order shim-order-chip" />
        <div className="shim-order shim-order-chip" />
      </div>
      <div className="shim-order-footer">
        <div className="shim-order shim-order-total" />
        <div className="shim-order shim-order-cta" />
      </div>
    </div>
  );
}

export default function OrdersShimmerGrid({ count = SHIMMER_COUNT }: OrderCardShimmerProps): React.JSX.Element {
  return (
    <div className="orders-list">
      {Array.from({ length: count }, (_, i) => (
        <OrderCardShimmer key={i} />
      ))}
    </div>
  );
}
