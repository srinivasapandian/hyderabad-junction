import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './types';
import Header from './components/header/header';
import InfoSection from './components/infoSection/InfoSection';
import Footer from './components/footer/footer';
import Home from './pages/website/home/Home';
import Menu from './pages/website/menu/menu';
import Ordering from './pages/ordering/ordering/ordering';
import About from './pages/website/about/about';
import Contact from './pages/website/contact/contact';
import Account from './pages/ordering/account/Account';
import Cart from './pages/ordering/cart/Cart';
import MenuCategoryRouter from './pages/website/menuCategory/MenuCategoryRouter';
import AuthModal from './components/authModal/AuthModal';
import FloatingCart from './components/floatingCart/FloatingCart';
import ScrollToTop from './components/scrollToTop/ScrollToTop';
import Checkout from './pages/ordering/checkout/Checkout';
import Orders from './pages/ordering/orders/Orders';
import OrderTracking from './pages/ordering/order-tracking/OrderTracking';
import Favourites    from './pages/ordering/favourites/Favourites';
import SavedAddress  from './pages/ordering/savedAddress/SavedAddress';
import ActiveOrdersBar from './components/ActiveOrdersBar/ActiveOrdersBar';
import { getSlugRequest } from './redux/slug/slugActions';
import './App.css';
import ReservationPage from './pages/ordering/reservation/Reservation';
import ItemDetailPage from './pages/ordering/itemDetail/ItemDetailPage';
import PoliciesLayout from './pages/ordering/policies/PoliciesLayout';
import PolicyPage from './pages/ordering/policies/PolicyPage';
import { POLICY_TABS } from './utils/policiesConfig';
import Blog from './pages/website/blog/Blog';
import { isReservationEnabledByBranch, LOCATION_SLUG } from './utils/branchConfig';
// import BottomNav from './components/bottomNav/BottomNav';

function Layout(): React.JSX.Element {
  return (
    <>
      <Header />
      <Outlet />
      <InfoSection />
      <Footer />
      {/* <BottomNav /> */}
    </>
  );
}

function App(): React.JSX.Element {
  const dispatch = useDispatch();
  const slugData = useSelector((s: RootState) => s.slug.data);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);

  const openAuthModal  = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  useEffect(() => {
    dispatch(getSlugRequest());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                                   element={<Home onSignInClick={openAuthModal} />} />

          {/* ── Menu ── */}
          <Route path="/indian-restaurant-menu"             element={<Menu />} />
          <Route path="/indian-restaurant-menu/:categorySlug"        element={<MenuCategoryRouter />} />
          <Route path="/indian-restaurant-menu/:categorySlug/:itemSlug" element={<ItemDetailPage />} />

          {/* ── Ordering ── */}
          <Route path={`/order-online/${LOCATION_SLUG}`}                          element={<Navigate to={`/order-online/${LOCATION_SLUG}/pickup`} replace />} />
          <Route path={`/order-online/${LOCATION_SLUG}/:orderType`}             element={<Ordering />} />
          <Route path={`/order-online/${LOCATION_SLUG}/:orderType/:categorySlug`} element={<Ordering />} />

          {/* ── Static pages ── */}
          <Route path="/about-us"      element={<About />} />
          <Route path="/blog"          element={<Blog />} />
          <Route path="/contact"       element={<Contact />} />
          <Route path="/account"       element={<Account onSignInClick={openAuthModal} />} />
          <Route path="/cart"          element={<Cart onSignInClick={openAuthModal} />} />
          <Route path="/checkout"      element={<Checkout onSignInClick={openAuthModal} />} />
          <Route path="/orders"        element={<Orders onSignInClick={openAuthModal} />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/favourites"     element={<Favourites />} />
          <Route path="/saved-address"  element={<SavedAddress onSignInClick={openAuthModal} />} />
          <Route
            path="/reservation"
            element={isReservationEnabled ? <ReservationPage /> : <Navigate to="/" replace />}
          />

          {/* ── Terms & Policies ── */}
          <Route element={<PoliciesLayout />}>
            {POLICY_TABS.map((tab) => (
              <Route key={tab.path} path={tab.path} element={<PolicyPage />} />
            ))}
          </Route>

          {/* ── Legacy redirects (backward compat) ── */}
          <Route path="/about"                   element={<Navigate to="/about-us" replace />} />
          <Route path="/menu"                    element={<Navigate to="/indian-restaurant-menu" replace />} />
          <Route path="/menu/:categorySlug"      element={<Navigate to="/indian-restaurant-menu/:categorySlug" replace />} />
          <Route path="/ordering"                element={<Navigate to={`/order-online/${LOCATION_SLUG}/pickup`} replace />} />
          <Route path="/ordering/:orderType"     element={<Navigate to={`/order-online/${LOCATION_SLUG}/:orderType`} replace />} />
          <Route path="/item-detail"             element={<ItemDetailPage />} />
        </Route>
      </Routes>
      <FloatingCart />
      <ActiveOrdersBar />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
    </BrowserRouter>
  );
}

export default App;
