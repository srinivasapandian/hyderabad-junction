/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../types';
import placeHolderMedia from '../../../assets/placeHolderMedia.jpg';
import {
  fetchSlotsRequest,
  createReservationRequest,
  cancelReservationRequest,
  resetReservation,
  clearSlots,
} from '../../../redux/reservation/reservationActions';
import PageBg from '../../../components/pageBg/PageBg';
import checkboxSelect   from '../../../assets/svg/checkboxSelect.svg';
import checkboxUnSelect from '../../../assets/svg/checkboxUnSelect.svg';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import './Reservation.css';

interface ReservationForm {
  countryCode: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  seatPref: string;
  occasion: string;
  smsConsent: boolean;
}

interface CountryCode {
  code: string;
  label: string;
  country: string;
  maxLen: number;
}

interface SectionDetail {
  id: string;
  sectionName: string;
  isEnabled?: number | boolean;
  enabled?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════════════ */

const MONTHS: string[]     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT: string[] = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const CANCEL_REASONS: string[] = ['Sudden Change of plans','Companion Delay','Dietary Restrictions','Feeling Unwell','Location Mismatch','Other'];
const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', label: '🇺🇸 +1', country: 'United States', maxLen: 10 },
  { code: '+91', label: '🇮🇳 +91', country: 'India', maxLen: 10 },
  { code: '+44', label: '🇬🇧 +44', country: 'United Kingdom', maxLen: 10 },
  { code: '+61', label: '🇦🇺 +61', country: 'Australia', maxLen: 9 },
  { code: '+971', label: '🇦🇪 +971', country: 'UAE', maxLen: 9 },
  { code: '+966', label: '🇸🇦 +966', country: 'Saudi Arabia', maxLen: 9 },
  { code: '+65', label: '🇸🇬 +65', country: 'Singapore', maxLen: 8 },
  { code: '+60', label: '🇲🇾 +60', country: 'Malaysia', maxLen: 10 },
  { code: '+974', label: '🇶🇦 +974', country: 'Qatar', maxLen: 8 },
  { code: '+968', label: '🇴🇲 +968', country: 'Oman', maxLen: 8 },
  { code: '+973', label: '🇧🇭 +973', country: 'Bahrain', maxLen: 8 },
  { code: '+965', label: '🇰🇼 +965', country: 'Kuwait', maxLen: 8 },
  { code: '+977', label: '🇳🇵 +977', country: 'Nepal', maxLen: 10 },
  { code: '+94', label: '🇱🇰 +94', country: 'Sri Lanka', maxLen: 9 },
  { code: '+880', label: '🇧🇩 +880', country: 'Bangladesh', maxLen: 10 },
  { code: '+49', label: '🇩🇪 +49', country: 'Germany', maxLen: 11 },
  { code: '+33', label: '🇫🇷 +33', country: 'France', maxLen: 9 },
  { code: '+81', label: '🇯🇵 +81', country: 'Japan', maxLen: 10 },
  { code: '+82', label: '🇰🇷 +82', country: 'South Korea', maxLen: 10 },
  { code: '+86', label: '🇨🇳 +86', country: 'China', maxLen: 11 },
];
const DEFAULT_COUNTRY: CountryCode = COUNTRY_CODES[0];
const MEDIA_CDN = (import.meta.env.VITE_IMAGE_URL as string)?.replace(/\/$/, '') ?? '';

function toISODate(date: Date | null): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function formatLongDate(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(`${dateStr}T12:00:00`) : dateStr;
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
}

