import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import './InfoSection.css';
import type { RootState, WorkingHour } from '../../types';

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
    <section className="info" id="contact">
      <div className="container info__inner">

        {/* Left side: Order Online button */}
        <div className="info__btns">
          <a
            href="https://hyd-jn.maghil.com/restaurant/hyderabad-junction-tx/menu/Pickup"
            className="info__btn info__btn--filled"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Order Online
          </a>
        </div>

        {/* Right side: Business hours */}
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

          <div className="info__hours-grid">
            {rows && rows.map(({ day, time }) => (
              <p key={day} className="info__hours-row">
                <span className="info__hours-day">{day}</span>
                <span className={`info__hours-time${time === 'Closed' ? ' info__hours-time--closed' : ''}`}>{time}</span>
              </p>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
