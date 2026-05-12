import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './header.css';
import logoImg from '../../assets/logo.png';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

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
          <Link to="/" className={isActive('/')} onClick={closeMenu}>Home</Link>
          <a href="/#about" onClick={closeMenu}>About Us</a>
          <a href="/#menu" onClick={closeMenu}>Menu</a>
          <a href="/#services" onClick={closeMenu}>Services</a>
          <a href="/#gallery" onClick={closeMenu}>Gallery</a>
          <a href="/#contact" onClick={closeMenu}>Contact Us</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
