import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logoImg from '../../assets/logo/amudham-peach.png';
import maghilLogo from '../../assets/logo/maghil-logo.png';
import { isReservationEnabledByBranch, LOCATION_SLUG } from '../../utils/branchConfig';
import type { RootState } from '../../types';
import './footer.css';

const SOCIALS = [
  { icon: 'fab fa-facebook',  label: 'Facebook',  href: 'https://www.facebook.com/amudhamcafeusa' },
  { icon: 'fab fa-instagram', label: 'Instagram', href: 'https://www.instagram.com/amudhamcafe.usa/' },
];

const POPULAR_PICKS = [
  { label: 'Starters',      to: '/indian-restaurant-menu/starters' },
  { label: 'Dosa',          to: '/indian-restaurant-menu/dosa' },
  { label: 'Indian Breads', to: '/indian-restaurant-menu/indian-breads' },
  { label: 'Curries',       to: '/indian-restaurant-menu/curries' },
  { label: 'Biryani',       to: '/indian-restaurant-menu/biryani' },
];

function Footer() {
  const slugData = useSelector((s: RootState) => s.slug.data);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);

  const USEFUL_LINKS = [
    { label: 'Home',         to: '/' },
    { label: 'Our Story',    to: '/about-us' },
    { label: 'Menu',         to: '/indian-restaurant-menu' },
    { label: 'Order Online', to: `/order-online/${LOCATION_SLUG}/pickup` },
    { label: 'Visit Us',     to: '/contact' },
    ...(isReservationEnabled ? [{ label: 'Reservation', to: '/reservation' }] : []),
  ];

  return (
    <footer className="footer">
      <div className="container footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <Link to="/"><img src={logoImg} alt="Amudham Cafe" className="footer__logo-img" /></Link>
          <p className="footer__brand-desc">
            A place to rediscover the warmth and comfort of home with every meal —
            legacy recipes, ready in minutes.
          </p>
          <div className="footer__socials">
            <p className="footer__socials-label">Follow Us</p>
            <div className="footer__socials-icons">
              {SOCIALS.map(({ icon, label, href }) => (
                <a key={label} href={href} aria-label={label} className="footer__social-icon" target="_blank" rel="noopener noreferrer">
                  <i className={icon} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Useful Links */}
        <div className="footer__col">
          <h4 className="footer__col-title">Useful Links</h4>
          <ul className="footer__col-list">
            {USEFUL_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="footer__col-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Popular Picks */}
        <div className="footer__col">
          <h4 className="footer__col-title">Popular Picks</h4>
          <ul className="footer__col-list">
            {POPULAR_PICKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="footer__col-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Policies */}
        <div className="footer__col">
          <h4 className="footer__col-title">Policies</h4>
          <ul className="footer__col-list">
            <li><Link to="/privacy-policy" className="footer__col-link">Privacy Policy</Link></li>
            <li><Link to="/terms-of-use" className="footer__col-link">Terms of Service</Link></li>
            <li><Link to="/cancellation-refund-policy" className="footer__col-link">Cancellation &amp; Refund</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer__bottom container">
        <span className="footer__copy">© Copyright {new Date().getFullYear()} Amudham Cafe. All rights reserved.</span>
      </div>

      {/* Powered by */}
      <div className="footer__powered">
        <span className="footer__powered-text">Powered by</span>
        <a href="https://www.maghil.com/" target="_blank" rel="noopener noreferrer">
          <img src={maghilLogo} alt="Maghil" className="footer__powered-logo" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
