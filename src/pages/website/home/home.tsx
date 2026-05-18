import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, WorkingHour } from '../../../types';
import './Home.css';
import { useInView } from '../../../hooks/useInView';
import ExclusiveItemCard from '../../../components/exclusiveItemCard/ExclusiveItemCard';
import { getMenuRequest } from '../../../redux/menu/menuActions';
import { transformMenuResponse } from '../../../utils/menuTransformer';
import { isReservationEnabledByBranch } from '../../../utils/branchConfig';

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
    if (!entry || String(entry.isEnabled) === '0') return { day, time: 'Closed' };
    return { day, time: `${formatHourTime(entry.openingTime)} – ${formatHourTime(entry.closingTime)}` };
  });
}

import heroBg from '../../../assets/hero-bg.png';
import designImg from '../../../assets/design.png';
import menu1 from '../../../assets/menu1.png';
import menu2 from '../../../assets/menu2.png';
import menu3 from '../../../assets/menu3.png';
import appetizersImg from '../../../assets/appitizers.png';
import entreesImg from '../../../assets/entrees.png';
import dessertsImg from '../../../assets/desserts.png';
import trainImg from '../../../assets/train.png';
import styleImg from '../../../assets/style.png';
import service1 from '../../../assets/service1.png';
import service2 from '../../../assets/service2.png';
import service3 from '../../../assets/service3.png';
import service4 from '../../../assets/service4.png';
import gallery1 from '../../../assets/gallery1.png';
import gallery2 from '../../../assets/gallery2.png';
import gallery3 from '../../../assets/gallery3.png';
import gallery4 from '../../../assets/gallery4.png';
import gallery5 from '../../../assets/gallery5.png';
import starImg from '../../../assets/star.png';
import userImg from '../../../assets/user.png';
import googleImg1 from '../../../assets/google-img1.png';
import googleImg2 from '../../../assets/google-img2.png';
import googleImg3 from '../../../assets/google-img3.png';
import googleImg4 from '../../../assets/google-img4.png';
import googleImg5 from '../../../assets/google-img5.png';
import googleImg6 from '../../../assets/google-img6.png';
import googleImg7 from '../../../assets/google-img7.png';
import googleImg8 from '../../../assets/google-img8.png';
import googleImg9 from '../../../assets/google-img9.png';
import mobileBg from '../../../assets/mobile-bg2.png';

// ─── DATA ────────────────────────────────────────────────────────────────────

const GOOGLE_IMAGES = [
  googleImg1, googleImg2, googleImg3,
  googleImg4, googleImg5, googleImg6,
  googleImg7, googleImg8, googleImg9,
];

const MENU_CARDS = [
  { title: 'APPETIZERS', likes: '243k Likes', image: appetizersImg },
  { title: 'ENTREES', likes: '233k Likes', image: entreesImg },
  { title: 'DESSERTS', likes: '314k Likes', image: dessertsImg },
];

