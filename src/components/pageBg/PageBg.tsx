import './PageBg.css';

interface PageBgProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps page content with the shared tiled-pattern background
 * and three ambient blob lights. Pass your page-specific class
 * via the `className` prop — it is merged with `pg-bg`.
 */
export default function PageBg({ className = '', children }: PageBgProps) {
  return (
    <div className={`pg-bg${className ? ` ${className}` : ''}`}>
      <div className="pg-blob" style={{ top: '-80px',  left:  '-120px' }} />
      <div className="pg-blob" style={{ top:  '45vh',  right: '-150px' }} />
      <div className="pg-blob" style={{ top:  '90vh',  left:  '-120px' }} />
      {children}
    </div>
  );
}
