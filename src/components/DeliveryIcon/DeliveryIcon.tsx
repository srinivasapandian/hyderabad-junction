import deliverySvg from '../../assets/svg/delivery.svg';

interface DeliveryIconProps {
  /** Controls the icon height; width is auto-computed from the SVG's 100×74 aspect ratio */
  size?: number | string;
}

export default function DeliveryIcon({ size = '1em' }: DeliveryIconProps): React.JSX.Element {
  // delivery.svg viewBox is 100×74 → aspect ratio ≈ 1.351
  const height = size;
  const width = typeof size === 'number'
    ? size * 1.351
    : `calc(${size} * 1.351)`;

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width,
        height,
        flexShrink: 0,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${deliverySvg})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskImage: `url(${deliverySvg})`,
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        maskPosition: 'center',
      }}
    />
  );
}
