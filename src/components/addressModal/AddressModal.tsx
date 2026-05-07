import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { saveAddressRequest, updateAddressRequest } from '../../redux/address/addressActions';
import './AddressModal.css';
import type { Address, RootState } from '../../types';

const TAGS = ['Home', 'Work', 'Business', 'Custom'] as const;

interface AddressFormData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCd: string;
  latitude: number;
  longitude: number;
  tag: string;
  customTag: string;
}

const emptyForm: AddressFormData = {
  addressLine1: '',
  addressLine2: '',
  city:         '',
  state:        '',
  postalCd:     '',
  latitude:     0,
  longitude:    0,
  tag:          'Home',
  customTag:    '',
};

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Extract structured fields from Google address_components
function parseComponents(components: GoogleAddressComponent[]) {
  const get      = (type: string): string => components.find((c) => c.types.includes(type))?.long_name  || '';
  const getShort = (type: string): string => components.find((c) => c.types.includes(type))?.short_name || '';
  return {
    streetNumber: get('street_number'),
    route:        get('route'),
    city:         get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
    state:        get('administrative_area_level_1'),
    postalCd:     get('postal_code'),
    country:      getShort('country'),
  };
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAddress?: Address | null;
}

export default function AddressModal({ isOpen, onClose, editAddress = null }: AddressModalProps) {
  const dispatch = useDispatch();
  const { customerId } = useSelector((s: RootState) => s.auth);
  const { mutating, mutateError } = useSelector((s: RootState) => s.address);

  const [form,          setForm]          = useState<AddressFormData>(emptyForm);
  const [fieldErrors,   setFieldErrors]   = useState<Record<string, string>>({});
  const [geoBlocked,    setGeoBlocked]    = useState(false);
  const [editingTag,    setEditingTag]    = useState(false);
  // #11 — track whether a save was initiated in this modal session
  const [saveAttempted, setSaveAttempted] = useState(false);
  const wasMutatingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // #11 — close on save success; surface API error without closing
  useEffect(() => {
    if (saveAttempted && wasMutatingRef.current && !mutating) {
      if (!mutateError) onClose(); // success → close
      // failure → stay open; mutateError renders below
    }
    wasMutatingRef.current = mutating;
  }, [mutating, mutateError, saveAttempted, onClose]);

  // ── Google Places Autocomplete ─────────────────────────────────────────────
  const {
    ready,
    value:       searchValue,
    suggestions: { status, data: suggestions },
    setValue:    setSearchValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ['address'], componentRestrictions: { country: 'us' } },
    debounce: 300,
  });

  // ── Populate on open ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editAddress) {
      const editTag = (editAddress as Record<string, unknown>).tag as string || 'Home';
      setForm({
        addressLine1: editAddress.addressLine1 || '',
        addressLine2: editAddress.addressLine2 || '',
        city:         editAddress.city         || '',
        state:        editAddress.state        || '',
        postalCd:     editAddress.postalCd     || '',
        latitude:     editAddress.latitude     || 0,
        longitude:    editAddress.longitude    || 0,
        tag:          editTag,
        customTag:    (TAGS as readonly string[]).includes(editTag) ? '' : editTag,
      });
      setSearchValue('', false); // location field empty on edit
    } else {
      setForm(emptyForm);
      setSearchValue('', false);
    }
    setFieldErrors({});
    setGeoBlocked(false);
    setSaveAttempted(false);
    wasMutatingRef.current = false;
  }, [isOpen, editAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Select a suggestion ───────────────────────────────────────────────────
  const handleSelect = async (description: string) => {
    setSearchValue(description, false);
    clearSuggestions();
    setFieldErrors({});  // #10 — clear all stale errors immediately on any new selection
    try {
      const results      = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      const comps        = parseComponents(results[0].address_components);
      const street       = [comps.streetNumber, comps.route].filter(Boolean).join(' ');

      setForm((prev) => ({
        ...prev,
        addressLine1: street || description,
        city:         comps.city,
        state:        comps.state,
        postalCd:     comps.postalCd,
        latitude:     lat,
        longitude:    lng,
      }));
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  // ── Current location ──────────────────────────────────────────────────────
  const handleUseLocation = () => {
    if (!navigator.geolocation) { setGeoBlocked(true); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const results = await getGeocode({ location: { lat, lng } });
          const comps   = parseComponents(results[0].address_components);
          const street  = [comps.streetNumber, comps.route].filter(Boolean).join(' ');

          setSearchValue(results[0].formatted_address, false);
          setForm((prev) => ({
            ...prev,
            addressLine1: street || results[0].formatted_address,
            city:         comps.city,
            state:        comps.state,
            postalCd:     comps.postalCd,
            latitude:     lat,
            longitude:    lng,
          }));
          setFieldErrors({});  // #10 — clear all stale errors on location fill
        } catch (err) {
          console.error('Reverse geocode error:', err);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoBlocked(true);
        else setFieldErrors((p) => ({ ...p, location: 'Unable to get your location. Please enter manually.' }));
      },
    );
  };

  // ── Clear search ──────────────────────────────────────────────────────────
  const handleClearSearch = () => {
    setSearchValue('', false);
    clearSuggestions();
    setFieldErrors({});  // #10 — user is starting over; wipe all stale errors
    inputRef.current?.focus();
  };

  // ── Tag selection ─────────────────────────────────────────────────────────
  const handleTagSelect = (tag: string) => {
    setForm((prev) => ({ ...prev, tag, customTag: tag === 'Custom' ? prev.customTag : '' }));
    if (tag !== 'Custom') setEditingTag(false);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!form.addressLine1.trim()) errors.addressLine1 = 'Address Line 1 is required.';
    if (!form.city.trim())         errors.city         = 'City is required.';
    if (!form.state.trim())        errors.state        = 'State is required.';
    if (!form.postalCd.trim())     errors.postalCd     = 'Zipcode is required.';

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    const finalTag = form.tag === 'Custom'
      ? (form.customTag.trim() || 'Custom')
      : form.tag;

    const payload = {
      customerId,
      tag:          finalTag,
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city:         form.city.trim(),
      state:        form.state.trim(),
      latitude:     form.latitude,
      longitude:    form.longitude,
      postalCd:     form.postalCd.trim(),
      countryCd:    'US',
    };

    setSaveAttempted(true);  // #11 — arm the mutating watcher
    if (editAddress) {
      dispatch(updateAddressRequest({ addressId: editAddress.id, id: editAddress.id, ...payload }));
    } else {
      dispatch(saveAddressRequest(payload));
    }
    // onClose() is intentionally removed — the mutating useEffect closes on success
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div className="addr-modal__backdrop" onClick={onClose}>
      <div className="addr-modal__box" onClick={(e) => e.stopPropagation()}>

        <h2 className="addr-modal__title">Delivery Address</h2>

        {/* ── Location search ── */}
        <div className="addr-modal__field">
          <label className="addr-modal__label">
            Enter your location <span className="addr-modal__req">*</span>
          </label>
          <div className="addr-modal__search-wrap">
            <i className="fas fa-map-marker-alt addr-modal__search-pin" />
            <input
              ref={inputRef}
              className="addr-modal__search-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search address…"
              disabled={!ready}
              autoComplete="off"
            />
            {searchValue && (
              <button
                className="addr-modal__search-clear"
                onClick={handleClearSearch}
                type="button"
                tabIndex={-1}
              >
                <i className="fas fa-times" />
              </button>
            )}
            <button
              className="addr-modal__search-geo"
              onClick={handleUseLocation}
              type="button"
              title="Use current location"
            >
              <i className="fas fa-crosshairs" />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {status === 'OK' && suggestions.length > 0 && (
            <ul className="addr-modal__suggestions">
              {suggestions.map(({ place_id, description }) => (
                <li
                  key={place_id}
                  className="addr-modal__suggestion"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(description); }}
                >
                  <i className="fas fa-map-marker-alt addr-modal__suggestion-pin" />
                  {description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Address fields ── */}
        <div className="addr-modal__row addr-modal__row--2">
          <div className="addr-modal__field">
            <label className="addr-modal__label">
              Address Line 1 <span className="addr-modal__req">*</span>
            </label>
            <input
              className={`addr-modal__input${fieldErrors.addressLine1 ? ' is-error' : ''}`}
              value={form.addressLine1}
              onChange={(e) => {
                setForm((p) => ({ ...p, addressLine1: e.target.value }));
                setFieldErrors((p) => ({ ...p, addressLine1: '' }));
              }}
              placeholder="Street address"
            />
            <span className="addr-modal__field-error">{fieldErrors.addressLine1 || ''}</span>
          </div>
          <div className="addr-modal__field">
            <label className="addr-modal__label">Apartment / Suite</label>
            <input
              className="addr-modal__input"
              value={form.addressLine2}
              onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))}
              placeholder="Apt, Suite, Floor…"
            />
          </div>
        </div>

        <div className="addr-modal__row addr-modal__row--3">
          <div className="addr-modal__field">
            <label className="addr-modal__label">
              City <span className="addr-modal__req">*</span>
            </label>
            <input
              className={`addr-modal__input${fieldErrors.city ? ' is-error' : ''}`}
              value={form.city}
              onChange={(e) => {
                setForm((p) => ({ ...p, city: e.target.value }));
                setFieldErrors((p) => ({ ...p, city: '' }));
              }}
            />
            <span className="addr-modal__field-error">{fieldErrors.city || ''}</span>
          </div>
          <div className="addr-modal__field">
            <label className="addr-modal__label">
              State <span className="addr-modal__req">*</span>
            </label>
            <input
              className={`addr-modal__input${fieldErrors.state ? ' is-error' : ''}`}
              value={form.state}
              onChange={(e) => {
                setForm((p) => ({ ...p, state: e.target.value }));
                setFieldErrors((p) => ({ ...p, state: '' }));
              }}
            />
            <span className="addr-modal__field-error">{fieldErrors.state || ''}</span>
          </div>
          <div className="addr-modal__field">
            <label className="addr-modal__label">
              Zipcode <span className="addr-modal__req">*</span>
            </label>
            <input
              className={`addr-modal__input${fieldErrors.postalCd ? ' is-error' : ''}`}
              value={form.postalCd}
              maxLength={5}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                setForm((p) => ({ ...p, postalCd: val }));
                setFieldErrors((p) => ({ ...p, postalCd: '' }));
              }}
            />
            <span className="addr-modal__field-error">{fieldErrors.postalCd || ''}</span>
          </div>
        </div>

        {/* ── Address tag ── */}
        <div className="addr-modal__field">
          <label className="addr-modal__label">
            Address Tag <span className="addr-modal__req">*</span>
          </label>
          <div className="addr-modal__tags">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`addr-modal__tag${form.tag === tag ? ' is-active' : ''}`}
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </button>
            ))}
            {form.tag === 'Custom' && (
              <button
                type="button"
                className="addr-modal__tag-edit"
                onClick={() => setEditingTag(true)}
                title="Edit custom tag"
              >
                <i className="fas fa-pen" />
              </button>
            )}
          </div>
          {form.tag === 'Custom' && editingTag && (
            <input
              className="addr-modal__input addr-modal__input--tag"
              value={form.customTag}
              onChange={(e) => setForm((p) => ({ ...p, customTag: e.target.value }))}
              placeholder="Enter custom tag name"
              autoFocus
              onBlur={() => setEditingTag(false)}
            />
          )}
        </div>

        {/* ── Saga / API level error — only shown after a save attempt in this session ── */}
        {saveAttempted && mutateError && (
          <p className="addr-modal__error">
            <i className="fas fa-exclamation-circle" /> {mutateError}
          </p>
        )}

        {/* ── Actions ── */}
        <div className="addr-modal__actions">
          <button className="addr-modal__btn addr-modal__btn--cancel" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="addr-modal__btn addr-modal__btn--save"
            onClick={handleSave}
            type="button"
            disabled={mutating}
          >
            {mutating && <span className="addr-modal__spinner" />}
            {editAddress ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Geo blocked overlay ── */}
      {geoBlocked && (
        <div className="addr-modal__geo-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="addr-modal__geo-box">
            <button className="addr-modal__geo-close" onClick={() => setGeoBlocked(false)} type="button">
              <i className="fas fa-times" />
            </button>
            <i className="fas fa-map-marker-alt addr-modal__geo-icon" />
            <h3 className="addr-modal__geo-title">Enable your Location</h3>
            <p className="addr-modal__geo-text">
              Please enable location access in your browser settings to auto-fill your address.
            </p>
            <button
              className="addr-modal__btn addr-modal__btn--save"
              type="button"
              onClick={() => { setGeoBlocked(false); inputRef.current?.focus(); }}
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
