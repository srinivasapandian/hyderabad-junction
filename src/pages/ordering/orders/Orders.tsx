/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion as Motion } from 'framer-motion';
import type { RootState, CustomerOrder } from '../../../types';
import DeliveryIcon from '../../../components/DeliveryIcon/DeliveryIcon';
import orderListSvg from '../../../assets/svg/orderList.svg';
import { fetchCustomerOrdersRequest } from '../../../redux/order/orderActions';
import { resolveStatusLabel as getStatusLabel } from '../../../constants/orderStatus';
import { resolveOrderTypeName } from '../../../utils/orderType';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import PageBg from '../../../components/pageBg/PageBg';
import OrdersShimmerGrid from '../../../shimmer/OrderCardShimmer/OrderCardShimmer';
import './Orders.css';

interface OrdersPageProps {
  onSignInClick?: () => void;
}

const STATUS_CLS: Record<string, string> = {
  Completed: 'is-done',
  'Ready for Pickup': 'is-ready',
  'Out for Delivery': 'is-ready',
  'Being Prepared': 'is-prep',
  'Order Accepted': 'is-prep',
  'Order Confirmed': 'is-confirmed',
  Cancelled: 'is-cancelled',
  Received: 'is-recv',
};

function resolveStatusMeta(status: any, order: any) {
  const label = getStatusLabel(status, order);
  return { label, cls: STATUS_CLS[label] || 'is-recv' };
}

function formatOrderDate(dateString: string | undefined): string {
  if (!dateString) return '';

  try {
    const parsed = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return dateString;
  }
}

interface OrderCardProps {
  order: any;
  onClick: () => void;
  slugData: any;
}

function OrderCard({ order, onClick, slugData }: OrderCardProps) {
  const typeName = resolveOrderTypeName(order, slugData);
  const typeToken = String(typeName || '').toLowerCase();
  const isDeliveryType = typeToken.includes('delivery');
  const { label: statusLabel, cls: statusCls } = resolveStatusMeta(
    order?.status ?? order?.orderStatus,
    order,
  );

  const items = (order?.items || []) as Record<string, unknown>[];
  const itemCount = items.reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.quantity || 0), 0);
  const previewItems = items.slice(0, 2);
  const extraCount = items.length - previewItems.length;

  const grandTotal =
    order?.totals?.find((t: Record<string, unknown>) => t.code === '5' || t.code === '5.0')?.value ??
    order?.orderTotal ??
    '0.00';

  const placedTime = formatOrderDate(order?.localOrderTime || order?.orderDate || '');
  const orderRef = order?.orderNo || order?.orderId || '';

  return (
    <div
      className="orders-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="orders-card__header">
        <div className="orders-card__ref">
          <img src={orderListSvg} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>#{orderRef}</span>
        </div>
        <span className={`orders-card__status ${statusCls}`}>{statusLabel}</span>
      </div>

      <div className="orders-card__meta">
        <span className="orders-card__type">
          {isDeliveryType ? (
            <DeliveryIcon />
          ) : (
            <i className="fas fa-store" />
          )}
          {typeName}
        </span>
        {placedTime && <span>Placed: {placedTime}</span>}
        <span>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="orders-card__items">
        {previewItems.map((item: Record<string, unknown>) => (
          <span key={String(item.orderItemId || item.itemId || item.itemName)} className="orders-card__item">
            {String(item.quantity)}x {String(item.itemName)}
          </span>
        ))}
        {extraCount > 0 && <span className="orders-card__item orders-card__item--more">+{extraCount} more</span>}
      </div>

      <div className="orders-card__footer">
        <span className="orders-card__total">${Number(grandTotal).toFixed(2)}</span>
        <span className="orders-card__cta">
          View details <i className="fas fa-chevron-right" />
        </span>
      </div>
    </div>
  );
}

export default function OrdersPage({ onSignInClick }: OrdersPageProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoggedIn } = useSelector((s: RootState) => s.auth);
  const slugData = useSelector((s: RootState) => s.slug.data);
  const locationId = slugData?.id || '';

  const {
    customerOrders: orders,
    ordersLoading: loading,
    ordersError: error,
    ordersLoaded,
  } = useSelector((s: RootState) => s.order);

  useEffect(() => {
    if (!isLoggedIn || !locationId) return;
    dispatch(fetchCustomerOrdersRequest());
  }, [dispatch, isLoggedIn, locationId]);

  const showSignInPrompt = !isLoggedIn;
  const showLoading = isLoggedIn && (loading || !ordersLoaded);
  const showError = isLoggedIn && ordersLoaded && !loading && !!error;
  const showEmpty = isLoggedIn && ordersLoaded && !loading && !error && orders.length === 0;
  const showOrders = isLoggedIn && ordersLoaded && !loading && orders.length > 0;

  function handleOrderClick(order: any) {
    navigate('/order-tracking', {
      state: {
        orderId: order?.orderId,
        orderNo: order?.orderNo,
        orderStatus: order?.orderStatus || order?.status,
        orderType: resolveOrderTypeName(order, slugData),
        grandTotal: order?.orderTotal,
        order,
      },
    });
  }

  return (
    <PageBg className="orders-page">

      <div className="orders-header">
        <button className="orders-back" onClick={() => navigate(-1)} type="button" aria-label="Go back">
          <span className="back-icon" aria-hidden="true" />
        </button>
        <h1 className="orders-title">My Orders</h1>
      </div>

      <main className="orders-inner">

        {showSignInPrompt && (
          <div className="orders-empty">
            <i className="fas fa-user-circle" />
            <p>Sign in to view your order history.</p>
            <button className="orders-empty__cta" type="button" onClick={() => onSignInClick?.()}>
              <i className="fas fa-sign-in-alt" />
              Sign In
            </button>
          </div>
        )}

        {showLoading && <OrdersShimmerGrid />}

        {showError && <p className="orders-error">{error}</p>}

        {showEmpty && (
          <div className="orders-empty">
            <i className="fa-solid fa-bag-shopping" />
            <p>No orders yet.</p>
            <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="orders-empty__cta">
              <i className="fa-solid fa-bag-shopping" />
              Start Ordering
            </Link>
          </div>
        )}

        {showOrders && (
          <div className="orders-list">
            {orders.map((order, index) => (
              <Motion.div
                key={order.orderId || order.orderNo || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <OrderCard order={order} slugData={slugData} onClick={() => handleOrderClick(order)} />
              </Motion.div>
            ))}
          </div>
        )}
      </main>

      <CtaStrip
        overline="Hungry for More?"
        heading="Place a New Order Online"
        btnLabel="Order Online"
        btnHref={`/order-online/${LOCATION_SLUG}/pickup`}
      />
    </PageBg>
  );
}
