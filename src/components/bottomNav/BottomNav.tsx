import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isReservationEnabledByBranch, LOCATION_SLUG } from '../../utils/branchConfig';
import type { RootState } from '../../types';
import './BottomNav.css';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  match: (pathname: string) => boolean;
  badge?: boolean;
  reservationOnly?: boolean;
}

// Returns true when the bottom nav should NOT be rendered
function isBottomNavHidden(pathname: string): boolean {
  if (['/', '/about-us', '/contact'].includes(pathname)) return true;
  // Category listing page: /indian-restaurant-menu/<slug>  (exactly one extra segment)
  // Item detail (/indian-restaurant-menu/<cat>/<item>) still shows the nav
  if (/^\/indian-restaurant-menu\/[^/]+$/.test(pathname)) return true;
  return false;
}

const BASE_NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    to: '/',
    icon: 'fa-house',
    match: (p: string) => p === '/',
  },
  {
    label: 'Menu',
    to: `/order-online/${LOCATION_SLUG}/pickup`,
    icon: 'fa-compass',
    match: (p: string) => p.startsWith('/order-online') || p.startsWith('/indian-restaurant-menu'),
  },
  {
    label: 'Cart',
    to: '/cart',
    icon: 'fa-cart-shopping',
    match: (p: string) => p === '/cart',
    badge: true,
  },
  {
    label: 'Reserve',
    to: '/reservation',
    icon: 'fa-calendar-check',
    match: (p: string) => p === '/reservation',
    reservationOnly: true,
  },
  {
    label: 'Profile',
    to: '/account',
    icon: 'fa-user',
    match: (p: string) => p === '/account',
  },
];

export default function BottomNav(): React.JSX.Element | null {
  const { pathname }       = useLocation();
  const cartLines          = useSelector((s: RootState) => s.cart.cartLines);
  const slugData           = useSelector((s: RootState) => s.slug.data);
  const cartCount          = cartLines.reduce((sum, l) => sum + (l.qty || 0), 0);
  const reservationEnabled = isReservationEnabledByBranch(slugData);

  const NAV_ITEMS = BASE_NAV_ITEMS.filter(
    (item) => !item.reservationOnly || reservationEnabled
  );

  if (isBottomNavHidden(pathname)) return null;

  return (
    <nav className="bnav" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ label, to, icon, match, badge }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            to={to}
            className={`bnav__item${active ? ' bnav__item--active' : ''}`}
            aria-label={label}
          >
            <span className="bnav__icon-wrap">
              <i className={`fa-solid ${icon}`} />
              {badge && cartCount > 0 && (
                <span className="bnav__badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </span>
            <span className="bnav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
