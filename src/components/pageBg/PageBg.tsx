import designImg from '../../assets/design.png';
import './PageBg.css';

interface PageBgProps {
  className?: string;
  children: React.ReactNode;
}

export default function PageBg({ className = '', children }: PageBgProps) {
  return (
    <div className={`pg-bg${className ? ` ${className}` : ''}`}>
      <div className="pg-blob" style={{ top: '-80px',  left:  '-120px' }} />
      <div className="pg-blob" style={{ top:  '45vh',  right: '-150px' }} />
      <div className="pg-blob" style={{ top:  '90vh',  left:  '-120px' }} />

      <img src={designImg} className="pg-deco pg-deco--left"  aria-hidden="true" alt="" />
      <img src={designImg} className="pg-deco pg-deco--right" aria-hidden="true" alt="" />

      {children}
    </div>
  );
}
