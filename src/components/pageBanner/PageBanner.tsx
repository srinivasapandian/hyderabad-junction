import { Link } from 'react-router-dom';
import './pageBanner.css';

interface PageBannerProps {
  title: string;
  backgroundImage: string;
}

export default function PageBanner({ title, backgroundImage }: PageBannerProps) {
  return (
    <section className="page-banner" aria-label={`${title} banner`}>

      {/* ── Left content ── */}
      <div className="page-banner__left">
        <div className="page-banner__content">
          <p className="page-banner__eyebrow">Experience the Taste</p>
          <h1 className="page-banner__heading">
            <span className="page-banner__heading--script">Explore the Journey</span>
            <span className="page-banner__heading--bold">{title}</span>
          </h1>

        </div>
      </div>

      {/* ── Right image ── */}
      <div className="page-banner__right">
        <img src={backgroundImage} alt={title} className="page-banner__img" />
        <div className="page-banner__img-scrim" />
      </div>

    </section>
  );
}
