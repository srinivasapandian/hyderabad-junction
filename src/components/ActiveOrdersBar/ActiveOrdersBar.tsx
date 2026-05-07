import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import type { RootState, ActiveOrder } from '../../types';
import './ActiveOrdersBar.css';

/* Retained for future bottom-nav re-enablement
import { useLocation } from 'react-router-dom';
function isBottomNavHidden(pathname: string) {
  if (['/', '/about-us', '/contact'].includes(pathname)) return true;
  if (/^\/indian-restaurant-menu\/[^/]+$/.test(pathname)) return true;
  return false;
}
*/

export default function ActiveOrdersBar(): React.JSX.Element {
  const activeOrders = useSelector((s: RootState) => s.activeOrders.orders);
  const navigate = useNavigate();
  // const { pathname } = useLocation();
  // className was: `aob-root${isBottomNavHidden(pathname) ? ' aob-root--no-bnav' : ''}`

  function handleTrack(order: ActiveOrder): void {
    navigate('/order-tracking', {
      state: {
        orderId: order.orderId,
        orderNo: order.orderNo,
        orderStatus: order.orderStatus,
        orderType: order.orderType,
        grandTotal: order.grandTotal ?? order._raw?.orderTotal ?? null,
        order: order._raw || null,
      },
    });
  }

  return (
    <AnimatePresence>
      {activeOrders.length > 0 && (
        <motion.div
          className="aob-root aob-root--no-bnav"
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="aob-collapsed">
            <span className="aob-collapsed__left">
              <span className="aob-delivery-icon" aria-hidden="true" />
              <span className="aob-count">
                {activeOrders.length} Active {activeOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </span>

            <span className="aob-pills">
              {activeOrders.map((order) => (
                <button
                  key={order.orderId}
                  className="aob-pill aob-pill--btn pill--recv"
                  onClick={() => handleTrack(order)}
                  type="button"
                >
                  #{order.orderNo || order.orderId}
                  {(order.grandTotal ?? order._raw?.orderTotal) != null && (
                    <> &middot; <span style={{ color: '#121212' }}>${Number(order.grandTotal ?? order._raw?.orderTotal).toFixed(2)}</span></>
                  )}
                </button>
              ))}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
