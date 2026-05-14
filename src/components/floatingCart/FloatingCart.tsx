import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types';
import cartSvg from '../../assets/svg/cart.svg';
import './FloatingCart.css';

/* Retained for future bottom-nav re-enablement
import { useLocation } from 'react-router-dom';
function isBottomNavHidden(pathname: string) {
  if (['/', '/about-us', '/contact'].includes(pathname)) return true;
  if (/^\/indian-restaurant-menu\/[^/]+$/.test(pathname)) return true;
  return false;
}
*/

export default function FloatingCart(): React.JSX.Element | null {
  // Cart ordering is not active — hide the floating cart button site-wide
  return null;
}
