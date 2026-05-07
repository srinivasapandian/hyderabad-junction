import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logoImg from '../../assets/logo/amudham-peach.png';
import './InfoSection.css';
import type { RootState, WorkingHour } from '../../types';

const SOCIALS = [
  { icon: 'fab fa-instagram', label: 'Instagram', href: 'https://www.instagram.com/amudhamcafe.usa/' },
  { icon: 'fab fa-facebook',  label: 'Facebook',  href: 'https://www.facebook.com/amudhamcafeusa' },
];

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatHourTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function buildHoursDisplay(hours: WorkingHour[]): { day: string; time: string }[] {
  const map: Record<string, WorkingHour> = {};
  hours.forEach((h) => { map[h.weekday] = h; });

  return DAY_ORDER.map((day) => {
    const entry = map[day];
    if (!entry || String(entry.isEnabled) === '0') {
      return { day, time: 'Closed' };
    }
    return {
      day,
      time: `${formatHourTime(entry.openingTime)} – ${formatHourTime(entry.closingTime)}`,
    };
  });
}

export default function InfoSection() {
  const slugData = useSelector((s: RootState) => s.slug.data);
  const [hoursTab, setHoursTab] = useState<'store' | 'online'>('store');

  const storeHours  = slugData?.workingHours  as WorkingHour[] | undefined;
  const onlineHours = slugData?.onlineWorkingHours as WorkingHour[] | undefined;

  const hasHours = (storeHours && storeHours.length > 0) || (onlineHours && onlineHours.length > 0);

  const activeHours = hoursTab === 'store'
    ? (storeHours  ?? onlineHours ?? [])
    : (onlineHours ?? storeHours  ?? []);

  const rows = hasHours ? buildHoursDisplay(activeHours) : null;

  const showToggle = storeHours && storeHours.length > 0 && onlineHours && onlineHours.length > 0;

  return (
    <section className="info">
      <div className="container info__inner">

        {/* Logo + tagline */}
        <motion.div
          className="info__brand"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/"><img src={logoImg} alt="Amudham" className="info__logo-img" /></Link>
          <p className="info__tagline">Soulful Indian, Served Fast</p>
        </motion.div>

        <div className="info__divider" />

        {/* Contact details */}
        <motion.div
          className="info__details"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <p><i className="fas fa-map-marker-alt" /> Amudham Cafe, 4130 N First St</p>
          <p style={{ paddingLeft: '1.3rem' }}>San Jose, CA 95134</p>
          <p style={{ marginTop: '0.6rem' }}><i className="fas fa-phone" /> 609-635-4723</p>
          <p><i className="fas fa-envelope" /> amudhamcafe.usa@gmail.com</p>
          <div className="info__social-icons" style={{ marginTop: '1rem' }}>
            {SOCIALS.map(({ icon, label, href }) => (
              <a key={label} href={href} className="info__social-icon" aria-label={label} target="_blank" rel="noopener noreferrer">
                <i className={icon} />
              </a>
            ))}
          </div>
        </motion.div>

        <div className="info__divider" />

        {/* Business hours */}
        <motion.div
          className="info__hours"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="info__hours-header">
            <p className="info__hours-label"><i className="fas fa-clock" /> Business Hours</p>
            {showToggle && (
              <div className="info__hours-toggle">
                <button
                  className={`info__hours-tab${hoursTab === 'store' ? ' active' : ''}`}
                  onClick={() => setHoursTab('store')}
                  type="button"
                >
                  Store
                </button>
                <button
                  className={`info__hours-tab${hoursTab === 'online' ? ' active' : ''}`}
                  onClick={() => setHoursTab('online')}
                  type="button"
                >
                  Online
                </button>
              </div>
            )}
          </div>

          {rows && rows.map(({ day, time }) => (
            <p key={day} className="info__hours-row">
              <span className="info__hours-day">{day}</span>
              <span className={`info__hours-time${time === 'Closed' ? ' info__hours-time--closed' : ''}`}>{time}</span>
            </p>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
