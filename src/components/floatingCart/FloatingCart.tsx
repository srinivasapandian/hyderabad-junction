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
  const navigate       = useNavigate();
  const cartLines      = useSelector((s: RootState) => s.cart.cartLines);
  const totalItemCount = cartLines.length;
  // const { pathname } = useLocation();
  // const hiddenOnMobile = !isBottomNavHidden(pathname);

  if (totalItemCount === 0) return null;

  // className was: `floating-cart${hiddenOnMobile ? ' floating-cart--hidden-mobile' : ''}`
  return (
    <button
      className="floating-cart"
      onClick={() => navigate('/cart')}
      aria-label={`View cart — ${totalItemCount} item${totalItemCount !== 1 ? 's' : ''}`}
    >
      <img src={cartSvg} alt="" className="floating-cart__icon" />
      {totalItemCount > 0 && (
        <span className="floating-cart__badge">{totalItemCount}</span>
      )}
    </button>
  );
}
