import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../types';
import { logout } from '../../../redux/auth/authActions';
import discoverSvg from '../../../assets/svg/discover.svg';
import orderListSvg from '../../../assets/svg/orderList.svg';
import cartSvg from '../../../assets/svg/cart.svg';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import PageBg from '../../../components/pageBg/PageBg';
import PageBanner from '../../../components/pageBanner/PageBanner';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import './Account.css';

interface AccountProps {
  onSignInClick?: () => void;
}

function Account({ onSignInClick }: AccountProps) {
  const dispatch = useDispatch();
  const { isLoggedIn, user, mobilePhone } = useSelector((s: RootState) => s.auth);

  const displayName = isLoggedIn
    ? (user?.name?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || mobilePhone || 'User')
    : 'Guest User';

  const displaySub = isLoggedIn
    ? [user?.mobilePhone || mobilePhone, user?.email].filter(Boolean).join(' \u00B7 ')
    : 'Sign in to access your account';

  const profilePhone = user?.mobilePhone || mobilePhone;
  const profileEmail = user?.email;

  const handleSignOut = () => dispatch(logout());

  return (
    <PageBg className="ac-page">
      <PageBanner title="My Account" backgroundImage={BANNER_IMAGES.account} />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CONTENT WRAP Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="ac-bg-wrap">
        <div className="ac-bg-scrim" />

        <section className="ac-sec">
          <div className="ac-ctr">

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Profile Card Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="ac-profile-card">
              <div className="ac-profile-card__left">
                <div className="ac-avatar">
                  <i className="fas fa-user" />
                </div>
                <div className="ac-profile-info">
                  <p className="ac-overline ac-overline--sm">
                    {isLoggedIn ? 'Member' : 'Guest'}
                  </p>
                  <h2 className="ac-profile-name">{displayName}</h2>
                  {displaySub && (
                    <p className="ac-profile-sub">
                      {isLoggedIn ? (
                        <>
                          {profilePhone && <span className="ac-profile-sub__line">{profilePhone}</span>}
                          {profilePhone && profileEmail && (
                            <span className="ac-profile-sub__sep" aria-hidden="true">&middot;</span>
                          )}
                          {profileEmail && <span className="ac-profile-sub__line">{profileEmail}</span>}
                        </>
                      ) : (
                        displaySub
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="ac-profile-card__right">
                {isLoggedIn ? (
                  <button className="ac-btn ac-btn--outline ac-btn--signout" onClick={handleSignOut}>
                    <i className="fas fa-sign-out-alt" />
                    Sign Out
                  </button>
                ) : (
                  <div className="ac-guest-actions">
                    <button className="ac-btn ac-btn--solid" onClick={onSignInClick}>
                      <i className="fas fa-sign-in-alt" />
                      Sign In
                    </button>
                    <button className="ac-btn ac-btn--outline ac-btn--create" onClick={onSignInClick}>
                      <i className="fas fa-user-plus" />
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Section heading Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="ac-sec-head">
              <p className="ac-overline">Quick Access</p>
              <h2 className="ac-h2">Your Account</h2>
              <div className="ac-sec-head__bar" />
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tiles Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="ac-tiles">
              <Link to="/orders" className="ac-tile">
                <div className="ac-tile__icon">
                  <img src={orderListSvg} alt="" className="ac-tile__svg" />
                </div>
                <div className="ac-tile__body">
                  <h3 className="ac-tile__label">My Orders</h3>
                  <p className="ac-tile__desc">View your order history and track active orders</p>
                </div>
                <i className="fas fa-arrow-right ac-tile__arrow" />
              </Link>

              <Link to="/favourites" className="ac-tile">
                <div className="ac-tile__icon">
                  <i className="fas fa-heart" />
                </div>
                <div className="ac-tile__body">
                  <h3 className="ac-tile__label">Favourites</h3>
                  <p className="ac-tile__desc">Your saved dishes and favourite menu items</p>
                </div>
                <i className="fas fa-arrow-right ac-tile__arrow" />
              </Link>

              <Link to="/indian-restaurant-menu" className="ac-tile">
                <div className="ac-tile__icon">
                  <img src={discoverSvg} alt="" className="ac-tile__svg" />
                </div>
                <div className="ac-tile__body">
                  <h3 className="ac-tile__label">Explore Menu</h3>
                  <p className="ac-tile__desc">Browse our full range of authentic Indian dishes</p>
                </div>
                <i className="fas fa-arrow-right ac-tile__arrow" />
              </Link>

              <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="ac-tile">
                <div className="ac-tile__icon">
                  <img src={cartSvg} alt="" className="ac-tile__svg" />
                </div>
                <div className="ac-tile__body">
                  <h3 className="ac-tile__label">Order Online</h3>
                  <p className="ac-tile__desc">Place a new order for pickup or delivery</p>
                </div>
                <i className="fas fa-arrow-right ac-tile__arrow" />
              </Link>

              <Link to="/saved-address" className="ac-tile">
                <div className="ac-tile__icon">
                  <i className="fas fa-map-marker-alt" />
                </div>
                <div className="ac-tile__body">
                  <h3 className="ac-tile__label">Saved Addresses</h3>
                  <p className="ac-tile__desc">Manage your saved delivery addresses</p>
                </div>
                <i className="fas fa-arrow-right ac-tile__arrow" />
              </Link>
            </div>

          </div>
        </section>

        <CtaStrip
          overline={isLoggedIn ? "Ready to Order?" : "New Here?"}
          heading={isLoggedIn ? "Order Your Favorites Online" : "Sign In to Unlock the Full Experience"}
          btnLabel={isLoggedIn ? "Order Online" : "Get Started"}
          btnHref={isLoggedIn ? `/order-online/${LOCATION_SLUG}/pickup` : undefined}
          onBtnClick={isLoggedIn ? undefined : onSignInClick}
        />

      </div>

      
    </PageBg>
  );
}

export default Account;

