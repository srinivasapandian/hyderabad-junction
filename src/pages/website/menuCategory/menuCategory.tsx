import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import PageBanner from '../../../components/pageBanner/PageBanner';
import PageBg from '../../../components/pageBg/PageBg';
import FaqSection from '../../../components/faqSection/FaqSection';
import {
  menuLandingPages,
  menuLandingPagesBySlug,
} from '../../../data/menuLandingPages';
import heroBg from '../../../assets/images/new/optimized/hero-bg.jpg';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import './menuCategory.css';

function MenuCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const page = menuLandingPagesBySlug[categorySlug!];

  useEffect(() => {
    if (!page) return undefined;

    const previousTitle = document.title;
    const existingMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const previousDescription = existingMeta?.getAttribute('content') || '';
    const hadMeta = Boolean(existingMeta);

    let metaDescription = existingMeta;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }

    document.title = page.seoTitle;
    metaDescription.setAttribute('content', page.seoDescription);

    return () => {
      document.title = previousTitle;

      if (hadMeta) {
        metaDescription.setAttribute('content', previousDescription);
      } else {
        metaDescription.remove();
      }
    };
  }, [page]);

  if (!page) {
    return <Navigate to="/indian-restaurant-menu" replace />;
  }

  const relatedPages = menuLandingPages.filter((item) => item.slug !== page.slug);

  return (
    <PageBg className="menu-category-page">

      <PageBanner
        title={page.shortTitle}
        backgroundImage={page.heroImage || heroBg}
      />

      <div
        className="menu-category-stage"
      >
        <div className="menu-category-stage-scrim" />

        <section className="menu-category-section">
          <div className="menu-category-container menu-category-intro-grid">
            <div className="menu-category-copy">
              <p className="menu-category-kicker">Popular Near Sachse</p>
              <h2 className="menu-category-heading">{page.title}</h2>
              <p className="menu-category-text">{page.overview}</p>

              <div className="menu-category-chip-list">
                {page.chips.map((chip) => (
                  <span key={chip} className="menu-category-chip">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="menu-category-actions">
                <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="menu-category-btn menu-category-btn--primary">
                  Order Online
                </Link>
                <Link to="/contact" className="menu-category-btn menu-category-btn--secondary">
                  Visit Us
                </Link>
              </div>
            </div>

            <aside className="menu-category-panel">
              <p className="menu-category-panel-label">Why Guests Visit This Page</p>
              <ul className="menu-category-point-list">
                {page.featurePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <FaqSection
          className="menu-category-faq"
          kicker="Page FAQ"
          title={`${page.shortTitle} FAQ`}
          intro={page.faqIntro}
          items={page.faqs}
        />

        <section className="menu-category-section menu-category-section--explore">
          <div className="menu-category-container">
            <div className="menu-category-explore-head">
              <div>
                <p className="menu-category-kicker">Explore More</p>
                <h2 className="menu-category-heading menu-category-heading--compact">
                  More Menu Pages
                </h2>
              </div>

              <Link to="/indian-restaurant-menu" className="menu-category-inline-link">
                View Full Menu
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            <div className="menu-category-grid">
              {relatedPages.map((item) => (
                <Link
                  key={item.slug}
                  to={`/indian-restaurant-menu/${item.slug}`}
                  className="menu-category-card"
                >
                  <p className="menu-category-card-kicker">Menu Page</p>
                  <h3>{item.shortTitle}</h3>
                  <p>{item.heroDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

    </PageBg>
  );
}

export default MenuCategoryPage;
