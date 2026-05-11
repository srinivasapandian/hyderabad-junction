/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion as Motion } from 'framer-motion';
import type { RootState, OrderTotal, Address } from '../../../types';

declare global {
  interface Window {
    grecaptcha: any;
  }
}
import AddressModal from '../../../components/addressModal/AddressModal';
import Toast from '../../../components/toast/Toast';
import { clearCartAction } from '../../../redux/cart/cartReducer';
import { placeOrderRequest, placeOrderReset } from '../../../redux/order/orderActions';
import { getAddressLinesForPayload } from '../../../utils/addressStorage';
import { fetchAddressRequest, deliveryQuoteRequest, clearDeliveryQuote } from '../../../redux/address/addressActions';
import { fetchTotalsRequest, clearTotals } from '../../../redux/totals/totalsActions';
import { paymentTenderTypes, resolvePaymentCurrencyFromSlug } from '../../../constants/paymentConstants';
import PageBg from '../../../components/pageBg/PageBg';
import { LOCATION_SLUG, getMatchedBranchByMerchantSlug, resolvePaymentOptions, getCodLimitForOrderType } from '../../../utils/branchConfig';
import { getEtaInTimeZone } from '../../../hooks/getEtaInTimeZone';
import './Checkout.css';

interface CheckoutPageProps {
  onSignInClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOrderTypeIdFromSlug = (slugData: any, typeName: string): string | undefined => {
  const orderTypes = slugData?.orderTypes || slugData?.body?.orderTypes || [];
  return orderTypes.find((t: any) => t?.typeName?.toLowerCase() === typeName.toLowerCase())?.id;
};

const CARD_PAYMENT_OPTION = paymentTenderTypes.CNP;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const PAYMENT_PROVIDER_ID = import.meta.env.VITE_PAYMENT_PROVIDER_ID;
const RECAPTCHA_WIDGET_WIDTH = 304;
const RECAPTCHA_WIDGET_HEIGHT = 78;

interface CardFormState {
  accountNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  streetCode: string;
  postalCode: string;
  recaptchaToken: string;
}

const INITIAL_CARD_FORM: CardFormState = {
  accountNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
  streetCode: '',
  postalCode: '',
  recaptchaToken: '',
};

function digitsOnly(value: string | undefined, maxLen: number): string {
  return String(value || '').replace(/\D/g, '').slice(0, maxLen);
}

function loadRecaptchaScript() {
  if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
    return Promise.resolve(window.grecaptcha);
  }

  let script = document.getElementById('google-recaptcha-script') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'google-recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timeoutMs = 12000;

    const fail = () => reject(new Error('reCAPTCHA script failed to load'));
    script.addEventListener('error', fail, { once: true });

    const poll = () => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        resolve(window.grecaptcha);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('reCAPTCHA script load timed out'));
        return;
      }
      setTimeout(poll, 120);
    };

    poll();
  });
}

