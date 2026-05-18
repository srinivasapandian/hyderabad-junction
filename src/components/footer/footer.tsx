import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import trainImg from '../../assets/train.png';
import './footer.css';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/#about' },
  { label: 'Menu', to: '/indian-restaurant-menu' },
  { label: 'Services', to: '/#services' },
  { label: 'Contact Us', to: '/contact' },
];

const SERVICES = ['Dine-in', 'Take way', 'Delivery'];
const NEWS = ['Offer', 'Updates', 'announcements'];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__star-strip" aria-hidden="true" />

      <div className="footer__brand-row container">
        <img src={logoImg} alt="Hyderabad Junction" className="footer__brand-logo" />
        <div className="footer__brand-copy">
          <h2>Hyderabad Junction</h2>
          <span>THE FLAVOR CONNECTION</span>
        </div>
      </div>

      <div className="footer__line container" aria-hidden="true" />

      <div className="footer__grid container">
        <div className="footer__train-card">
          <img src={trainImg} alt="Train mark" />
        </div>

        <div className="footer__col">
          <h3>QUICK LINK</h3>
          <ul>
            {QUICK_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3>SERVICES</h3>
          <ul>
            {SERVICES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3>NEWSLETTER</h3>
          <ul>
            {NEWS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="footer__col footer__touch">
          <h3>GET IN TOUCH</h3>
          <span className="footer__address">
            6000 Cleveland Gibbs Rd, Suite 300,
            <br />
            Northlake, Texas 76226
          </span>
          <a href="tel:+18174640033">+1-817-464-0033</a>
        </div>
      </div>

      <div className="footer__legal container">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <span>|</span>
        <Link to="/terms-of-use">Terms &amp; Conditions</Link>
        <span>|</span>
        <Link to="/cancellation-refund-policy">Refund Policy</Link>
      </div>

      <div className="footer__powered container">
        <span>© POWER BY</span>
        <a href="https://www.maghil.com/" target="_blank" rel="noopener noreferrer">
          maghil
        </a>
        <span>{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}

export default Footer;
