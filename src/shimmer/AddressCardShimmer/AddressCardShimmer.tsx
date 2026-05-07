import './AddressCardShimmer.css';

const SHIMMER_COUNT = 6;

interface AddressCardShimmerProps {
  count?: number;
}

function AddressCardShimmer(): React.JSX.Element {
  return (
    <div className="shim-addr-card">
      <span className="shim-addr shim-addr--tag" />
      <div className="shim-addr-body">
        <span className="shim-addr shim-addr--line shim-addr--line-lg" />
        <span className="shim-addr shim-addr--line" />
      </div>
      <div className="shim-addr-actions">
        <span className="shim-addr shim-addr--btn" />
        <span className="shim-addr shim-addr--btn" />
      </div>
    </div>
  );
}

export default function AddressCardShimmerGrid({ count = SHIMMER_COUNT }: AddressCardShimmerProps): React.JSX.Element {
  return (
    <div className="shim-addr-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <AddressCardShimmer key={i} />
      ))}
    </div>
  );
}
