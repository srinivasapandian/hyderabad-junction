import { useState } from 'react';
import './contact.css';
import PageBanner from '../../../components/pageBanner/PageBanner';
import PageBg from '../../../components/pageBg/PageBg';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';

interface LocationInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  mapSrc: string;
}

const LOCATIONS: LocationInfo[] = [
  {
    name: 'Amudham Cafe — San Jose',
    address: '4130 N First St, San Jose, CA 95134',
    phone: '+1 609-635-4723',
    email: 'amudhamcafe.usa@gmail.com',
    hours: 'Mon – Sun: 11:00 AM – 10:00 PM',
    mapSrc: 'https://maps.google.com/maps?q=4130+N+First+St,+San+Jose,+CA+95134&output=embed',
  },
];

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const TOPICS: string[] = ['Reservation', 'Catering Inquiry', 'Private Event', 'Feedback', 'Other'];

export default function Contact() {
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState<boolean>(false);
  const [focused, setFocused] = useState<string>('');

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <PageBg className="ct-page">

      {/* ── BANNER ── */}
      <PageBanner title="Contact Us" backgroundImage={BANNER_IMAGES.contact} />

      {/* ── BG WRAPPER ── */}
      <div className="ct-bg-wrap">
        <div className="ct-bg-scrim" />

        {/* ── FORM + INFO ── */}
        <section className="ct-sec">
          <div className="ct-ctr ct-main-grid">

            {/* ── FORM ── */}
            <div className="ct-form-panel">
              <p className="ct-overline">Send a Message <span className="ct-dash">-</span></p>
              <h2 className="ct-h2">We're Here for You</h2>

              {sent ? (
                <div className="ct-success">
                  <div className="ct-success-icon">
                    <i className="fa-solid fa-check" />
                  </div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button className="ct-success-back" onClick={() => setSent(false)}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form className="ct-form" onSubmit={submit}>
                  <div className="ct-row-2">
                    <div className={`ct-field ${focused === 'name' ? 'focused' : ''} ${form.name ? 'filled' : ''}`}>
                      <label>Full Name</label>
                      <input
                        type="text" name="name" value={form.name}
                        placeholder="John Doe" required
                        onChange={handle}
                        onFocus={() => setFocused('name')}
                        onBlur={() => setFocused('')}
                      />
                    </div>
                    <div className={`ct-field ${focused === 'email' ? 'focused' : ''} ${form.email ? 'filled' : ''}`}>
                      <label>Email Address</label>
                      <input
                        type="email" name="email" value={form.email}
                        placeholder="you@email.com" required
                        onChange={handle}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused('')}
                      />
                    </div>
                  </div>

                  <div className="ct-row-2">
                    <div className={`ct-field ${focused === 'phone' ? 'focused' : ''} ${form.phone ? 'filled' : ''}`}>
                      <label>Phone Number</label>
                      <input
                        type="tel" name="phone" value={form.phone}
                        placeholder="+1 (000) 000-0000"
                        onChange={handle}
                        onFocus={() => setFocused('phone')}
                        onBlur={() => setFocused('')}
                      />
                    </div>
                    <div className={`ct-field ${focused === 'subject' ? 'focused' : ''} ${form.subject ? 'filled' : ''}`}>
                      <label>Topic</label>
                      <select
                        name="subject" value={form.subject} required
                        onChange={handle}
                        onFocus={() => setFocused('subject')}
                        onBlur={() => setFocused('')}
                      >
                        <option value="" disabled>Select a topic</option>
                        {TOPICS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className={`ct-field ct-field-full ${focused === 'message' ? 'focused' : ''} ${form.message ? 'filled' : ''}`}>
                    <label>Your Message</label>
                    <textarea
                      name="message" value={form.message}
                      placeholder="Tell us how we can help you…"
                      rows={5} required
                      onChange={handle}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused('')}
                    />
                  </div>

                  <button type="submit" className="ct-submit">
                    <span>Send Message</span>
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </form>
              )}
            </div>

            {/* ── INFO ── */}
            <div className="ct-info-panel">
              <p className="ct-overline">Reach Us Directly <span className="ct-dash">-</span></p>
              <h2 className="ct-h2">Quick Info</h2>

              <div className="ct-info-list">
                <div className="ct-info-item">
                  <div className="ct-info-ico"><i className="fa-solid fa-phone" /></div>
                  <div className="ct-info-text">
                    <span className="ct-info-label">Phone</span>
                    <a href="tel:+16096354723">+1 609-635-4723</a>
                  </div>
                </div>

                <div className="ct-info-item">
                  <div className="ct-info-ico"><i className="fa-solid fa-envelope" /></div>
                  <div className="ct-info-text">
                    <span className="ct-info-label">Email</span>
                    <a href="mailto:amudhamcafe.usa@gmail.com">amudhamcafe.usa@gmail.com</a>
                  </div>
                </div>

                <div className="ct-info-item">
                  <div className="ct-info-ico"><i className="fa-solid fa-clock" /></div>
                  <div className="ct-info-text">
                    <span className="ct-info-label">Business Hours</span>
                    <span>Mon – Sun: 11:00 AM – 10:00 PM</span>
                  </div>
                </div>

                <div className="ct-info-item">
                  <div className="ct-info-ico"><i className="fa-solid fa-location-dot" /></div>
                  <div className="ct-info-text">
                    <span className="ct-info-label">San Jose</span>
                    <span>4130 N First St, San Jose, CA 95134</span>
                  </div>
                </div>

              </div>

              <div className="ct-socials">
                <span className="ct-overline" style={{ marginBottom: 0 }}>Follow Along</span>
                <div className="ct-social-icons">
                  <a href="https://www.instagram.com/amudhamcafe.usa/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram" /></a>
                  <a href="https://www.facebook.com/amudhamcafeusa" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-facebook-f" /></a>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── LOCATIONS ── */}
        <section className="ct-sec ct-loc-sec">
          <div className="ct-ctr">
            <div className="ct-sec-head">
              <p className="ct-overline">Find Us <span className="ct-dash">-</span></p>
              <h2 className="ct-h2 centered">Our Location</h2>
            </div>
            <div className="ct-loc-grid">
              {LOCATIONS.map((loc) => (
                <div key={loc.name} className="ct-loc-card">
                  <div className="ct-map-wrap">
                    <iframe
                      title={loc.name}
                      src={loc.mapSrc}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="ct-loc-body">
                    <h3>{loc.name}</h3>
                    <div className="ct-loc-row">
                      <i className="fa-solid fa-location-dot" />
                      <span>{loc.address}</span>
                    </div>
                    <div className="ct-loc-row">
                      <i className="fa-solid fa-phone" />
                      <a href={`tel:${loc.phone.replace(/\D/g,'')}`}>{loc.phone}</a>
                    </div>
                    <div className="ct-loc-row">
                      <i className="fa-solid fa-envelope" />
                      <a href={`mailto:${loc.email}`}>{loc.email}</a>
                    </div>
                    <div className="ct-loc-row">
                      <i className="fa-solid fa-clock" />
                      <span>{loc.hours}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="ct-dir-btn"
                    >
                      <i className="fa-solid fa-diamond-turn-right" />
                      Get Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>{/* end ct-bg-wrap */}

    </PageBg>
  );
}
