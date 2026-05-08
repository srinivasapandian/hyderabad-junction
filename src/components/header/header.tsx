import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './header.css';
import logoImg from '../../assets/logo.png';
import { isReservationEnabledByBranch, LOCATION_SLUG } from '../../utils/branchConfig';
import type { RootState } from '../../types';

/* Retained for future bottom-nav re-enablement
function isBottomNavHidden(pathname) {
  if (['/', '/about-us', '/contact'].includes(pathname)) return true;
  if (/^\/indian-restaurant-menu\/[^/]+$/.test(pathname)) return true;
  return false;
}
*/

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // const showBottomNav = !isBottomNavHidden(pathname);
  const { isLoggedIn, user, mobilePhone } = useSelector((s: RootState) => s.auth);
  const slugData = useSelector((s: RootState) => s.slug.data);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);
  const displayName = (
    user?.name?.trim()
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || mobilePhone
    || 'User'
  );

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path: string): string => {
    if (path === '/') return pathname === '/' ? 'active' : '';
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
          <a href="/#about"                   className={isActive('/about-us')}                onClick={closeMenu}>About Us</a>
          <Link to="/indian-restaurant-menu"  className={isActive('/indian-restaurant-menu')}  onClick={closeMenu}>Menu</Link>
          <a href="/#services"                className={isActive('/services')}                onClick={closeMenu}>Services</a>
          <a href="/#gallery"                className={isActive('/gallery')}                 onClick={closeMenu}>Gallery</a>
          <a href="/#contact"               className={isActive('/contact')}                 onClick={closeMenu}>Contact Us</a>

          {/* Mobile-only button group */}
          <div className="header-nav-mobile-btns">
            <Link
              to="/account"
              className={`header-nav-mobile-btn header-nav-mobile-btn--outline${pathname === '/account' ? ' active' : ''}`}
              onClick={closeMenu}
            >
              {isLoggedIn ? 'My Account' : 'Sign In'}
            </Link>
            {isReservationEnabled && (
              <Link
                to="/reservation"
                className={`header-nav-mobile-btn header-nav-mobile-btn--outline${pathname === '/reservation' ? ' active' : ''}`}
                onClick={closeMenu}
              >
                Reserve a Table
              </Link>
            )}
            <Link
              to={`/order-online/${LOCATION_SLUG}/pickup`}
              className={`header-nav-mobile-btn header-nav-mobile-btn--filled${pathname.startsWith('/order-online') ? ' active' : ''}`}
              onClick={closeMenu}
            >
              Order Online
            </Link>
          </div>
        </nav>

        <div className="header-right-wrap">
          {isReservationEnabled && (
            <Link
              to="/reservation"
              className={`header-reservation-btn${pathname === '/reservation' ? ' active' : ''}`}
            >
              RESERVE A TABLE
            </Link>
          )}
          <Link
            to={`/order-online/${LOCATION_SLUG}/pickup`}
            className={`header-order-btn${pathname.startsWith('/order-online') ? ' active' : ''}`}
          >
            ORDER ONLINE
          </Link>
          <span className="header-right-divider" aria-hidden="true" />
          <button
            className={`header-user-btn${pathname === '/account' ? ' active' : ''}${isLoggedIn ? ' logged-in' : ''}`}
            aria-label={isLoggedIn ? `Account: ${displayName}` : 'Sign In'}
            onClick={() => { navigate('/account'); closeMenu(); }}
          >
            <span className="header-user-btn__icon">
              <i className="fa-solid fa-user" />
            </span>
            <span className="header-user-btn__label">{isLoggedIn ? displayName : 'User'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
