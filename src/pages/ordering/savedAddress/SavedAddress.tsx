import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, Address } from '../../../types';
import AddressModal from '../../../components/addressModal/AddressModal';
import { fetchAddressRequest, deleteAddressRequest } from '../../../redux/address/addressActions';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import AddressCardShimmerGrid from '../../../shimmer/AddressCardShimmer/AddressCardShimmer';
import PageBg from '../../../components/pageBg/PageBg';
import editSvg   from '../../../assets/svg/edit.svg';
import deleteSvg from '../../../assets/svg/delete.svg';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import './SavedAddress.css';

interface SavedAddressProps {
  onSignInClick?: () => void;
}

export default function SavedAddress({ onSignInClick }: SavedAddressProps) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { isLoggedIn, customerId } = useSelector((s: RootState) => s.auth);
  const { addresses, loading, error, mutating } = useSelector((s: RootState) => s.address);

  const [modalOpen,    setModalOpen]    = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editAddress,  setEditAddress]  = useState<any>(null);  // null = add mode, object = edit mode

  // Fetch on mount if logged in
  useEffect(() => {
    if (isLoggedIn && customerId) {
      dispatch(fetchAddressRequest(customerId));
    }
  }, [isLoggedIn, customerId, dispatch]);

  const openAddModal = () => {
    setEditAddress(null);
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditModal = (addr: any) => {
    setEditAddress(addr);
    setModalOpen(true);
  };

  const handleDelete = (addressId: string) => {
    dispatch(deleteAddressRequest(addressId));
  };

  return (
    <PageBg className="sa-page">

      <div className="sa-header">
        <div className="sa-header__left">
          <button className="sa-back" onClick={() => navigate('/account')} type="button" aria-label="Back to Account">
            <span className="back-icon" aria-hidden="true" />
          </button>
          <h1 className="sa-title">Delivery Address</h1>
        </div>
        {isLoggedIn && (
          <button className="sa-btn sa-btn--add" onClick={openAddModal} type="button">
            <i className="fas fa-plus" /> Add New
          </button>
        )}
      </div>

      <main className="sa-inner">

        {/* ── Not logged in ── */}
        {!isLoggedIn && (
          <div className="sa-empty">
            <div className="sa-empty__icon">
              <i className="fas fa-map-marker-alt" />
            </div>
            <h2 className="sa-empty__title">Sign in to manage addresses</h2>
            <p className="sa-empty__sub">
              Save your delivery addresses for faster checkout.
            </p>
            <button className="sa-btn sa-btn--solid" onClick={onSignInClick}>
              <i className="fas fa-sign-in-alt" /> Sign In
            </button>
          </div>
        )}

        {/* ── Logged in ── */}
        {isLoggedIn && (
          <div className="sa-content">

                        {/* Loading */}
            {loading && <AddressCardShimmerGrid />}

            {/* Error */}
            {!loading && error && (
              <div className="sa-error">
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}

            {/* No addresses */}
            {!loading && !error && addresses.length === 0 && (
              <div className="sa-empty">
                <div className="sa-empty__icon">
                  <i className="fas fa-map-marker-alt" />
                </div>
                <h2 className="sa-empty__title">No saved addresses yet</h2>
                <p className="sa-empty__sub">
                  Add a delivery address to speed up checkout.
                </p>
                <button className="sa-btn sa-btn--solid" onClick={openAddModal}>
                  <i className="fas fa-plus" /> Add Address
                </button>
              </div>
            )}

            {/* Address list */}
            {!loading && addresses.length > 0 && (
              <ul className="sa-list">
                {addresses.map((addr) => (
                  <li key={addr.id} className="sa-card">
                    <div className="sa-card__body">
                      <span className="sa-card__tag">
                        <i className="fas fa-map-marker-alt" />
                        {(addr.tag as string) || 'Address'}
                      </span>
                      <p className="sa-card__line">{addr.addressLine1}</p>
                      {addr.addressLine2 && (
                        <p className="sa-card__line">{addr.addressLine2}</p>
                      )}
                      <p className="sa-card__line">
                        {[addr.city, addr.state, addr.postalCd].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="sa-card__actions">
                      <button
                        className="sa-action-btn"
                        title="Edit address"
                        type="button"
                        onClick={() => openEditModal(addr)}
                        disabled={mutating}
                      >
                        <img src={editSvg} alt="" />
                        <span>Edit</span>
                      </button>

                      <button
                        className="sa-action-btn sa-action-btn--delete"
                        title="Delete address"
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        disabled={mutating}
                      >
                        <img src={deleteSvg} alt="" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      

      <CtaStrip
        overline="Ready to Order?"
        heading="Order Your Favorites Online"
        btnLabel="Order Online"
        btnHref={`/order-online/${LOCATION_SLUG}/pickup`}
      />

      {/* ── Address modal ── */}
      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editAddress={editAddress}
      />
    </PageBg>
  );
}

