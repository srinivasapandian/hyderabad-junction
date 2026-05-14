/**
 * ClosingSoonBar
 *
 * Fixed orange bottom bar shown when the restaurant is still open but
 * approaching its session end time (scheduler cases 2 & 3).
 *
 * Mutually exclusive with ClosedBar — the restaurant cannot be both
 * "closing soon" (open) and "closed" at the same time.
 *
 * Positioning:
 *   Sits directly above ActiveOrdersBar (AOB_HEIGHT = 40 px) when active
 *   orders exist; otherwise anchored to the very bottom of the viewport.
 *   Width is 100% when no active orders, falls back to CSS value (97%)
 *   when ActiveOrdersBar is present — matching ClosedBar behaviour exactly.
 *
 * Props:
 *   orderType – 'Pickup' | 'Delivery'
 *     Determines which ETA is used to compute the closing-soon window.
 *     Menu page always passes 'Pickup'.
 *     Ordering page passes the currently selected order type.
 */
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import type { RootState } from '../../types';
import type { OrderType } from '../../types';
import { useIsClosingSoon } from '../../hooks/useRestaurantStatus';
import './ClosingSoonBar.css';

// AOB bar height kept in sync with ActiveOrdersBar.css (.aob-collapsed height)
const AOB_HEIGHT = 40;

/** Warning SVG — inline so it flows with the text, inherits currentColor */
function WarningIcon(): React.JSX.Element {
  return (
    <svg
      className="csb-warning-icon"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013
      4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554
      13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787
      19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702
      17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661
      16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM9.375 4.5C9.59751 4.5 9.81501
      4.56598 10 4.6896C10.185 4.81321 10.3292 4.98891 10.4144 5.19448C10.4995 5.40005 10.5218
      5.62625 10.4784 5.84448C10.435 6.06271 10.3278 6.26316 10.1705 6.4205C10.0132 6.57783
      9.81271 6.68498 9.59448 6.72838C9.37625 6.77179 9.15005 6.74951 8.94449 6.66436C8.73892
      6.57922 8.56322 6.43502 8.4396 6.25002C8.31598 6.06501 8.25 5.8475 8.25 5.625C8.25
      5.32663 8.36853 5.04048 8.57951 4.8295C8.79049 4.61853 9.07664 4.5 9.375 4.5ZM10.5
      15C10.1022 15 9.72065 14.842 9.43934 14.5607C9.15804 14.2794 9 13.8978 9 13.5V9.75C8.80109
      9.75 8.61033 9.67098 8.46967 9.53033C8.32902 9.38968 8.25 9.19891 8.25 9C8.25 8.80109
      8.32902 8.61032 8.46967 8.46967C8.61033 8.32902 8.80109 8.25 9 8.25C9.39783 8.25 9.77936
      8.40804 10.0607 8.68934C10.342 8.97064 10.5 9.35218 10.5 9.75V13.5C10.6989 13.5 10.8897
      13.579 11.0303 13.7197C11.171 13.8603 11.25 14.0511 11.25 14.25C11.25 14.4489 11.171
      14.6397 11.0303 14.7803C10.8897 14.921 10.6989 15 10.5 15Z" />
    </svg>
  );
}

/**
 * Builds the closing-soon message — mirrors scheduler case 2 & 3 type strings.
 *
 * Case 2 (2×ETA → 1×ETA before close):
 *   "[icon] Hurry up! We are closing soon. Please place your order before [time] [tz]."
 *
 * Case 3 (1×ETA → close):
 *   "[icon] We are closing soon. Get your favorites before we close at [time] [tz]!"
 */
function buildMessage(closingCase: 2 | 3, closingTime: string, timeZone: string): React.ReactNode {
  const tzLabel = timeZone ? <>&nbsp;{timeZone}</> : null;

  if (closingCase === 2) {
    return (
      <>
        <WarningIcon />&nbsp;Hurry up!&nbsp;We are closing soon.&nbsp;
        Please place your order before&nbsp;<strong>{closingTime}</strong>{tzLabel}.
      </>
    );
  }

  // Case 3
  return (
    <>
      <WarningIcon />&nbsp;We are closing soon.&nbsp;
      Get your favorites before we close at&nbsp;<strong>{closingTime}</strong>{tzLabel}!
    </>
  );
}

interface ClosingSoonBarProps {
  orderType: OrderType;
}

export default function ClosingSoonBar({ orderType }: ClosingSoonBarProps): React.JSX.Element {
  const activeOrders = useSelector((s: RootState) => s.activeOrders.orders);

  const { isClosingSoon, closingCase, closingTime, timeZone } = useIsClosingSoon(orderType);

  const hasActiveOrders = activeOrders.length > 0;
  // const aobHeight       = hasActiveOrders ? AOB_HEIGHT : 0;

  return null; // Disabled as per user request

  return (
    <AnimatePresence>
      {isClosingSoon && closingCase && (
        <motion.div
          className="csb-root"
          style={{ bottom: aobHeight, width: hasActiveOrders ? undefined : '100%' }}
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          role="status"
          aria-live="polite"
        >
          <span className="csb-text">{buildMessage(closingCase, closingTime, timeZone)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
