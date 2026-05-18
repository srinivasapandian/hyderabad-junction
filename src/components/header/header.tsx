import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isReservationEnabledByBranch } from '../../utils/branchConfig';
import './header.css';
import logoImg from '../../assets/logo.png';
import type { RootState } from '../../types';
import ComingSoonModal from '../comingSoonModal/ComingSoonModal';

/* Retained for future bottom-nav re-enablement
function isBottomNavHidden(pathname) {
  if (['/', '/about-us', '/contact'].includes(pathname)) return true;
  if (/^\/indian-restaurant-menu\/[^/]+$/.test(pathname)) return true;
  return false;
}
*/

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  // const showBottomNav = !isBottomNavHidden(pathname);
  const slugData = useSelector((s: RootState) => s.slug.data);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);

  const closeMenu = () => setMenuOpen(false);
  const openComingSoon = () => { closeMenu(); setComingSoonOpen(true); };

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  const isActive = (path: string, hashMatch?: string): string => {
    if (hashMatch) {
      return (pathname === path && hash === hashMatch) ? 'active' : '';
    }
    if (path === '/') return (pathname === '/' && (!hash || hash === '#home')) ? 'active' : '';
    return pathname === path || pathname.startsWith(`${path}/`) ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-brand-group" onClick={closeMenu}>
          <span className="header-logo">
            <img src={logoImg} alt="Hyderabad Junction" />
          </span>
          <span className="header-brand-copy">
            <span className="header-brand-title">Hyderabad Junction</span>
            <span className="header-brand-tagline">THE FLAVOR CONNECTION</span>
          </span>
        </Link>

        <button
          className={`header-hamburger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`header-nav-overlay ${menuOpen ? 'open' : ''}`}
          onClick={closeMenu}
          aria-hidden={!menuOpen}
        />

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {/* Plain nav links — desktop + mobile */}
          <Link to="/"                        className={isActive('/')}                        onClick={closeMenu}>Home</Link>
          <Link to="/#about"                  className={isActive('/', '#about')}              onClick={closeMenu}>About Us</Link>
          <Link to="/indian-restaurant-menu"  className={isActive('/indian-restaurant-menu')}  onClick={closeMenu}>Menu</Link>
          <Link to="/#services"               className={isActive('/', '#services')}           onClick={closeMenu}>Services</Link>
          <Link to="/#gallery"                className={isActive('/', '#gallery')}            onClick={closeMenu}>Gallery</Link>
          <Link to="/contact"                 className={isActive('/contact')}                 onClick={closeMenu}>Contact Us</Link>

          {/* Mobile-only button group */}
          <div className="header-nav-mobile-btns">
            {isReservationEnabled && (
              <Link
                to="/reservation"
                className={`header-nav-mobile-btn header-nav-mobile-btn--outline ${isActive('/reservation')}`}
                onClick={closeMenu}
              >
                Reserve a Table
              </Link>
            )}

            <button
              className="header-nav-mobile-btn header-nav-mobile-btn--filled"
              onClick={openComingSoon}
            >
              Order Online
            </button>
          </div>
        </nav>

        <div className="header-right-wrap">
          {isReservationEnabled && (
            <Link
              to="/reservation"
              className={`header-reservation-btn ${isActive('/reservation')}`}
            >
              RESERVE A TABLE
            </Link>
          )}

          <button
            className="header-order-btn"
            onClick={openComingSoon}
          >
            ORDER ONLINE
          </button>
          {/* User button hidden — auth not active */}
        </div>
      </div>

      <ComingSoonModal isOpen={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
    </header>
  );
}

export default Header;