const SERVICE_CARDS = [
  { title: 'DINE IN', image: service1, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'HOME DELIVERY', image: service2, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'FRESHLY SERVED', image: service3, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'EVENT HOSTING', image: service4, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
];

const GALLERY_IMAGES = [
  { src: gallery1, alt: 'Chef Crafted Plating' },
  { src: gallery2, alt: 'Elegant Dining Space' },
  { src: gallery3, alt: 'Warm Ambience' },
  { src: gallery4, alt: 'Scenic Rooftop Dining' },
  { src: gallery5, alt: 'Fine Dining Experience' },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface HomeProps {
  onSignInClick?: () => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function Home(_props: HomeProps) {

  // ── State ─────────────────────────────────────────────────────────────────

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  // ── Scroll refs ───────────────────────────────────────────────────────────

  const menuTrackRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);

  // ── InView refs ───────────────────────────────────────────────────────────

  const [flavorRef, flavorInView] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [menuRef, menuInView] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [serviceRef, serviceInView] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [galleryRef, galleryInView] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [specialsRef, specialsInView] = useInView() as [React.RefObject<HTMLElement>, boolean];

  // ── Redux – live menu ─────────────────────────────────────────────────────

  const dispatch = useDispatch();
  const slugData = useSelector((s: RootState) => s.slug.data);
  const isReservationEnabled = isReservationEnabledByBranch(slugData);
  const storeHours = slugData?.workingHours as WorkingHour[] | undefined;
  const onlineHours = slugData?.onlineWorkingHours as WorkingHour[] | undefined;
  const activeHours = storeHours ?? onlineHours ?? [];
  const hoursRows = activeHours.length > 0 ? buildHoursDisplay(activeHours) : null;

  const {
    data: rawMenuData,
    loading: menuLoading,
    orderType: menuOrderType,
  } = useSelector((state: RootState) => state.menu);

  useEffect(() => {
    if (menuLoading) return;
    if (menuOrderType !== 'Pickup' || !rawMenuData) {
      dispatch(getMenuRequest('Pickup'));
    }
  }, [dispatch, menuLoading, menuOrderType, rawMenuData]);

  const specialGroups = useMemo(() => {
    if (!rawMenuData) return [];
    return transformMenuResponse(rawMenuData).specialGroups || [];
  }, [rawMenuData]);

  // ── Scroll helpers ────────────────────────────────────────────────────────

  const scrollMenu = (direction: number) => {
    if (!menuTrackRef.current) return;
    const track = menuTrackRef.current;
    const firstCard = track.querySelector<HTMLElement>('.hj-menu-card');
    if (!firstCard) return;
    const gap = parseFloat(getComputedStyle(track).gap || '0');
    track.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  const scrollGallery = (direction: number) => {
    if (!galleryTrackRef.current) return;
    const track = galleryTrackRef.current;
    const firstCard = track.querySelector<HTMLElement>('.hj-gallery-card');
    if (!firstCard) return;
    const gap = parseFloat(getComputedStyle(track).gap || '0');
    track.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  // ── Gallery lightbox ──────────────────────────────────────────────────────

  const openGallery = (idx: number) => setGalleryIndex(idx);
  const closeGallery = () => setGalleryIndex(null);
  const prevGallery = () => setGalleryIndex(i => i !== null ? (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length : null);
  const nextGallery = () => setGalleryIndex(i => i !== null ? (i + 1) % GALLERY_IMAGES.length : null);

  useEffect(() => {
    if (galleryIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryIndex(null);
      if (e.key === 'ArrowLeft') prevGallery();
      if (e.key === 'ArrowRight') nextGallery();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryIndex]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section id="home" className="hj-home" aria-label="Hyderabad Junction home">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hj-hero-shell">
        {/* Mobile hero */}
        <div className="hj-mobile-hero-top" aria-label="Mobile hero top">
          <h1>
            <span className="hj-mobile-orange">SERVED HOT TRAVELLED</span>
            <br />
            <span className="hj-mobile-orange">FAR,</span>
            <br />
            <span className="hj-mobile-blue">LOVED EVERYWHERE</span>
          </h1>
          <img src={designImg} alt="" aria-hidden="true" className="hj-hero-divider-img" />
        </div>

        <div className="hj-hero-wrap">
          <img src={heroBg} alt="Hyderabad Junction biryani hero" className="hj-hero-image" />

          <div className="hj-hero-copy-right" aria-label="Hero heading">
            <h1>
              SERVED HOT
              <br />
              <span>TRAVELLED FAR,</span>
              <br />
              LOVED EVERYWHERE
            </h1>
            <img src={designImg} alt="" aria-hidden="true" className="hj-hero-divider-img" />
          </div>
        </div>

        <div className="hj-hero-copy-left" aria-label="Hero description">
          <p>From aromatic biryanis to refreshing sides and indulgent desserts — every dish is made with passion and authenticity.</p>
          <a
            href="https://hyd-jn.maghil.com/restaurant/hyderabad-junction-tx/menu/Pickup"
            className="hj-hero-btn"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            EXPLORE MENU
          </a>
        </div>

        {/* Mobile decorative bottom image */}
        <div className="hj-mobile-hero-bottom" aria-hidden="true">
          <img src={mobileBg} alt="" className="hj-mobile-bottom-img" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FLAVOR / ABOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="hj-flavor" aria-label="Our passion for flavor" ref={flavorRef}>

        <motion.div
          className="hj-flavor-left"
          initial={{ opacity: 0, x: -30 }}
          animate={flavorInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="hj-flavor-side-card"><img src={menu1} alt="Naan and curry" /></div>
          <div className="hj-flavor-side-card"><img src={menu2} alt="Signature curry" /></div>
        </motion.div>

        <motion.div
          className="hj-flavor-center"
          initial={{ opacity: 0, y: 30 }}
          animate={flavorInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="hj-flavor-main-card"><img src={menu3} alt="Biryani platter" /></div>
          <h2>OUR PASSION FOR FLAVOR</h2>
          <p>
            We bring the authentic taste of South Indian non-vegetarian cuisine to the USA.
            Our chefs combine traditional recipes with fresh ingredients to create dishes that
            celebrate flavor, culture, and hospitality.
          </p>
          <Link
            to="/indian-restaurant-menu"
            className="hj-story-btn"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            EXPLORE MENU
          </Link>
        </motion.div>

        <motion.aside
          className="hj-flavor-right"
          aria-label="Google images section"
          initial={{ opacity: 0, x: 30 }}
          animate={flavorInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="hj-customer-pill">
            <img src={userImg} alt="" aria-hidden="true" className="hj-customer-user-img" />
            <div className="hj-customer-copy">
              <img src={starImg} alt="" aria-hidden="true" className="hj-customer-star-img" />
              <p>1k + Customers</p>
            </div>
          </div>

          <div className="hj-google-panel">
            <h3>GOOGLE IMAGES</h3>
            <div className="hj-google-grid">
              {GOOGLE_IMAGES.map((img, index) => (
                <img key={index} src={img} alt={`Google gallery ${index + 1}`} />
              ))}
            </div>
          </div>
        </motion.aside>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MENU CAROUSEL
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="menu" className="hj-menu-scroll" aria-label="Menu carousel" ref={menuRef}>

        <motion.div
          className="hj-section-title-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={menuInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="hj-ribbon" style={{ backgroundImage: `url(${styleImg})` }}>MENU</div>
          <img src={trainImg} alt="" aria-hidden="true" className="hj-ribbon-train" />
        </motion.div>

        <motion.div
          className="hj-menu-shell"
          initial={{ opacity: 0, y: 30 }}
          animate={menuInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <button type="button" className="hj-menu-arrow hj-menu-arrow-left" onClick={() => scrollMenu(-1)} aria-label="Scroll menu left">
            &#8249;
          </button>

          <div className="hj-menu-track" ref={menuTrackRef}>
            {MENU_CARDS.map((item) => (
              <article className="hj-menu-card" key={item.title}>
                <div className="hj-menu-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.likes}</p>
                  <Link to="/indian-restaurant-menu" className="hj-menu-card-btn">VIEW MORE</Link>
                </div>
                <img src={item.image} alt={item.title} />
              </article>
            ))}
          </div>

          <button type="button" className="hj-menu-arrow hj-menu-arrow-right" onClick={() => scrollMenu(1)} aria-label="Scroll menu right">
            &#8250;
          </button>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TODAY'S SPECIALS  –  live menu data
      ═══════════════════════════════════════════════════════════════════ */}
      {specialGroups.length > 0 && (
        <section className="hj-specials" ref={specialsRef}>
          <motion.div
            className="hj-section-title-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={specialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="hj-ribbon hj-ribbon--specials" style={{ backgroundImage: `url(${styleImg})` }}>CHEF'S PICKS</div>
            <img src={trainImg} alt="" aria-hidden="true" className="hj-ribbon-train" />
          </motion.div>

          <motion.div
            className="hj-specials-inner container"
            initial={{ opacity: 0, y: 30 }}
            animate={specialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="hj-specials-head">
              <p className="hj-specials-desc">Handpicked favorites, made fresh and served with tradition.</p>
              <Link to="/indian-restaurant-menu" className="hj-story-btn">
                View Full Menu
              </Link>
            </div>

            <div className="hj-specials-cards">
              {specialGroups.flatMap(group =>
                group.content.map(entry => (
                  <div key={entry.menuData.id || entry.dishName} className="hj-specials-slide">
                    <ExclusiveItemCard item={entry.menuData} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="services" className="hj-services" aria-label="Services section" ref={serviceRef}>

        <motion.div
          className="hj-section-title-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={serviceInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="hj-ribbon" style={{ backgroundImage: `url(${styleImg})` }}>SERVICES</div>
          <img src={trainImg} alt="" aria-hidden="true" className="hj-ribbon-train" />
        </motion.div>

        <div className="hj-services-grid">
          {SERVICE_CARDS.map((service, i) => (
            <motion.article
              className="hj-service-card"
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={serviceInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <img src={service.image} alt={service.title} className="hj-service-icon" />
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </motion.article>
          ))}
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GALLERY
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="hj-gallery" aria-label="Gallery section" ref={galleryRef as React.RefObject<HTMLElement>}>

        <motion.div
          className="hj-section-title-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={galleryInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="hj-ribbon" style={{ backgroundImage: `url(${styleImg})` }}>GALLERY</div>
          <img src={trainImg} alt="" aria-hidden="true" className="hj-ribbon-train" />
        </motion.div>

        <motion.div
          className="hj-gallery-marquee"
          initial={{ opacity: 0 }}
          animate={galleryInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <button type="button" className="hj-gallery-arrow hj-gallery-arrow-left" onClick={() => scrollGallery(-1)} aria-label="Scroll gallery left">
            &#8249;
          </button>

          <div className="hj-gallery-track" ref={galleryTrackRef}>
            {GALLERY_IMAGES.map((item, index) => (
              <figure
                className="hj-gallery-card"
                key={index}
                onClick={() => openGallery(index)}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.src} alt={item.alt} loading="lazy" />
              </figure>
            ))}
          </div>

          <button type="button" className="hj-gallery-arrow hj-gallery-arrow-right" onClick={() => scrollGallery(1)} aria-label="Scroll gallery right">
            &#8250;
          </button>
        </motion.div>

      </section>



      {/* Gallery lightbox */}
      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div
            className="hj-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeGallery}
          >
            <motion.div
              className="hj-modal"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="hj-modal-close" onClick={closeGallery} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <button className="hj-modal-nav hj-modal-prev" onClick={prevGallery} aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button className="hj-modal-nav hj-modal-next" onClick={nextGallery} aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <img src={GALLERY_IMAGES[galleryIndex].src} alt={GALLERY_IMAGES[galleryIndex].alt} />
              <div className="hj-modal-footer">
                <span className="hj-modal-caption">{GALLERY_IMAGES[galleryIndex].alt}</span>
                <span className="hj-modal-counter">{galleryIndex + 1} / {GALLERY_IMAGES.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}

export default Home;
