import designImg from '../../assets/design.png';
import './PageBg.css';

interface PageBgProps {
  className?: string;
  children: React.ReactNode;
}

export default function PageBg({ className = '', children }: PageBgProps) {
  return (
    <div className={`pg-bg${className ? ` ${className}` : ''}`}>
      {children}
      <img src={designImg} className="pg-deco pg-deco--left"  aria-hidden="true" alt="" />
      <img src={designImg} className="pg-deco pg-deco--right" aria-hidden="true" alt="" />
    </div>
  );
}