function fitRecaptchaToContainer(container: HTMLDivElement | null) {
  if (!container) return;
  const recaptchaRoot = container.firstElementChild as HTMLElement | null;
  if (!recaptchaRoot) return;

  const availableWidth = container.clientWidth || RECAPTCHA_WIDGET_WIDTH;
  const scale = Math.min(1, availableWidth / RECAPTCHA_WIDGET_WIDTH);

  recaptchaRoot.style.width = `${RECAPTCHA_WIDGET_WIDTH}px`;
  recaptchaRoot.style.height = `${RECAPTCHA_WIDGET_HEIGHT}px`;
  recaptchaRoot.style.transformOrigin = 'left top';
  recaptchaRoot.style.transform = `scale(${scale})`;
  container.style.height = `${Math.ceil(RECAPTCHA_WIDGET_HEIGHT * scale)}px`;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface CheckoutCardDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

function CheckoutCardDropdown({
  label,
  placeholder,
  value,
  options,
  onChange,
}: CheckoutCardDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <label className="checkout-card-form__field">
      <span>{label} *</span>
      <div className="checkout-select" ref={rootRef}>
        <button
          type="button"
          className={`checkout-select__trigger${open ? ' is-open' : ''}`}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <i className="fas fa-chevron-down checkout-select__arrow" aria-hidden="true" />
        </button>

        {open && (
          <div className="checkout-select__menu" role="listbox">
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`checkout-select__option${isActive ? ' is-active' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </label>
  );
}

export default function CheckoutPage({ onSignInClick }: CheckoutPageProps) {
  const navigate = useNavigate();
  const loc      = useLocation();
  const dispatch = useDispatch();

  const { isLoggedIn, user, customerId, mobilePhone } = useSelector((s: RootState) => s.auth);
  const slugData = useSelector((s: RootState) => s.slug.data);
  const {
    addresses: savedAddresses,
    loading:      addrLoading,
    quoteLoading,
    quote,
    quoteError,
  } = useSelector((s: RootState) => s.address);

  // Order saga state — replaces local placing / error useState
  const { loading: placing, error, currentOrder } = useSelector((s: RootState) => s.order);

  // Redux totals (populated by totalsSaga on mount + after quote)
  const { totals: reduxTotals, grandTotal: reduxGrandTotal } = useSelector((s: RootState) => s.totals);

  const locState = loc.state as any;
  const { cartLines = [], totals = null, grandTotal = null, orderType = 'Pickup' } = locState || {} as any;

  const [selectedAddress,  setSelectedAddress]  = useState<any>(null);
  const [pendingAddress,   setPendingAddress]   = useState<any>(null); // being quote-validated
  const [paymentMethod,    setPaymentMethod]    = useState<string | null>(null);
  const [showCardForm,     setShowCardForm]     = useState<boolean>(false);
  const [cardForm,         setCardForm]         = useState<CardFormState>(INITIAL_CARD_FORM);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [addrError,        setAddrError]        = useState<string | null>(null);
  const [toast,            setToast]            = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  // Local validation error (pre-flight checks before dispatching)
  const [localError, setLocalError] = useState<string | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  const expiryMonthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    [],
  );
  const expiryYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => {
      const fullYear = currentYear + i;
      return {
        value: String(fullYear).slice(-2),
        label: String(fullYear),
      };
    });
  }, []);
  const expiryMonthDropdownOptions = useMemo(
    () => expiryMonthOptions.map((m) => ({ value: m, label: m })),
    [expiryMonthOptions],
  );
  const expiryYearDropdownOptions = useMemo(
    () => expiryYearOptions.map((y) => ({ value: y.value, label: y.label })),
    [expiryYearOptions],
  );

  // ── On saga success → clear cart + navigate ───────────────────────────────
  useEffect(() => {
    if (!currentOrder) return;
    dispatch(clearCartAction());
    navigate('/order-tracking', {
      state: {
        orderId:    currentOrder.orderId,
        orderNo:    currentOrder.orderNo,
        orderType:  currentOrder.orderType,
        grandTotal: currentOrder.grandTotal,
        order:      currentOrder.order,
      },
    });
    dispatch(placeOrderReset());
  }, [currentOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset saga state when leaving page ───────────────────────────────────
  useEffect(() => () => {
    dispatch(placeOrderReset());
    dispatch(clearDeliveryQuote());
    dispatch(clearTotals());       // prevent stale delivery-fee totals bleeding into next checkout visit
  }, [dispatch]);

  // ── Totals on mount — always flush stale totals first then fetch fresh ───
  // clearTotals ensures no delivery-fee totals from a previous Delivery checkout
  // are shown if the user is now in a Pickup/DineIn flow (or Delivery before selecting an address)
  useEffect(() => {
    dispatch(clearTotals());
    dispatch(fetchTotalsRequest());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch addresses for Delivery orders ──────────────────────────────────
  useEffect(() => {
    if (orderType === 'Delivery' && isLoggedIn && customerId) {
      dispatch(fetchAddressRequest(customerId));
    }
  }, [orderType, isLoggedIn, customerId, dispatch]);

  // ── Quote result — confirm or reject pending address ─────────────────────
  useEffect(() => {
    if (!pendingAddress || quoteLoading) return;

    const isValid = quote && quote.estimatedPrice && quote.eta;

    if (isValid) {
      // Quote succeeded — confirm selection and re-fetch totals with delivery fee
      setSelectedAddress(pendingAddress);
      setAddrError(null);
      dispatch(fetchTotalsRequest({ deliveryFee: parseFloat(quote.estimatedPrice as string) || 0 }));
    } else {
      // Quote failed or response not relevant — reject selection
      setSelectedAddress(null);
      setToast({ visible: true, message: 'Unable to deliver to this location !' });
    }
    setPendingAddress(null);
  }, [quoteLoading, quote, quoteError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paymentMethod !== CARD_PAYMENT_OPTION || !showCardForm) return;
    if (!RECAPTCHA_SITE_KEY) {
      setLocalError('Missing reCAPTCHA site key (VITE_RECAPTCHA_SITE_KEY).');
      return;
    }
    if (!recaptchaContainerRef.current) return;

    let isMounted = true;

    const renderRecaptcha = async () => {
      try {
        const grecaptcha = await loadRecaptchaScript();
        const container = recaptchaContainerRef.current;
        if (!isMounted || !container) return;

        const applyFit = () => {
          fitRecaptchaToContainer(container);
          requestAnimationFrame(() => fitRecaptchaToContainer(container));
        };

        if (recaptchaWidgetIdRef.current !== null && container.childElementCount > 0) {
          grecaptcha.reset(recaptchaWidgetIdRef.current);
          applyFit();
          return;
        }

        container.innerHTML = '';
        recaptchaWidgetIdRef.current = grecaptcha.render(container, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => {
            if (!isMounted) return;
            setLocalError(null);
            setCardForm((prev) => ({ ...prev, recaptchaToken: token || '' }));
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setCardForm((prev) => ({ ...prev, recaptchaToken: '' }));
          },
          'error-callback': () => {
            if (!isMounted) return;
            setCardForm((prev) => ({ ...prev, recaptchaToken: '' }));
          },
        });
        applyFit();
      } catch {
        if (!isMounted) return;
        setLocalError('Unable to load reCAPTCHA. Disable blocker/VPN and refresh.');
      }
    };

    renderRecaptcha();

    return () => {
      isMounted = false;
    };
  }, [paymentMethod, showCardForm]);

  useEffect(() => {
    if (!showCardForm || paymentMethod !== CARD_PAYMENT_OPTION) return;

    const onResize = () => fitRecaptchaToContainer(recaptchaContainerRef.current);
    window.addEventListener('resize', onResize);
    onResize();

    return () => window.removeEventListener('resize', onResize);
  }, [showCardForm, paymentMethod]);

  // ── Derived values ────────────────────────────────────────────────────────
  const locationId = slugData?.id || '';
  const orderTypeId = orderType === 'Delivery'
    ? getOrderTypeIdFromSlug(slugData, 'Delivery')
    : orderType === 'DineIn'
      ? getOrderTypeIdFromSlug(slugData, 'DineIn')
      : getOrderTypeIdFromSlug(slugData, 'Pickup');

  const clientItemTotal = cartLines.reduce((sum: number, line: any) => {
    const modTotal = line.modifiers.reduce((s: number, o: any) => s + o.price, 0);
    return sum + (line.basePrice + modTotal) * line.qty;
  }, 0);

  const estimatedDeliveryFee = orderType === 'Delivery'
    ? (parseFloat(quote?.estimatedPrice as string) || 0)
    : 0;

  const displayTotals = useMemo(() => {
    // Prefer live Redux totals (updated by totalsSaga on mount + after each quote)
    const val = clientItemTotal.toFixed(2);
    const baseTotals = Array.isArray(reduxTotals) && reduxTotals.length > 0
      ? reduxTotals
      : Array.isArray(totals) && totals.length > 0
        ? totals
        : [
      { code: '1', title: 'Item Total',  value: val, sortOrder: '1' },
      { code: '5', title: 'Grand Total', value: val, sortOrder: '9' },
    ];
    const withQuoteFee = baseTotals.map((t) => ({ ...t }));

    if (orderType === 'Delivery' && estimatedDeliveryFee > 0) {
      const deliveryIdx = withQuoteFee.findIndex((t) => t.code === '4' || t.code === '4.0');
      const prevDelivery = parseFloat(
        deliveryIdx >= 0 ? withQuoteFee[deliveryIdx]?.value : '0',
      ) || 0;

      if (deliveryIdx >= 0) {
        withQuoteFee[deliveryIdx] = {
          ...withQuoteFee[deliveryIdx],
          title: withQuoteFee[deliveryIdx].title || 'Delivery Charges',
          value: estimatedDeliveryFee.toFixed(2),
          sortOrder: withQuoteFee[deliveryIdx].sortOrder || '4',
        };
      } else {
        withQuoteFee.push({
          code: '4',
          title: 'Delivery Charges',
          value: estimatedDeliveryFee.toFixed(2),
          sortOrder: '4',
        });
      }

      const grandIdx = withQuoteFee.findIndex((t) => t.code === '5' || t.code === '5.0');
      if (grandIdx >= 0) {
        const prevGrand = parseFloat(withQuoteFee[grandIdx]?.value || '0') || 0;
        withQuoteFee[grandIdx] = {
          ...withQuoteFee[grandIdx],
          value: (prevGrand - prevDelivery + estimatedDeliveryFee).toFixed(2),
        };
      }
    }

    return withQuoteFee;
  }, [reduxTotals, totals, clientItemTotal, orderType, estimatedDeliveryFee]);

  const grandTotalVal = (() => {
    const candidate = displayTotals?.find((t) => t.code === '5' || t.code === '5.0')?.value
      ?? reduxGrandTotal
      ?? grandTotal;
    const parsed = parseFloat(candidate);
    return !isNaN(parsed) ? parsed.toFixed(2) : clientItemTotal.toFixed(2);
  })();

  const cartItemCount = cartLines.reduce((n: number, l: any) => n + l.qty, 0);

  const { showPayAtStore, showPayOnDelivery } = resolvePaymentOptions(slugData);
  const codLimit = getCodLimitForOrderType(slugData, orderTypeId);
  const isCodLimitExceeded = codLimit !== null && parseFloat(grandTotalVal) >= codLimit;
  const showOfflinePayment = (orderType === 'Delivery' ? showPayOnDelivery : showPayAtStore) && !isCodLimitExceeded;

  useEffect(() => {
    if (!showOfflinePayment && paymentMethod !== CARD_PAYMENT_OPTION) {
      setPaymentMethod(CARD_PAYMENT_OPTION);
      setShowCardForm(true);
      setCardForm((prev) => ({ ...prev, recaptchaToken: '' }));
      recaptchaWidgetIdRef.current = null;
    }
  }, [showOfflinePayment]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentOption = orderType === 'Delivery' ? 'pay_on_delivery' : 'pay_at_store';
  const paymentLabel  = orderType === 'Delivery' ? 'Pay on Delivery' : 'Pay at Store';
  const isCardPayment = paymentMethod === CARD_PAYMENT_OPTION;
  const orderTypeLabel = orderType === 'DineIn' ? 'Dine In' : orderType;

  function handlePaymentToggle(option: string, checked: boolean) {
    if (checked) {
      setPaymentMethod(option);
      setLocalError(null);

      if (option === CARD_PAYMENT_OPTION) {
        setShowCardForm(true);
        setCardForm((prev) => ({ ...prev, recaptchaToken: '' }));
        if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetIdRef.current);
        }
        recaptchaWidgetIdRef.current = null;
      }
      return;
    }

    setPaymentMethod(null);
    if (option === CARD_PAYMENT_OPTION) {
      setShowCardForm(false);
      setCardForm(INITIAL_CARD_FORM);
      if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetIdRef.current);
      }
      recaptchaWidgetIdRef.current = null;
    }
  }

  function handleCardDigitsChange(field: keyof CardFormState, maxLen: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = digitsOnly(e.target.value, maxLen);
      setCardForm((prev) => ({ ...prev, [field]: next }));
    };
  }

  function handleOpenCardForm() {
    if (!isCardPayment) return;

    setShowCardForm(true);
    setLocalError(null);
    setCardForm((prev) => ({ ...prev, recaptchaToken: '' }));
    recaptchaWidgetIdRef.current = null;
  }

  function validateCardForm(): string | null {
    if (!showCardForm) return 'Click "Add New Card" to enter card details.';
    if (cardForm.accountNumber.length !== 16) return 'Card Number must be 16 digits.';
    if (!cardForm.expiryMonth) return 'Please select Expiry Month.';
    if (!cardForm.expiryYear) return 'Please select Expiry Year.';
    if (cardForm.cvv.length < 3 || cardForm.cvv.length > 4) return 'CVV must be 3 or 4 digits.';
    if (!cardForm.streetCode) return 'Street Number is required.';
    if (cardForm.streetCode.length > 6) return 'Street Number must be at most 6 digits.';
    if (cardForm.postalCode.length !== 5) return 'Zip Code must be 5 digits.';
    if (!RECAPTCHA_SITE_KEY) return 'Missing reCAPTCHA site key (VITE_RECAPTCHA_SITE_KEY).';
    if (!cardForm.recaptchaToken) return 'Please complete reCAPTCHA.';
    return null;
  }


  // ── Place order — build payload, dispatch to saga ─────────────────────────
  function handlePlaceOrder() {
    if (!isLoggedIn) { onSignInClick?.(); return; }

    if (orderType === 'Delivery' && !selectedAddress) {
      setAddrError('Please select the delivery address');
      return;
    }
    setAddrError(null);

    if (!paymentMethod) {
      setLocalError('Please select a payment method to continue.');
      return;
    }

    if (paymentMethod === CARD_PAYMENT_OPTION) {
      const cardValidationError = validateCardForm();
      if (cardValidationError) {
        setLocalError(cardValidationError);
        return;
      }
    }

    setLocalError(null);

    const timeZoneCd = (slugData as any)?.timeZoneCd;
    const etaMinutes = orderType === 'Delivery'
      ? ((slugData as any)?.defaultDeliveryETA ?? 0)
      : ((slugData as any)?.defaultPickUpETA   ?? 0);
    const { etaDate, etaTime } = getEtaInTimeZone(timeZoneCd, etaMinutes);

    const items = cartLines.map((line: any) => {
      const modTotal  = line.modifiers.reduce((s: number, o: any) => s + o.price, 0);
      const unitPrice = line.basePrice + modTotal;
      const subTotal  = (unitPrice * line.qty).toFixed(2);
      const options   = line.modifiers.map((m: any, idx: number) => ({
        modifierOptionId:         m.optionId,
        optionName:               m.optionName,
        quantity:                 1,
        price:                    m.price,
        isOptionModified:         false,
        openCustomizationItem:    false,
        sortOrder:                idx + 1,
        singleItemOptionQuantity: '1',
      }));
      return {
        itemId:      line.itemId,
        itemName:    line.itemName,
        itemAltName: line.itemAltName || '',
        quantity:    String(line.qty),
        price:       unitPrice,
        subTotal,
        comment:     line.comment || '',
        options,
        openItem:    false,
        modifierIds: options.length ? options.map((o: any) => o.modifierOptionId).join(',') : '0',
      };
    });

    let totalsPayload = Array.isArray(reduxTotals) && reduxTotals.length > 0
      ? reduxTotals
      : Array.isArray(totals) && totals.length > 0
        ? totals
        : [
            { code: '1', title: 'Item Total',  value: clientItemTotal.toFixed(2), sortOrder: '1' },
            { code: '5', title: 'Grand Total', value: grandTotalVal,               sortOrder: '9' },
          ];

    // For Delivery — inject estimatedPrice into Delivery Charges (code '4') and
    // recalculate Grand Total (code '5') to include the delivery fee.
    if (orderType === 'Delivery' && estimatedDeliveryFee > 0) {
      const prevDelivery = parseFloat(totalsPayload.find((t) => t.code === '4')?.value || '0');
      const prevGrand    = parseFloat(totalsPayload.find((t) => t.code === '5')?.value || grandTotalVal);
      const newGrand     = (prevGrand - prevDelivery + estimatedDeliveryFee).toFixed(2);

      totalsPayload = totalsPayload.map((t) => {
        if (t.code === '4') return { ...t, value: estimatedDeliveryFee.toFixed(2) };
        if (t.code === '5') return { ...t, value: newGrand };
        return t;
      });
    }

    // Normalize API address fields before building payload
    // postalCd → postalCode, countryCd → country (needed for addressLine1 formatting)
    const normalizedAddr = selectedAddress
      ? {
          ...selectedAddress,
          postalCode: selectedAddress.postalCode || selectedAddress.postalCd || '',
          country:    selectedAddress.country    || selectedAddress.countryCd || 'US',
        }
      : null;
    const addrPayload = orderType === 'Delivery' && normalizedAddr
      ? getAddressLinesForPayload(normalizedAddr)
      : { addressLine1: '', addressLine2: '', addressLine3: '' };

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Guest';

    // Grand total for the order payload — use patched value if delivery fee was applied
    const orderGrandTotal = orderType === 'Delivery' && estimatedDeliveryFee > 0
      ? (totalsPayload.find((t) => t.code === '5')?.value || grandTotalVal)
      : grandTotalVal;

    const orderPayload = {
      locationId,
      customerId:              customerId || '',
      deviceId:                '',
      staffId:                 '',
      fullName,
      email:                   user?.email || '',
      phone:                   user?.mobilePhone || mobilePhone || '',
      totalItems:              String(cartItemCount),
      comment:                 '',
      customNote:              '',
      orderTypeId,
      orderTotal:              orderGrandTotal,
      isScheduleOrder:         false,
      isFreeOrderEvent:        false,
      items,
      totals:                  totalsPayload,
      etaDate,
      etaTime,
      pickUpDate:              etaDate,
      pickUpTime:              etaTime,
      deliveryDate:            etaDate,
      deliveryTime:            etaTime,
      isUtcConversionRequired: true,
      addressLine1:            addrPayload.addressLine1,
      addressLine2:            addrPayload.addressLine2,
      addressLine3:            addrPayload.addressLine3,
      ...(orderType === 'Delivery' && selectedAddress
        ? { addressId: selectedAddress.addressId || selectedAddress.id || '' }
        : {}),
      locationDetails: {
        locationInfo: {
          center: {
            lat: orderType === 'Delivery' ? (selectedAddress?.latitude  || 0) : 0,
            lng: orderType === 'Delivery' ? (selectedAddress?.longitude || 0) : 0,
          },
          text:         orderType === 'Delivery' ? (selectedAddress?.addressLine1 || '') : '',
          addressLine2: addrPayload.addressLine2 || '',
          addressLine3: addrPayload.addressLine3 || '',
        },
      },
      orderSource:       'O',
      guestCount:        1,
      isReceiveTransMsg: 1,
      sortOrder:         0,
    };

    // Hand off to saga — auth token resolution, API call, offline payment,
    // addActiveOrder dispatch, and success/failure handling all happen there
    dispatch(placeOrderRequest({
      orderPayload,
      orderType,
      grandTotal: orderGrandTotal,
      etaDate,
      etaTime,
      paymentMethod,
      cardPayment: paymentMethod === CARD_PAYMENT_OPTION
        ? {
            accountNumber:  cardForm.accountNumber,
            postalCode:     cardForm.postalCode,
            streetCode:     cardForm.streetCode,
            cvv:            cardForm.cvv,
            recaptchaToken: cardForm.recaptchaToken,
            expiryMonth:    cardForm.expiryMonth,
            expiryYear:     cardForm.expiryYear,
            paymentProviderId: PAYMENT_PROVIDER_ID,
            paymentCurrency: resolvePaymentCurrencyFromSlug(slugData),
          }
        : null,
    }));
  }

  // ── Address selection — addressSaga owns the full sequence:
  //    setSelectedAddressId → Totals → (wait) → Quote → Totals ─────────────
  function handleAddressSelect(addr: any) {
    if (quoteLoading) return; // prevent double-click while validating
    setAddrError(null);
    setSelectedAddress(null);
    setPendingAddress(addr);
    dispatch(clearDeliveryQuote());
    dispatch(deliveryQuoteRequest({ addressData: addr }));
  }

  // ── Combined error display (saga error takes priority over local) ─────────
  const displayError = error || localError;

  if (cartLines.length === 0) {
    return (
      <PageBg className="checkout-page">
        <div className="checkout-empty">
          <i className="fa-solid fa-bag-shopping" />
          <p>Your cart is empty.</p>
          <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="checkout-empty__cta">Start Ordering</Link>
        </div>

      </PageBg>
    );
  }

  return (
    <PageBg className="checkout-page">

      <div className="checkout-header">
        <button className="checkout-back" onClick={() => navigate('/cart')} type="button" aria-label="Back to Cart">
          <span className="back-icon" aria-hidden="true" />
        </button>
        <h1 className="checkout-title">Confirm Order</h1>
      </div>

      <main className="checkout-inner">
        <div className="checkout-body">

          {/* ── RIGHT COLUMN ── */}
          <div className="checkout-right">

            {/* Pickup address */}
            {orderType === 'Pickup' && (
              <div className="checkout-card">
                <p className="checkout-card__title">
                  <i className="fas fa-store" /> Pickup Address
                </p>
                <p className="checkout-card__line">
                  {(() => {
                    const branch = getMatchedBranchByMerchantSlug(slugData);
                    return (branch?.branchName as string) || (slugData as any)?.branchName || slugData?.name || '';
                  })()}
                </p>
                <p className="checkout-card__sub">
                  {slugData?.address || ''}
                </p>
              </div>
            )}

            {/* Delivery address — radio cards (only for Delivery + logged in) */}
            {orderType === 'Delivery' && isLoggedIn && (
              <div className="checkout-card">
                <div className="checkout-addr-header">
                  <p className="checkout-card__title">
                    <i className="fas fa-map-marker-alt" /> Delivery Address
                  </p>
                  <button
                    type="button"
                    className="checkout-addr-add-btn"
                    onClick={() => setShowAddressModal(true)}
                  >
                    <i className="fas fa-plus" /> Add New
                  </button>
                </div>

                {/* Loading */}
                {addrLoading && (
                  <div className="checkout-addr-loading">
                    <span className="checkout-spinner" /> Loading addresses…
                  </div>
                )}

                {/* Empty state */}
                {!addrLoading && savedAddresses.length === 0 && (
                  <div className="checkout-addr-empty">
                    <i className="fas fa-location-dot" />
                    <p className="checkout-addr-empty__msg">No saved addresses yet</p>
                    <p className="checkout-addr-empty__sub">
                      Add a delivery address to continue with your order
                    </p>
                  </div>
                )}

                {/* Address radio list */}
                {!addrLoading && savedAddresses.length > 0 && (
                  <ul className="checkout-addr-list">
                    {savedAddresses.map((addr) => {
                      const isSelected  = selectedAddress?.id === addr.id;
                      const isPending   = pendingAddress?.id  === addr.id && quoteLoading;
                      const displayLine = [addr.addressLine1, addr.city, addr.state, addr.postalCd]
                        .filter(Boolean).join(', ');
                      return (
                        <li key={addr.id}>
                          <label
                            className={[
                              'checkout-address__checkbox',
                              isSelected ? 'is-selected' : '',
                              isPending  ? 'is-validating' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleAddressSelect(addr)}
                          >
                            <input
                              type="radio"
                              name="delivery-address"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <span className="checkout-address__check" />
                            <span className="checkout-address__details">
                              <span className="checkout-address__label">
                                {(addr.tag as string) || 'Address'}
                              </span>
                              <span className="checkout-address__value">{displayLine}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Inline address validation error */}
                {addrError && (
                  <Motion.p
                    className="checkout-addr-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <i className="fas fa-circle-exclamation" /> {addrError}
                  </Motion.p>
                )}
              </div>
            )}

            {/* Payment method */}
            <div className="checkout-payment">
              <p className="checkout-card__title">
                <i className="fas fa-credit-card" /> Payment
              </p>

              <div className="checkout-payment__options-row">
                {showOfflinePayment && (
                  <label className={`checkout-payment__option${paymentMethod === paymentOption ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={paymentMethod === paymentOption}
                      onChange={(e) => handlePaymentToggle(paymentOption, e.target.checked)}
                    />
                    <span className="checkout-payment__check" />
                    <span className="checkout-payment__label">{paymentLabel}</span>
                  </label>
                )}

                <label className={`checkout-payment__option${isCardPayment ? ' is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isCardPayment}
                    onChange={(e) => handlePaymentToggle(CARD_PAYMENT_OPTION, e.target.checked)}
                  />
                  <span className="checkout-payment__check" />
                  <span className="checkout-payment__label">Card</span>
                </label>
              </div>

              {isCardPayment && showCardForm && (
                <div className="checkout-card-form">
                  <p className="checkout-card-form__title">Enter Card Detail</p>

                  <label className="checkout-card-form__field">
                    <span>Card Number *</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="i.e, 1234567898765432"
                      value={cardForm.accountNumber}
                      onChange={handleCardDigitsChange('accountNumber', 16)}
                    />
                  </label>

                  <div className="checkout-card-form__row checkout-card-form__row--three">
                    <CheckoutCardDropdown
                      label="Month"
                      placeholder="Month"
                      value={cardForm.expiryMonth}
                      options={expiryMonthDropdownOptions}
                      onChange={(nextValue) => setCardForm((prev) => ({ ...prev, expiryMonth: nextValue }))}
                    />

                    <CheckoutCardDropdown
                      label="Year"
                      placeholder="Year"
                      value={cardForm.expiryYear}
                      options={expiryYearDropdownOptions}
                      onChange={(nextValue) => setCardForm((prev) => ({ ...prev, expiryYear: nextValue }))}
                    />

                    <label className="checkout-card-form__field">
                      <span>CVV *</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="CVV"
                        value={cardForm.cvv}
                        onChange={handleCardDigitsChange('cvv', 4)}
                      />
                    </label>
                  </div>

                  <div className="checkout-card-form__row">
                    <label className="checkout-card-form__field">
                      <span>Street Number *</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={cardForm.streetCode}
                        onChange={handleCardDigitsChange('streetCode', 6)}
                      />
                    </label>

                    <label className="checkout-card-form__field">
                      <span>Zip Code *</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="i.e, 10001"
                        value={cardForm.postalCode}
                        onChange={handleCardDigitsChange('postalCode', 5)}
                      />
                    </label>
                  </div>

                  <div className="checkout-card-form__captcha" ref={recaptchaContainerRef} />

                </div>
              )}
            </div>
          </div>

          {/* ── LEFT COLUMN ── */}
          <div className="checkout-left">

            {/* Items */}
            <div className="checkout-card">
              <p className="checkout-card__title">
                <i className="fa-solid fa-bag-shopping" /> Items ({cartItemCount})
              </p>
              <ul className="checkout-items">
                {cartLines.map((line: any) => {
                  const modTotal  = line.modifiers.reduce((s: number, o: any) => s + o.price, 0);
                  const unitPrice = line.basePrice + modTotal;
                  return (
                    <li key={line.lineId} className="checkout-item">
                      <span className="checkout-item__qty">{line.qty}×</span>
                      <span className="checkout-item__name">{line.itemName}</span>
                      <span className="checkout-item__price">${(unitPrice * line.qty).toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Totals */}
            <div className="checkout-totals">
              <div className="checkout-totals__head">
                <p className="checkout-card__title">Order Summary</p>
                <span className="checkout-totals__type-badge">
                  {orderType === 'Delivery' ? (
                    <span className="checkout-totals__type-icon checkout-totals__type-icon--delivery" aria-hidden="true" />
                  ) : (
                    <i
                      className={`fas fa-${orderType === 'Pickup' ? 'store' : 'utensils'} checkout-totals__type-icon`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{orderTypeLabel}</span>
                </span>
              </div>
              {displayTotals
                .slice()
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                .map((t) => {
                  const val     = parseFloat(t.value);
                  const isGrand = t.code === '5' || t.code === '5.0';
                  if (val === 0 && !isGrand) return null;
                  return (
                    <div key={t.code} className={`checkout-totals__row${isGrand ? ' checkout-totals__row--grand' : ''}`}>
                      <span>{t.title}</span>
                      <span>${val.toFixed(2)}</span>
                    </div>
                  );
                })}
            </div>

            {/* Error */}
            {displayError && (
              <Motion.div
                className="checkout-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <i className="fas fa-exclamation-circle" /> {displayError}
              </Motion.div>
            )}

            {/* Place order CTA */}
            <button
              className="checkout-cta"
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing
                ? <><span className="checkout-spinner" /> Placing Order…</>
                : <>Place Order — ${grandTotalVal}</>
              }
            </button>
            <p className="checkout-note">
              By placing this order you agree to our terms &amp; conditions.
            </p>
          </div>

        </div>
      </main>

      

      {/* Add New Address modal — inline within Checkout */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />

      {/* Delivery quote failure toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </PageBg>
  );
}