function convertTo24(timeStr: string | null): string {
  if (!timeStr) return '12:00:00';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '12:00:00';
  const [, hStr, mins, ap] = match;
  let h = parseInt(hStr, 10);
  if (ap.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mins}:00`;
}

function splitPhoneWithCountry(rawPhone: string | null | undefined): { country: CountryCode; number: string } {
  if (!rawPhone) return { country: DEFAULT_COUNTRY, number: '' };

  const trimmed = String(rawPhone).trim();
  let code = '';
  let number = trimmed;

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    code = parts[0];
    number = parts.slice(1).join('-');
  } else if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    const match = sorted.find((c) => trimmed.startsWith(c.code));
    if (match) {
      code = match.code;
      number = trimmed.slice(match.code.length);
    }
  }

  const digits = number.replace(/\D/g, '');
  const country = COUNTRY_CODES.find((c) => c.code === code) || DEFAULT_COUNTRY;

  return { country, number: digits };
}

function buildCalendarUrl(provider: string, { title, location, description, start, end }: { title: string; location: string; description: string; start: Date; end: Date }): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  switch (provider) {
    case 'google':
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    case 'outlook':
      return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    case 'yahoo':
      return `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&st=${fmt(start)}&et=${fmt(end)}&desc=${encodeURIComponent(description)}&in_loc=${encodeURIComponent(location)}`;
    case 'ical': {
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nDESCRIPTION:${description}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
      return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
    }
    default: return '#';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP INDICATOR
═══════════════════════════════════════════════════════════════════════════ */

const STEP_LABELS = ['Book', 'Your Details', 'Confirmed'];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="res-steps">
      {STEP_LABELS.map((label, i) => {
        const num   = i + 1;
        const done  = step > num;
        const active = step === num;
        return (
          <div key={label} className="res-steps__item">
            <div className={`res-steps__badge${active ? ' active' : ''}${done ? ' done' : ''}`}>
              {done ? <i className="fa-solid fa-check" /> : num}
            </div>
            <span className={`res-steps__label${active ? ' active' : ''}${done ? ' done' : ''}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`res-steps__line${done ? ' done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE CALENDAR
═══════════════════════════════════════════════════════════════════════════ */

function InlineCalendar({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (date: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow     = new Date(viewYear, viewMonth, 1).getDay();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const emptyCells = Array(startDow).fill(null);
  const dayCells   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="res-calendar">
      <div className="res-calendar__nav">
        <button className="res-calendar__nav-btn" onClick={prevMonth} type="button">‹</button>
        <span className="res-calendar__month">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="res-calendar__nav-btn" onClick={nextMonth} type="button">›</button>
      </div>

      <div className="res-calendar__grid">
        {DAYS_SHORT.map(d => (
          <div key={d} className="res-calendar__header-cell">{d}</div>
        ))}
        {emptyCells.map((_, i) => (
          <div key={`e-${i}`} className="res-calendar__cell empty" />
        ))}
        {dayCells.map(day => {
          const cellDate  = new Date(viewYear, viewMonth, day);
          const isPast    = cellDate < today;
          const isToday   = cellDate.getTime() === today.getTime();
          const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
          return (
            <button
              key={day}
              type="button"
              className={`res-calendar__cell${isPast ? ' past' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => !isPast && onSelect(cellDate)}
              disabled={isPast}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIME SLOTS
═══════════════════════════════════════════════════════════════════════════ */

interface TimeSlotsProps {
  slots: unknown;
  slotsLoading: boolean;
  slotsError: string | null;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  selectedDate: Date | null;
}

function TimeSlots({ slots, slotsLoading, slotsError, selectedTime, onSelect, selectedDate }: TimeSlotsProps) {
  if (!selectedDate) {
    return (
      <div className="res-slots">
        <p className="res-slots__prompt">
          <i className="fa-regular fa-calendar" /> Select a date to see available times
        </p>
      </div>
    );
  }

  if (slotsLoading) {
    return (
      <div className="res-slots">
        <div className="res-slots__loading"><span className="res-spinner" /></div>
      </div>
    );
  }

  const dateKey = toISODate(selectedDate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotsAny = slots as any;
  let sessionSlots: any[] = [];
  if (Array.isArray(slotsAny)) {
    const day = slotsAny.find((d: any) => d?.date === dateKey) || slotsAny[0];
    sessionSlots = (day?.sessions || []).flatMap((s: any) => s.slots || []);
  } else if (slotsAny?.sessions) {
    sessionSlots = (slotsAny.sessions || []).flatMap((s: any) => s.slots || []);
  } else if (slotsAny?.data?.sessions) {
    sessionSlots = (slotsAny.data.sessions || []).flatMap((s: any) => s.slots || []);
  }

  const slotTimes = sessionSlots
    .filter((s: any) => s == null ? false : (typeof s === 'string' ? true : (s.available !== false)))
    .map((s: any) => (typeof s === 'string' ? s : s.time))
    .filter(Boolean);

  if (!slotTimes.length) {
    return (
      <div className="res-slots">
        <p className="res-slots__none">
          <i className="fa-regular fa-clock" /> No available times for this date
        </p>
      </div>
    );
  }

  return (
    <div className="res-slots">
      <div className="res-slots__pills">
        {slotTimes.map((time: string) => (
          <button
            key={time}
            type="button"
            className={`res-slots__pill${selectedTime === time ? ' selected' : ''}`}
            onClick={() => onSelect(time)}
          >
            {selectedTime === time && <i className="fa-solid fa-check res-slots__pill-check" />}
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING SUMMARY BAR (Step 2 top)
═══════════════════════════════════════════════════════════════════════════ */

function BookingSummaryBar({ partySize, selectedDate, selectedTime, onBack }: { partySize: number; selectedDate: Date | null; selectedTime: string | null; onBack: () => void }) {
  return (
    <div className="res-summary-bar">
      <span className="res-summary-bar__info">
        <i className="fa-solid fa-users" />{' '}
        {partySize} {partySize === 1 ? 'guest' : 'guests'}
        <span className="res-summary-bar__dot"> · </span>
        {formatShortDate(selectedDate)}
        <span className="res-summary-bar__dot"> · </span>
        {selectedTime}
      </span>
      <button className="res-summary-bar__change" type="button" onClick={onBack}>
        Change
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEAT DROPDOWN
═══════════════════════════════════════════════════════════════════════════ */

function CountrySelect({ value, onChange }: { value: CountryCode; onChange: (c: CountryCode) => void }) {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = search.trim()
    ? COUNTRY_CODES.filter(
      (c) =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    )
    : COUNTRY_CODES;

  return (
    <div className="res-country-select" ref={ref}>
      <button
        type="button"
        className="res-country-select__btn"
        onClick={() => { setOpen(!open); setSearch(''); }}
        aria-label="Select country code"
      >
        {value.label}
        <i className={`fa-solid fa-chevron-down res-country-select__arrow${open ? ' res-country-select__arrow--open' : ''}`} />
      </button>
      {open && (
        <div className="res-country-dropdown">
          <input
            className="res-country-dropdown__search"
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="res-country-dropdown__list">
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  className={`res-country-dropdown__item${c.code === value.code ? ' res-country-dropdown__item--active' : ''}`}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {c.label} <span className="res-country-dropdown__name">{c.country}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="res-country-dropdown__empty">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SeatDropdown({ value, onChange, sections }: { value: string; onChange: (id: string) => void; sections: SectionDetail[] }) {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [{ id: '', sectionName: 'No Preference' }, ...sections];
  const selected = options.find(o => o.id === value) || options[0];

  return (
    <div className="seat-drop" ref={ref}>
      <button
        type="button"
        className={`seat-drop__trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <i className="fa-solid fa-chair" />
        <span>{selected.sectionName}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} seat-drop__arrow`} />
      </button>
      {open && (
        <div className="seat-drop__menu">
          {options.map(opt => (
            <div
              key={opt.id}
              className={`seat-drop__option${value === opt.id ? ' selected' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false); }}
            >
              {value === opt.id && <i className="fa-solid fa-check seat-drop__check" />}
              {opt.sectionName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OccasionDropdown({ value, onChange, options = [] }: { value: string; onChange: (id: string) => void; options?: string[] }) {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdownOptions = [
    { id: '', label: 'Select occasion' },
    ...options.map((o) => ({ id: o, label: o })),
  ];

  const selected = dropdownOptions.find((o) => o.id === value) || dropdownOptions[0];
  const isPlaceholder = !value;

  return (
    <div className="seat-drop" ref={ref}>
      <button
        type="button"
        className={`seat-drop__trigger${open ? ' open' : ''}${isPlaceholder ? ' seat-drop__trigger--placeholder' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fa-solid fa-cake-candles" />
        <span>{selected.label}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} seat-drop__arrow`} />
      </button>
      {open && (
        <div className="seat-drop__menu">
          {dropdownOptions.map((opt) => (
            <div
              key={opt.id || 'none'}
              className={`seat-drop__option${value === opt.id ? ' selected' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false); }}
            >
              {value === opt.id && <i className="fa-solid fa-check seat-drop__check" />}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1
═══════════════════════════════════════════════════════════════════════════ */

interface Step1Props {
  partySize: number;
  setPartySize: (n: number) => void;
  maxPartySize: number;
  selectedDate: Date | null;
  setSelectedDate: (d: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (t: string) => void;
  slots: unknown;
  slotsLoading: boolean;
  slotsError: string | null;
  locationId: string;
  dispatch: Dispatch;
}

function Step1({ partySize, setPartySize, maxPartySize, selectedDate, setSelectedDate, selectedTime, onTimeSelect, slots, slotsLoading, slotsError, locationId, dispatch }: Step1Props) {
  // Re-fetch slots when date or party size changes
  useEffect(() => {
    if (!selectedDate || !locationId) return;
    dispatch(fetchSlotsRequest({ locationId, date: toISODate(selectedDate), partySize }));
  }, [selectedDate, partySize, locationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const partySizes = Array.from({ length: maxPartySize }, (_, i) => i + 1);

  return (
    <div className="res-step1">
      {/* Party size */}
      <div className="res-section">
        <div className="res-section__label">
          <i className="fa-solid fa-users" /> Party Size
        </div>
        <div className="res-party">
          {partySizes.map(n => (
            <button
              key={n}
              type="button"
              className={`res-party__btn${partySize === n ? ' active' : ''}`}
              onClick={() => setPartySize(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="res-section">
        <div className="res-section__label">
          <i className="fa-regular fa-calendar" /> Select Date
        </div>
        <InlineCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* Time */}
      <div className="res-section">
        <div className="res-section__label">
          <i className="fa-regular fa-clock" /> Select Time
        </div>
        <TimeSlots
          slots={slots}
          slotsLoading={slotsLoading}
          slotsError={slotsError}
          selectedTime={selectedTime}
          onSelect={onTimeSelect}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — DETAILS FORM
═══════════════════════════════════════════════════════════════════════════ */

interface Step2Props {
  partySize: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  form: ReservationForm;
  setForm: React.Dispatch<React.SetStateAction<ReservationForm>>;
  onBack: () => void;
  onSubmit: () => void;
  bookingLoading: boolean;
  bookingError: string | null;
  sections: SectionDetail[];
  selectedCountry: CountryCode;
  occasionOptions: string[];
}

function Step2({ partySize, selectedDate, selectedTime, form, setForm, onBack, onSubmit, bookingLoading, bookingError, sections, selectedCountry, occasionOptions }: Step2Props) {
  const set = (field: keyof ReservationForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const setCheck = (field: keyof ReservationForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.checked }));
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLen);
    setForm((prev) => ({ ...prev, phone: digits }));
  };
  const handleCountryChange = (country: CountryCode) => {
    setForm((prev) => ({
      ...prev,
      countryCode: country.code,
      phone: prev.phone.slice(0, country.maxLen),
    }));
  };

  const canSubmit =
    form.smsConsent &&
    form.phone.trim().length > 0 &&
    form.firstName.trim().length > 0 &&
    form.email.trim().length > 0;

  return (
    <div className="res-step2">
      <BookingSummaryBar partySize={partySize} selectedDate={selectedDate} selectedTime={selectedTime} onBack={onBack} />

      <form className="res-form" onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}>

        {/* Phone */}
        <div className="res-form__group">
          <label className="res-form__label">Phone <span className="res-form__required">*</span></label>
          <div className="res-phone-input">
            <CountrySelect value={selectedCountry} onChange={handleCountryChange} />
            <input
              className="res-phone-input__number"
              type="tel"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={handlePhoneChange}
              maxLength={selectedCountry.maxLen}
              required
            />
          </div>
        </div>

        {/* Name row */}
        <div className="res-form__row">
          <div className="res-form__group">
            <label className="res-form__label">First Name <span className="res-form__required">*</span></label>
            <input className="res-form__input" placeholder="First name" value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div className="res-form__group">
            <label className="res-form__label">Last Name</label>
            <input className="res-form__input" placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
          </div>
        </div>

        {/* Email */}
        <div className="res-form__group">
          <label className="res-form__label">Email <span className="res-form__required">*</span></label>
          <div className="res-form__input-wrap">
            <i className="fa-regular fa-envelope res-form__icon" />
            <input className="res-form__input res-form__input--icon" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
        </div>

        {/* Optional section — only render if at least one optional field exists */}
        {(sections.length > 0 || occasionOptions.length > 0) && (
          <div className="res-form__divider">Optional</div>
        )}

        {/* Seating preference */}
        {sections.length > 0 && (
          <div className="res-form__group">
            <label className="res-form__label">Seating Preference</label>
            <SeatDropdown value={form.seatPref} onChange={(v) => setForm(p => ({ ...p, seatPref: v }))} sections={sections} />
          </div>
        )}

        {/* Occasion */}
        {occasionOptions.length > 0 && (
          <div className="res-form__group">
            <label className="res-form__label">Occasion</label>
            <OccasionDropdown
              value={form.occasion}
              onChange={(v) => setForm(p => ({ ...p, occasion: v }))}
              options={occasionOptions}
            />
          </div>
        )}

        {/* SMS Consent */}
        <div className={`res-form__consent${form.smsConsent ? ' checked' : ''}`}>
          <label className="res-form__consent-row">
            <img
              src={form.smsConsent ? checkboxSelect : checkboxUnSelect}
              alt=""
              className="res-form__checkbox"
              onClick={() => setForm(prev => ({ ...prev, smsConsent: !prev.smsConsent }))}
            />
            <span className="res-form__consent-text">
              I agree to receive SMS updates about this reservation.{' '}
              <Link to="/terms-of-use" className="res-form__consent-link" target="_blank" rel="noopener noreferrer">Terms apply.</Link>
            </span>
          </label>
        </div>

        {/* Error */}
        {bookingError && (
          <div className="res-form__error">
            <i className="fa-solid fa-circle-exclamation" />
            {bookingError}
          </div>
        )}

        {/* Actions */}
        <div className="res-form__actions">
          <button type="button" className="res-form__back-btn" onClick={onBack}>
            <i className="fa-solid fa-arrow-left" /> Back
          </button>
          <button type="submit" className="res-btn-primary res-form__submit-btn" disabled={!canSubmit || bookingLoading}>
            {bookingLoading
              ? <><span className="res-spinner res-spinner--sm" /> Booking…</>
              : <><i className="fa-solid fa-calendar-check" /> Complete Reservation</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — CONFIRMED SCREEN
═══════════════════════════════════════════════════════════════════════════ */

interface ConfirmedScreenProps {
  reservationDetail: any;
  bookingResult: any;
  selectedDate: Date | null;
  selectedTime: string | null;
  partySize: number;
  form: ReservationForm;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  locationId: string;
  onStartCancel: () => void;
  onNewReservation: () => void;
}

function ConfirmedScreen({ reservationDetail: detail, bookingResult, selectedDate, selectedTime, partySize, form, locationName, locationAddress, locationPhone, locationId, onStartCancel, onNewReservation }: ConfirmedScreenProps) {
  const [calDropOpen, setCalDropOpen] = useState<boolean>(false);
  const calRef = useRef<HTMLDivElement | null>(null);
  const [qrError, setQrError] = useState<boolean>(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const qrId         = detail?.id || detail?.reservationId || bookingResult?.id || '';
  const confirmNo    = detail?.confirmationNo || bookingResult?.confirmationNo || qrId.slice(0, 8).toUpperCase();
  const displayDate  = detail?.reservationDate ? formatLongDate(detail.reservationDate) : formatShortDate(selectedDate);
  const displayTime  = detail?.reservationSlot || selectedTime || '';
  const displayGuests = detail?.partySize || partySize;
  const displayName  = detail?.partyName || `${form.firstName} ${form.lastName}`.trim();
  const displayPhone = detail?.partyPhone
    || (form.phone ? `${form.countryCode || DEFAULT_COUNTRY.code}${form.phone}` : '');
  const tableInfo    = (detail?.tableDetails || [])[0] || null;
  const sectionInfo  = tableInfo ? `${tableInfo.sectionName}${tableInfo.tableName ? ' · Table ' + tableInfo.tableName : ''}` : '';
  const qrSrc        = qrId ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrId)}` : '';

  // Calendar event helpers
  const resDate = detail?.reservationDate || toISODate(selectedDate);
  const startDt = new Date(`${resDate}T${convertTo24(displayTime)}`);
  const endDt   = new Date(startDt.getTime() + 60 * 60 * 1000);
  const calParams = {
    title:       `Reservation at ${locationName}`,
    location:    locationAddress,
    description: `Confirmation #${confirmNo} · Party of ${displayGuests}`,
    start: startDt, end: endDt,
  };

  return (
    <div className="res-confirmed">
      {/* Hero */}
      <div className="res-confirmed__hero">
        <motion.div
          className="res-confirmed__check-circle"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <i className="fa-solid fa-check" />
        </motion.div>
        <div>
          <h2 className="res-confirmed__title">Reservation Confirmed!</h2>
          <p className="res-confirmed__sub">
            See you soon, <strong>{form.firstName || displayName}</strong>. A confirmation has been noted.
          </p>
        </div>
      </div>

      {/* QR + Details */}
      <div className="res-confirmed__body">
        {/* QR column */}
        <div className="res-confirmed__qr-col">
          {qrSrc && !qrError ? (
            <div className="res-confirmed__qr-wrap">
              <img src={qrSrc} className="res-confirmed__qr-img" alt="Reservation QR" onError={() => setQrError(true)} />
            </div>
          ) : (
            <div className="res-confirmed__qr-placeholder">
              <i className="fa-solid fa-qrcode" />
            </div>
          )}
          <span className="res-confirmed__qr-id">#{confirmNo}</span>
          <span className="res-confirmed__qr-caption">Show at entrance</span>
          {qrSrc && (
            <a href={qrSrc} download={`reservation-${confirmNo}.png`} className="res-confirmed__qr-download">
              <i className="fa-solid fa-download" /> Save QR
            </a>
          )}
        </div>

        {/* Details column */}
        <div className="res-confirmed__details-col">
          <div className="res-confirmed__details-time-row">
            <span className="res-confirmed__details-time">{displayTime}</span>
            <span className="res-confirmed__details-guests">
              <i className="fa-solid fa-users" /> {displayGuests} guests
            </span>
          </div>

          <div className="res-confirmed__info-row">
            <i className="fa-solid fa-user" />
            <span>{displayName}</span>
          </div>


          <div className="res-confirmed__info-row">
            <i className="fa-regular fa-calendar" />
            <span>{displayDate}</span>
          </div>

          {sectionInfo && (
            <div className="res-confirmed__info-row">
              <i className="fa-solid fa-chair" />
              <span>{sectionInfo}</span>
            </div>
          )}

          {form.seatPref && (
            <div className="res-confirmed__info-row">
              <i className="fa-solid fa-couch" />
              <span>{form.seatPref}</span>
            </div>
          )}

          {form.occasion && (
            <div className="res-confirmed__info-row">
              <i className="fa-solid fa-champagne-glasses" />
              <span>{form.occasion}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="res-confirmed__action-row" ref={calRef} style={{ position: 'relative' }}>
            <button type="button" className="res-confirmed__action-btn" onClick={() => setCalDropOpen(o => !o)}>
              <i className="fa-regular fa-calendar-plus" /> Add to Calendar
            </button>
            <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="res-confirmed__action-btn">
              <i className="fa-solid fa-utensils" /> View Menu
            </Link>

            {calDropOpen && (
              <div className="res-cal-dropdown">
                {[
                  { key: 'google',  icon: 'fa-brands fa-google',  label: 'Google Calendar' },
                  { key: 'outlook', icon: 'fa-brands fa-microsoft', label: 'Outlook' },
                  { key: 'yahoo',   icon: 'fa-brands fa-yahoo',   label: 'Yahoo Calendar' },
                  { key: 'ical',    icon: 'fa-solid fa-download', label: 'Download .ics' },
                ].map(({ key, icon, label }) => (
                  <a
                    key={key}
                    className="res-cal-dropdown__item"
                    href={buildCalendarUrl(key, calParams)}
                    target={key === 'ical' ? '_self' : '_blank'}
                    rel="noreferrer"
                    download={key === 'ical' ? 'reservation.ics' : undefined}
                    onClick={() => setCalDropOpen(false)}
                  >
                    <i className={icon} />
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel + New Reservation */}
      <div className="res-confirmed__cancel-wrap">
        <button type="button" className="res-confirmed__cancel-link" onClick={onStartCancel}>
          Cancel this reservation
        </button>
        <span className="res-confirmed__cancel-sep" aria-hidden="true">·</span>
        <button type="button" className="res-confirmed__new-link" onClick={onNewReservation}>
          Make New Reservation
        </button>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CANCEL REASONS
═══════════════════════════════════════════════════════════════════════════ */

interface CancelReasonsProps {
  reservationDetail: any;
  bookingResult: any;
  locationId: string;
  cancelLoading: boolean;
  cancelSuccess: boolean;
  onBack: () => void;
  dispatch: Dispatch;
}

function CancelReasons({ reservationDetail: detail, bookingResult, locationId, cancelLoading, cancelSuccess, onBack, dispatch }: CancelReasonsProps) {
  const [selected, setSelected]   = useState<string>('');
  const [otherText, setOtherText] = useState<string>('');

  const reservationId = detail?.id || detail?.reservationId || bookingResult?.id || '';

  const cancelReason = selected === 'Other' && otherText.trim()
    ? otherText.trim()
    : selected;

  const canCancel = !!selected && (selected !== 'Other' || otherText.trim().length > 0);

  function handleConfirm() {
    if (!canCancel) return;
    dispatch(cancelReservationRequest({ locationId, reservationId, cancelReason }));
  }

  return (
    <div className="res-cancel">
      <div className="res-cancel__header">
        <button type="button" className="res-cancel__back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div>
          <h3 className="res-cancel__title">Cancel Reservation</h3>
          <p className="res-cancel__sub">Please let us know why you need to cancel.</p>
        </div>
      </div>

      <div className="res-cancel__options">
        {CANCEL_REASONS.map(reason => (
          <label key={reason} className={`res-cancel__option${selected === reason ? ' selected' : ''}`}>
            <input type="radio" name="cancel-reason" value={reason} checked={selected === reason} onChange={() => setSelected(reason)} />
            <span>{reason}</span>
          </label>
        ))}
      </div>

      {selected === 'Other' && (
        <div className="res-cancel__other-wrap">
          <textarea
            className="res-cancel__textarea"
            placeholder="Please describe your reason…"
            maxLength={100}
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
          />
          <span className="res-cancel__chars">{otherText.length}/100</span>
        </div>
      )}

      <div className="res-cancel__actions">
        <button type="button" className="res-form__back-btn" onClick={onBack}>Keep Reservation</button>
        <button
          type="button"
          className="res-btn-cancel"
          onClick={handleConfirm}
          disabled={!canCancel || cancelLoading}
        >
          {cancelLoading
            ? <><span className="res-spinner res-spinner--sm" /> Cancelling…</>
            : <><i className="fa-solid fa-xmark" /> Confirm Cancellation</>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CANCELLED SCREEN
═══════════════════════════════════════════════════════════════════════════ */

interface CancelledScreenProps {
  reservationDetail: any;
  bookingResult: any;
  selectedDate: Date | null;
  selectedTime: string | null;
  partySize: number;
  form: ReservationForm;
  locationAddress: string;
  locationPhone: string;
  onNewReservation: () => void;
}

function CancelledScreen({ reservationDetail: detail, bookingResult, selectedDate, selectedTime, partySize, form, locationAddress, locationPhone, onNewReservation }: CancelledScreenProps) {
  const confirmNo     = detail?.confirmationNo || bookingResult?.confirmationNo || '';
  const displayDate   = detail?.reservationDate ? formatLongDate(detail.reservationDate) : formatShortDate(selectedDate);
  const displayTime   = detail?.reservationSlot || selectedTime || '';
  const displayGuests = detail?.partySize || partySize || '';
  const displayName   = detail?.partyName || (form ? `${form.firstName || ''} ${form.lastName || ''}`.trim() : '');
  const tableInfo     = (detail?.tableDetails || [])[0] || null;
  const sectionInfo   = tableInfo ? `${tableInfo.sectionName}${tableInfo.tableName ? ' · Table ' + tableInfo.tableName : ''}` : '';

  return (
    <div className="res-cancelled">
      {/* Icon */}
      <motion.div
        className="res-cancelled__icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      >
        <i className="fa-solid fa-xmark" />
      </motion.div>

      <h3 className="res-cancelled__title">Reservation Cancelled</h3>
      <p className="res-cancelled__sub">Your reservation has been cancelled. No charges apply.</p>

      {/* Detail card */}
      <div className="res-cancelled__card">
        <div className="res-cancelled__card-header">
          <span className="res-cancelled__badge">
            <i className="fa-solid fa-circle-xmark" /> Cancelled
          </span>
          {confirmNo && <span className="res-cancelled__nocharge">No charges</span>}
        </div>

        {displayDate && <p className="res-cancelled__date">{displayDate}</p>}

        <div className="res-cancelled__meta">
          {displayTime && <span><i className="fa-regular fa-clock" /> {displayTime}</span>}
          {displayTime && displayGuests && <span className="res-cancelled__dot">·</span>}
          {displayGuests && <span><i className="fa-solid fa-users" /> {displayGuests} guests</span>}
        </div>

        <div className="res-cancelled__card-rows">
          {displayName && (
            <div className="res-cancelled__card-row">
              <i className="fa-solid fa-user" />
              <span>{displayName}</span>
            </div>
          )}
          {sectionInfo && (
            <div className="res-cancelled__card-row">
              <i className="fa-solid fa-couch" />
              <span>{sectionInfo}</span>
            </div>
          )}
          {confirmNo && (
            <div className="res-cancelled__card-row">
              <i className="fa-solid fa-hashtag" />
              <span>Ref: {confirmNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="res-cancelled__notif-section">
        <p className="res-cancelled__notif-heading">Notifications Sent</p>
        <ul className="res-cancelled__notif-list">
          <li><i className="fa-regular fa-circle-check" /> Cancellation confirmation emailed</li>
          <li><i className="fa-regular fa-circle-check" /> SMS confirmation sent</li>
          <li><i className="fa-regular fa-circle-check" /> Table released for other guests</li>
        </ul>
      </div>

      <p className="res-cancelled__hope">We hope to see you next time!</p>

      <button type="button" className="res-cancelled__cta" onClick={onNewReservation}>
        <i className="fa-solid fa-calendar-plus" /> Make a New Reservation
      </button>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RIGHT PANEL
═══════════════════════════════════════════════════════════════════════════ */

function RightPanel({ slugData, locationAddress, locationPhone }: { slugData: any; locationAddress: string; locationPhone: string }) {
  const [expanded,   setExpanded]   = useState<boolean>(false);
  const [truncateAt, setTruncateAt] = useState<number | null>(null);
  const pRef = useRef<HTMLParagraphElement | null>(null);

  const aboutText   = slugData?.aboutUs || slugData?.about_us || slugData?.about || slugData?.description || '';
  const posterMedia = (slugData?.media || slugData?.digiMenuMedia || [] as any[]).find((m: any) => m.entityType === 'POSTER' || m.entityType === 'BANNER');
  const posterUrl   = posterMedia
    ? `${MEDIA_CDN}/${posterMedia.id}.${(posterMedia.mimeType || '').split('/').pop() || 'jpg'}`
    : placeHolderMedia;

  useEffect(() => {
    if (expanded || !aboutText) { setTruncateAt(null); return; }

    const measure = () => {
      const p = pRef.current;
      if (!p) return;

      const lineHeight = parseFloat(getComputedStyle(p).lineHeight) || 20;
      const maxH = lineHeight * 2 + 2;

      // Spin up a hidden clone with the same computed width & font
      const clone = document.createElement('p');
      clone.style.cssText = [
        'position:absolute', 'visibility:hidden', 'pointer-events:none',
        'margin:0', 'padding:0', 'border:none',
        `width:${p.offsetWidth}px`,
        `font-family:${getComputedStyle(p).fontFamily}`,
        `font-size:${getComputedStyle(p).fontSize}`,
        `line-height:${getComputedStyle(p).lineHeight}`,
      ].join(';');
      document.body.appendChild(clone);

      // Full text fits in 2 lines?
      clone.textContent = aboutText;
      if (clone.offsetHeight <= maxH) {
        document.body.removeChild(clone);
        setTruncateAt(null);
        return;
      }

      // Binary search: max chars where text + '... Read more' ≤ 2 lines
      let lo = 0, hi = aboutText.length;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        clone.textContent = aboutText.slice(0, mid) + '... Read more';
        clone.offsetHeight <= maxH ? (lo = mid) : (hi = mid);
      }

      document.body.removeChild(clone);
      setTruncateAt(lo);
    };

    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (pRef.current) ro.observe(pRef.current);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [aboutText, expanded]);

  const needsTruncation = truncateAt !== null;
  const displayText     = needsTruncation ? aboutText.slice(0, truncateAt) : aboutText;

  return (
    <div className="res-right">
      <div className="res-right__hero-img">
        <img
          src={posterUrl}
          alt="Restaurant"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = placeHolderMedia;
          }}
        />
      </div>

      {aboutText && (
        <div className="res-right__section">
          <h4 className="res-right__heading">About Us</h4>
          <div className="res-right__about-wrap">
            <p ref={pRef} className="res-right__about-text">
              {displayText}
              {needsTruncation && (
                <button
                  type="button"
                  className="res-right__read-more res-right__read-more--inline"
                  onClick={() => setExpanded(true)}
                >
                  ... Read more
                </button>
              )}
            </p>

            {expanded && (
              <button
                type="button"
                className="res-right__read-more res-right__read-more--below"
                onClick={() => setExpanded(false)}
              >
                Read less
              </button>
            )}
          </div>
        </div>
      )}

      {(locationAddress || locationPhone) && (
        <div className="res-right__section res-right__location">
          <h4 className="res-right__heading">Visit Us</h4>
          <div className="res-right__location-rows">
            {locationAddress && (
              <div className="res-right__location-row">
                <i className="fa-solid fa-map-location-dot" />
                <span>{locationAddress}</span>
              </div>
            )}
            {locationPhone && (
              <div className="res-right__location-row">
                <i className="fa-solid fa-phone" />
                <a href={`tel:${locationPhone}`}>{locationPhone}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

const slideVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0,  opacity: 1 },
  exit:    { x: -24, opacity: 0 },
};

export default function ReservationPage() {
  const dispatch = useDispatch();

  // Redux state
  const slugData    = useSelector((s: RootState) => s.slug.data);
  const { isLoggedIn, user, mobilePhone: reduxPhone, customerId } = useSelector((s: RootState) => s.auth);
  const { slots, slotsLoading, slotsError, bookingResult, reservationDetail, bookingLoading, bookingError, bookingSuccess, cancelLoading, cancelSuccess } = useSelector((s: RootState) => s.reservation);

  // Derived from slug
  const locationId      = (slugData?.id || slugData?.locationId || '') as string;
  const maxPartySize    = (slugData?.maxOnlineCheckin || 10) as number;
  const locationName    = (slugData?.branchName || slugData?.name || 'Masala Twist Xpress') as string;
  const locationAddress = (slugData?.address || slugData?.branchAddress || '28244 Diehl Rd, Warrenville, IL 60555') as string;
  const locationPhone   = (slugData?.phoneNumber || slugData?.phone || '') as string;
  const sections        = (Array.isArray(slugData?.sectionDetailsList) ? slugData.sectionDetailsList : [] as any[]).filter((s: any) => s.isEnabled === 1 || s.isEnabled === true || s.enabled === 1);

  const occasionOptions = Array.from(
    new Map(
      (Array.isArray(slugData?.specialRequests) ? slugData.specialRequests : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item])
    ).values()
  );

  // UI state
  const [step,         setStep]         = useState<number>(1);
  const [subView,      setSubView]      = useState<string>('confirmed');
  const [partySize,    setPartySize]    = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form,         setForm]         = useState<ReservationForm>({
    countryCode: DEFAULT_COUNTRY.code,
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    seatPref: '',
    occasion: '',
    smsConsent: false,
  });

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === form.countryCode) || DEFAULT_COUNTRY;

  // Auto-fill form from logged-in user
  useEffect(() => {
    if (isLoggedIn && user) {
      const rawPhone = user.mobilePhone || reduxPhone || '';
      const parsed = splitPhoneWithCountry(rawPhone);
      setForm(prev => ({
        ...prev,
        phone:     parsed.number || prev.phone,
        countryCode: parsed.number ? parsed.country.code : prev.countryCode,
        firstName: user.firstName   || prev.firstName,
        lastName:  user.lastName    || prev.lastName,
        email:     user.email       || prev.email,
      }));
    }
  }, [isLoggedIn, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Booking success → Step 3
  useEffect(() => {
    if (bookingSuccess) { setSubView('confirmed'); setStep(3); }
  }, [bookingSuccess]);

  // Cancel success → cancelled subView
  useEffect(() => {
    if (cancelSuccess) setSubView('cancelled');
  }, [cancelSuccess]);

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep(2);
  }

  function handleSubmit() {
    const payload = {
      userId:            customerId || '',
      locationId,
      merchantSlug:      slugData?.slug || slugData?.merchantSlug || '',
      partyName:         `${form.firstName} ${form.lastName}`.trim(),
      partyPhone:        form.phone
        ? `${form.countryCode || DEFAULT_COUNTRY.code}${form.phone.replace(/\\D/g, '')}`
        : '',
      kidSize:           0,
      sectionId:         form.seatPref || sections[0]?.id || '',
      isReceiveTransMsg: form.smsConsent ? 1 : 0,
      partySize,
      deviceId:          '',
      channelName:       'ONLINE',
      seatTogether:      '1',
      isReservation:     1,
      reservationDate:   toISODate(selectedDate),
      reservationSlot:   selectedTime,
      sessionName:       selectedTime,
      notes:             form.occasion || '',
      highChairSize:     0,
    };
    dispatch(createReservationRequest(payload));
  }

  function handleNewReservation() {
    dispatch(resetReservation());
    dispatch(clearSlots());
    setStep(1);
    setSubView('confirmed');
    setPartySize(2);
    setSelectedDate(null);
    setSelectedTime(null);
    setForm(prev => ({
      ...prev,
      seatPref: '', occasion: '', smsConsent: false,
    }));
  }

  return (
    <PageBg className="reservation-page">

      <div className="res-container">
        <div className="reservation-layout">

          {/* ── Left glass card ── */}
          <div className="reservation-left">
            {!(subView === 'reasons' || subView === 'cancelled') && (
              <StepIndicator step={step} />
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }}>
                  <Step1
                    partySize={partySize}
                    setPartySize={setPartySize}
                    maxPartySize={maxPartySize}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                    slots={slots}
                    slotsLoading={slotsLoading}
                    slotsError={slotsError}
                    locationId={locationId}
                    dispatch={dispatch}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }}>
                  <Step2
                    partySize={partySize}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    form={form}
                    setForm={setForm}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    bookingLoading={bookingLoading}
                    bookingError={bookingError}
                    sections={sections}
                    selectedCountry={selectedCountry}
                    occasionOptions={occasionOptions}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }}>
                  <AnimatePresence mode="wait">
                    {subView === 'confirmed' && (
                      <motion.div key="confirmed" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                        <ConfirmedScreen
                          reservationDetail={reservationDetail}
                          bookingResult={bookingResult}
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          partySize={partySize}
                          form={form}
                          locationName={locationName}
                          locationAddress={locationAddress}
                          locationPhone={locationPhone}
                          locationId={locationId}
                          onStartCancel={() => setSubView('reasons')}
                          onNewReservation={handleNewReservation}
                        />
                      </motion.div>
                    )}
                    {subView === 'reasons' && (
                      <motion.div key="reasons" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                        <CancelReasons
                          reservationDetail={reservationDetail}
                          bookingResult={bookingResult}
                          locationId={locationId}
                          cancelLoading={cancelLoading}
                          cancelSuccess={cancelSuccess}
                          onBack={() => setSubView('confirmed')}
                          dispatch={dispatch}
                        />
                      </motion.div>
                    )}
                    {subView === 'cancelled' && (
                      <motion.div key="cancelled" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                        <CancelledScreen
                          reservationDetail={reservationDetail}
                          bookingResult={bookingResult}
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          partySize={partySize}
                          form={form}
                          locationAddress={locationAddress}
                          locationPhone={locationPhone}
                          onNewReservation={handleNewReservation}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right sticky panel ── */}
          <div className="reservation-right-col">
            <RightPanel slugData={slugData} locationAddress={locationAddress} locationPhone={locationPhone} />
          </div>

        </div>

        {/* ── Visit Us — mobile only, shown on all flows ── */}
        {(locationAddress || locationPhone) && (
          <div className="res-global-visit-us">
            <p className="res-confirmed__visit-heading">Visit Us</p>
            <div className="res-confirmed__visit-rows">
              {locationAddress && (
                <div className="res-confirmed__visit-row">
                  <i className="fa-solid fa-map-location-dot" />
                  <span>{locationAddress}</span>
                </div>
              )}
              {locationPhone && (
                <div className="res-confirmed__visit-row">
                  <i className="fa-solid fa-phone" />
                  <a href={`tel:${locationPhone}`}>{locationPhone}</a>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </PageBg>
  );
}

