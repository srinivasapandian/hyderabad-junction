import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isReservationEnabledByBranch } from '../../utils/branchConfig';
import type { RootState } from '../../types';
import './CtaStrip.css';

interface CtaStripProps {
  overline: string;
  heading:  string;
  btnLabel: string;
  /** Use for page navigation */
  btnHref?:    string;
  /** Use for triggering an action (e.g. open auth modal) */
  onBtnClick?: () => void;
  /** Optional second button */
  btn2Label?:    string;
  btn2Href?:     string;
  onBtn2Click?:  () => void;
  /**
   * When true, btn2 is only rendered if the outlet has reservations enabled.
   * Mirrors the same config check used in the header and footer.
   */
  btn2RequiresReservation?: boolean;
}

export default function CtaStrip({
  overline, heading,
  btnLabel, btnHref, onBtnClick,
  btn2Label, btn2Href, onBtn2Click,
  btn2RequiresReservation = false,
}: CtaStripProps) {
  const slugData = useSelector((s: RootState) => s.slug.data);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);

  const showBtn2 = !!btn2Label && (btn2RequiresReservation ? isReservationEnabled : true);

  return (
    <section className="cta-strip">
      <div className="cta-strip__inner">
        <div>
          <p className="cta-strip__overline">{overline}</p>
          <h2 className="cta-strip__heading">{heading}</h2>
        </div>
        <div className="cta-strip__actions">
          {btnHref ? (
            <Link to={btnHref} className="cta-strip__btn">{btnLabel}</Link>
          ) : (
            <button className="cta-strip__btn" onClick={onBtnClick}>{btnLabel}</button>
          )}
          {showBtn2 && (
            btn2Href ? (
              <Link to={btn2Href} className="cta-strip__btn cta-strip__btn--outline">{btn2Label}</Link>
            ) : (
              <button className="cta-strip__btn cta-strip__btn--outline" onClick={onBtn2Click}>{btn2Label}</button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
