import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  requestOtp,
  verifyOtp,
  registerUser,
  resetAuthModal,
} from '../../redux/auth/authActions'
import './AuthModal.css'
import type { RootState, User } from '../../types'

interface CountryCode {
  code: string;
  label: string;
  country: string;
  maxLen: number;
}

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
]

const DEFAULT_COUNTRY = COUNTRY_CODES[0]

// ── Step 1: Phone number entry ──────────────────────────────────────────────
interface PhoneStepProps {
  onSubmit: (phone: string) => void;
  loading: boolean;
  error: string | null;
}

function PhoneStep({ onSubmit, loading, error }: PhoneStepProps) {
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const filteredCountries = search.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.country.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : COUNTRY_CODES

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (phone.trim().length >= selectedCountry.maxLen) {
      onSubmit(selectedCountry.code + '-' + phone.trim())
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-phone-header">
        <div className="auth-form__icon">
          <i className="fas fa-mobile-alt" />
        </div>
        <h2 className="auth-form__title">Sign In / Register</h2>
      </div>
      <p className="auth-form__sub">Enter your mobile number to get an OTP</p>

      <div className="auth-input-group">
        <div className="auth-country-select" ref={dropdownRef}>
          <button
            type="button"
            className="auth-country-select__btn"
            onClick={() => { setDropdownOpen(!dropdownOpen); setSearch('') }}
            aria-label="Select country code"
          >
            {selectedCountry.label}
            <i className={`fas fa-chevron-down auth-country-select__arrow${dropdownOpen ? ' auth-country-select__arrow--open' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="auth-country-dropdown">
              <input
                className="auth-country-dropdown__search"
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <ul className="auth-country-dropdown__list">
                {filteredCountries.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className={`auth-country-dropdown__item${c.code === selectedCountry.code ? ' auth-country-dropdown__item--active' : ''}`}
                      onClick={() => {
                        setSelectedCountry(c)
                        setDropdownOpen(false)
                        setSearch('')
                        setPhone((p) => p.slice(0, c.maxLen))
                      }}
                    >
                      {c.label} <span className="auth-country-dropdown__name">{c.country}</span>
                    </button>
                  </li>
                ))}
                {filteredCountries.length === 0 && (
                  <li className="auth-country-dropdown__empty">No results</li>
                )}
              </ul>
            </div>
          )}
        </div>
        <input
          className="auth-input-group__field"
          type="tel"
          placeholder="Enter a mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLen))}
          maxLength={selectedCountry.maxLen}
          autoFocus
          required
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button
        className="auth-btn"
        type="submit"
        disabled={loading || phone.length < selectedCountry.maxLen}
      >
        {loading ? <span className="auth-spinner" /> : 'Send OTP'}
      </button>
    </form>
  )
}

// ── Step 2: OTP verification ─────────────────────────────────────────────────
const RESEND_SECONDS = 180

interface OtpStepProps {
  mobilePhone: string;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

function OtpStep({ mobilePhone, onSubmit, onResend, onBack, loading, error }: OtpStepProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length === 6) onSubmit(code)
  }

  const handleResendClick = () => {
    setSecondsLeft(RESEND_SECONDS)
    setOtp(['', '', '', '', '', ''])
    onResend()
    inputs.current[0]?.focus()
  }

  const dashIdx = mobilePhone.indexOf('-')
  const countryCode = dashIdx !== -1 ? mobilePhone.slice(0, dashIdx) : '+91'
  const displayPhone = dashIdx !== -1 ? mobilePhone.slice(dashIdx + 1) : mobilePhone

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-otp-header">
        <div className="auth-form__icon auth-form__icon--otp">
          <i className="fas fa-key" />
        </div>
        <h2 className="auth-form__title">Enter OTP</h2>
      </div>
      <p className="auth-form__sub">We sent a one-time password to</p>
      <div className="auth-otp-phone">
        <span className="auth-otp-phone__number">{countryCode} {displayPhone}</span>
        <button type="button" className="auth-otp-phone__change" onClick={onBack}>
          Change
        </button>
      </div>

      <div className="auth-otp-boxes" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            className="auth-otp-box"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <div className="auth-otp-resend">
        {secondsLeft > 0 ? (
          <span className="auth-otp-resend__timer">
            Resend OTP in <span className="auth-otp-resend__countdown">{timerDisplay}</span>
          </span>
        ) : (
          <button type="button" className="auth-link" onClick={handleResendClick}>
            Resend OTP
          </button>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button
        className="auth-btn"
        type="submit"
        disabled={loading || otp.join('').length < 6}
      >
        {loading ? <span className="auth-spinner" /> : 'Sign In'}
      </button>
    </form>
  )
}

// ── Email domain quick-select buttons ────────────────────────────────────────
const EMAIL_DOMAINS = ['.com', '@gmail.com', '@outlook.com', '@icloud.com', '@yahoo.com']

// ── Step 3: Registration form (Sign Up popup) ───────────────────────────────
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface RegisterStepProps {
  onSubmit: (form: RegisterFormData) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  initialData?: Partial<User> | Record<string, unknown>;
  mobilePhone: string;
}

function RegisterStep({ onSubmit, onBack, loading, error, initialData = {}, mobilePhone }: RegisterStepProps) {
  const [form, setForm] = useState<RegisterFormData>({
    firstName: (initialData as Record<string, unknown>).name as string || (initialData as Record<string, unknown>).firstName as string || '',
    lastName: (initialData as Record<string, unknown>).lastName as string || '',
    email: (initialData as Record<string, unknown>).email as string || '',
  })

  const set = (key: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleDomainClick = (domain: string) => {
    const current = form.email.trim()
    if (domain === '.com') {
      // Append .com if email doesn't already end with it
      if (current && !current.endsWith('.com')) {
        setForm((f) => ({ ...f, email: current + '.com' }))
      }
    } else {
      // @gmail.com etc — if there's text before @, use it; otherwise append domain
      const atIdx = current.indexOf('@')
      const localPart = atIdx !== -1 ? current.slice(0, atIdx) : current
      if (localPart) {
        setForm((f) => ({ ...f, email: localPart + domain }))
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (form.firstName.trim() && form.email.trim()) onSubmit(form)
  }

  // Parse mobilePhone for display
  const dashIdx = mobilePhone ? mobilePhone.indexOf('-') : -1
  const countryCode = dashIdx !== -1 ? mobilePhone.slice(0, dashIdx) : '+91'
  const displayPhone = dashIdx !== -1 ? mobilePhone.slice(dashIdx + 1) : mobilePhone

  return (
    <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
      <h2 className="auth-form__title auth-form__title--left">Sign up</h2>
      <p className="auth-form__sub auth-form__sub--left">
        Welcome, New user. Please enter your details to proceed.
      </p>

      {/* Mobile Number (read-only) */}
      <label className="auth-label">Mobile Number*</label>
      <div className="auth-input-group auth-input-group--readonly">
        <div className="auth-country-badge">
          <span className="auth-country-badge__flag">🇮🇳</span>
          <span className="auth-country-badge__code">{countryCode}</span>
        </div>
        <input
          className="auth-input-group__field"
          type="tel"
          value={displayPhone}
          readOnly
        />
      </div>

      {/* First Name & Last Name side-by-side */}
      <div className="auth-name-row">
        <div className="auth-name-col">
          <label className="auth-label">First Name*</label>
          <input
            className="auth-text-input"
            type="text"
            placeholder=""
            value={form.firstName}
            onChange={set('firstName')}
            required
            autoFocus
          />
        </div>
        <div className="auth-name-col">
          <label className="auth-label">Last Name</label>
          <input
            className="auth-text-input"
            type="text"
            placeholder=""
            value={form.lastName}
            onChange={set('lastName')}
          />
        </div>
      </div>

      {/* Email */}
      <label className="auth-label">Email*</label>
      <input
        className="auth-text-input"
        type="email"
        placeholder=""
        value={form.email}
        onChange={set('email')}
        required
      />

      {/* Email domain quick-select */}
      <div className="auth-email-domains">
        {EMAIL_DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            className="auth-email-domains__btn"
            onClick={() => handleDomainClick(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {error && <p className="auth-error">{error}</p>}

      {/* Change + Continue buttons */}
      <div className="auth-register-actions">
        <button type="button" className="auth-btn auth-btn--outline" onClick={onBack}>
          Change
        </button>
        <button
          className="auth-btn auth-btn--filled"
          type="submit"
          disabled={loading || !form.firstName.trim() || !form.email.trim()}
        >
          {loading ? <span className="auth-spinner" /> : 'Continue'}
        </button>
      </div>
    </form>
  )
}

// ── Main Modal ───────────────────────────────────────────────────────────────
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const dispatch = useDispatch()
  const { loading, error, step, mobilePhone, customerId, user } = useSelector((s: RootState) => s.auth)
  const [showPhoneOverride, setShowPhoneOverride] = useState(false)

  useEffect(() => {
    if (step === 'done') onClose()
  }, [step, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) dispatch(resetAuthModal())
  }, [isOpen, dispatch])

  useEffect(() => {
    if (isOpen) setShowPhoneOverride(false)
  }, [isOpen])

  const handleRequestOtp = (phone: string) => {
    setShowPhoneOverride(false)
    dispatch(requestOtp(phone))
  }
  const handleVerifyOtp = (otp: string) => dispatch(verifyOtp(mobilePhone, otp))
  const handleResend = () => dispatch(requestOtp(mobilePhone))
  const handleRegister = ({ firstName, lastName, email }: RegisterFormData) => {
    const token = user?.access_token || user?.accessToken || user?.token || '';
    dispatch(registerUser({
      customerId,
      mobilePhone,
      firstName,
      lastName,
      email,
      sendOtpViaEmail: false,
      token,
    }))
  }

  const renderStep = () => {
    if (!showPhoneOverride && step === 'otp_sent') {
      return (
        <OtpStep
          mobilePhone={mobilePhone}
          onSubmit={handleVerifyOtp}
          onResend={handleResend}
          onBack={() => setShowPhoneOverride(true)}
          loading={loading}
          error={error}
        />
      )
    }
    if (!showPhoneOverride && step === 'needs_registration') {
      return (
        <RegisterStep
          onSubmit={handleRegister}
          onBack={() => setShowPhoneOverride(true)}
          loading={loading}
          error={error}
          initialData={user || {}}
          mobilePhone={mobilePhone}
        />
      )
    }
    return (
      <PhoneStep
        onSubmit={handleRequestOtp}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-modal__close" onClick={onClose} aria-label="Close">
              <i className="fas fa-times" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={step + (showPhoneOverride ? '-phone' : '')}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
