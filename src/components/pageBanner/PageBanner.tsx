import { Link } from 'react-router-dom';
import './pageBanner.css';

interface PageBannerProps {
  title: string;
  backgroundImage: string;
}

export default function PageBanner({ title, backgroundImage }: PageBannerProps) {
  return (
    <section
      className="page-banner"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      aria-label={`${title} banner`}
    >
      <div className="page-banner__scrim" />
      <nav className="page-banner__crumbs" aria-label="Breadcrumb">
        <Link to="/" className="page-banner__crumb">Home</Link>
        <span className="page-banner__slash" aria-hidden="true">/</span>
        <span className="page-banner__crumb page-banner__crumb--active">{title}</span>
      </nav>
    </section>
  );
}
