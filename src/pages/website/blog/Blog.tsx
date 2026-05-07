import { Link } from 'react-router-dom';
import PageBanner from '../../../components/pageBanner/PageBanner';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';
import './blog.css';

export default function Blog() {
  return (
    <div className="blog-page">
      <PageBanner title="Blog" backgroundImage={BANNER_IMAGES.blog} />

      <section className="blog-soon">
        <div className="blog-soon__icon">
          <i className="fa-regular fa-newspaper" aria-hidden="true" />
        </div>

        <p className="blog-soon__overline">Coming Soon</p>

        <Link to="/" className="blog-soon__cta">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to Home
        </Link>
      </section>
    </div>
  );
}
