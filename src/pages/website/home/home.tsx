import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../types';
import './Home.css';
import { useInView } from '../../../hooks/useInView';
import FaqSection from '../../../components/faqSection/FaqSection';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import ExclusiveItemCard from '../../../components/exclusiveItemCard/ExclusiveItemCard';
import { homeFaqItems } from '../../../data/menuLandingPages';
import { getMenuRequest } from '../../../redux/menu/menuActions';
import { transformMenuResponse } from '../../../utils/menuTransformer';
import { LOCATION_SLUG } from '../../../utils/branchConfig';

import aboutImg    from '../../../assets/images/about/about-1.jpg';
import amudhamDesign from '../../../assets/svg/amudham-design.svg';
import banner11    from '../../../assets/banner/banner-11.jpg';
import banner12    from '../../../assets/banner/banner-12.jpg';
import banner21    from '../../../assets/banner/banner-21.jpg';
import banner22    from '../../../assets/banner/banner-22.jpg';
import banner31    from '../../../assets/banner/banner-31.jpg';
import banner32    from '../../../assets/banner/banner-32.jpg';
import ohImg1      from '../../../assets/images/openingHours/001.jpg';
import ohImg2      from '../../../assets/images/openingHours/002.jpg';
import ohImg3      from '../../../assets/images/openingHours/003.png';
import ohImg4      from '../../../assets/images/openingHours/004.jpg';
import ohImg5      from '../../../assets/images/openingHours/005.png';
import ohImg6      from '../../../assets/images/openingHours/006.png';
import ohImg7      from '../../../assets/images/openingHours/007.jpg';
import ohImg8      from '../../../assets/images/openingHours/008.jpg';
import chooseUsImg from '../../../assets/images/about/choose-us.jpg';

// ─── DATA ────────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    tag: 'A Ritual of Flavor',
    heading: ['SOULFUL', 'INDIAN,', 'SERVED FAST'],
    sub: 'A place to rediscover the warmth and comfort of home with every meal, legacy recipes, ready in minutes.',
    cta: 'Order Now',
    img1: banner11,
    img2: banner12,
  },
  {
    tag: 'Heritage on Every Plate',
    heading: ['FLAVORS', 'OF HOME,', 'SERVED WITH PASSION'],
    sub: 'Timeless South Indian recipes crafted with reverence, served with the speed of modern life.',
    cta: 'Explore Menu',
    img1: banner21,
    img2: banner22,
  },
  {
    tag: 'The Amudham Experience',
    heading: ['BOLD,', 'HONEST', 'RECIPES'],
    sub: 'Every dish rooted in ancestral recipes passed down through generations, where even something simple has its own story.',
    cta: 'View Specials',
    img1: banner31,
    img2: banner32,
  },
] as const;

const ABOUT_STATS = [
  { num: '20+', label: 'Heritage Recipes' },
  { num: '3',   label: 'Cuisine Styles' },
  { num: '5★',  label: 'Guest Rating' },
];

const OPENING_HOURS = [
  { day: 'Monday – Friday',  time: '11:00 AM – 10:00 PM' },
  { day: 'Saturday',         time: '10:00 AM – 11:00 PM' },
  { day: 'Sunday',           time: '10:00 AM – 9:00 PM' },
  { day: 'Public Holidays',  time: '11:00 AM – 8:00 PM' },
];

const HOURS_IMAGES = [ohImg1, ohImg2, ohImg3, ohImg4, ohImg5, ohImg6, ohImg7, ohImg8];

const WHY_REASONS = [
  { icon: '🏺', title: 'Recipes from ancestral kitchens',      desc: 'Every dish is rooted in recipes passed down through generations, where even something as simple as sambar has its own story.' },
  { icon: '⚡', title: 'Quick service without compromise',     desc: 'We never chase trends or shortcuts. Just quality, authenticity, and flavors that feel like home.' },
  { icon: '🌿', title: 'Fresh ingredients, bold flavors',      desc: 'Sourced daily from local markets. Nothing frozen, nothing artificial. Just pure, honest cooking.' },
  { icon: '🍃', title: 'Fast & functional for your lifestyle', desc: "Soul food shouldn't make you wait. We serve fast-casual with fine-dining care." },
];

const FLAVORS = [
  {
    title: 'South Indian Tiffins',
    subtitle: 'Soul of the South',
    desc: 'Soft idlis, crispy dosas, and soul-warming filter coffee made the way your grandmother would approve.',
    color: '#013531',
  },
  {
    title: 'Indo-Chinese Favorites',
    subtitle: 'East Meets East',
    desc: 'Schezwan fried rice and noodles with that perfect blend of Desi and Chinese flavors you crave.',
    color: '#002724',
  },
  {
    title: 'North Indian Classics',
    subtitle: 'Heartland Heritage',
    desc: 'Rich curries, buttery naans, and biryani that bring warmth to every bite.',
    color: '#083339',
  },
];

const NEWS_POSTS = [
  {
    title: 'The Art of the Perfect Filter Kaapi',
    date: 'March 15, 2026', comments: 8,
    img: ohImg1,
    excerpt: "Discover the ritual behind South India's most beloved beverage — from bean to brass tumbler.",
    tag: 'Beverages',
  },
  {
    title: 'Why Biryani is More Than Just Rice',
    date: 'March 10, 2026', comments: 14,
    img: ohImg2,
    excerpt: 'A deep dive into the history and layers of this magnificent dish.',
    tag: 'Heritage',
  },
  {
    title: 'Secrets of Chettinad Spice Mastery',
    date: 'February 28, 2026', comments: 11,
    img: ohImg3,
    excerpt: "The Chettinad pantry holds over 20 unique spices — here's what makes it special.",
    tag: 'Cuisine',
  },
  {
    title: 'The Soul of Sambar: A Timeless Tradition',
    date: 'February 15, 2026', comments: 9,
    img: ohImg4,
    excerpt: 'How a humble dal-based stew became the heartbeat of South Indian home cooking.',
    tag: 'Culture',
  },
];

const GALLERY_ITEMS = [
  { src: ohImg1, alt: 'Chef Crafted Plating'   },
  { src: ohImg2, alt: 'Elegant Dining Space'   },
  { src: ohImg3, alt: 'Warm Ambience'          },
  { src: ohImg4, alt: 'Scenic Rooftop Dining'  },
  { src: ohImg5, alt: 'Kitchen Hygiene First'  },
  { src: ohImg6, alt: 'Farm Fresh Ingredients' },
  { src: ohImg7, alt: 'Spotless Prep Kitchen'  },
  { src: ohImg8, alt: 'Fine Dining Experience' },
];
const GALLERY_ITEMS_REV = [...GALLERY_ITEMS].reverse();

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface HomeProps {
  onSignInClick?: () => void;
}

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────

const galleryContainerVariant = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const galleryItemVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.5, ease: 'easeOut' } },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function Home(_props: HomeProps) {

  // ── State ─────────────────────────────────────────────────────────────────

  const [heroSlide, setHeroSlide]                     = useState(0);
  const [menuTab, setMenuTab]                         = useState(0);
  const [galleryIndex, setGalleryIndex]               = useState<number | null>(null);

  // ── InView refs ───────────────────────────────────────────────────────────

  const [aboutRef,    aboutInView]    = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [hoursRef,    hoursInView]    = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [hoursImgIdx, setHoursImgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHoursImgIdx(i => (i + 1) % HOURS_IMAGES.length), 3000);
    return () => clearInterval(t);
  }, []);
  const [whyRef,      whyInView]      = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [flavorsRef,  flavorsInView]  = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [legacyRef,   legacyInView]   = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [newsRef,     newsInView]     = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [galleryRef,  galleryInView]  = useInView() as [React.RefObject<HTMLElement>, boolean];

  // ── Router ────────────────────────────────────────────────────────────────

  const navigate = useNavigate();

  // ── Redux – live menu ─────────────────────────────────────────────────────

  const dispatch = useDispatch();
  const {
    data: rawMenuData,
    loading: menuLoading,
    orderType: menuOrderType,
    error: menuError,
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

  // ── Hero auto-advance ─────────────────────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(p => (p + 1) % HERO_SLIDES.length), 9000);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[heroSlide];

  // ── Gallery helpers ───────────────────────────────────────────────────────

  const openGallery  = (idx: number) => setGalleryIndex(idx);
  const closeGallery = () => setGalleryIndex(null);
  const prevGallery  = () => setGalleryIndex(i => i !== null ? (i - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length : null);
  const nextGallery  = () => setGalleryIndex(i => i !== null ? (i + 1) % GALLERY_ITEMS.length : null);

  useEffect(() => {
    if (galleryIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setGalleryIndex(null);
      if (e.key === 'ArrowLeft')  setGalleryIndex(i => i !== null ? (i - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length : null);
      if (e.key === 'ArrowRight') setGalleryIndex(i => i !== null ? (i + 1) % GALLERY_ITEMS.length : null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryIndex]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="hero" id="home">

        <div className="hero__particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="hero__particle" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>

        <div className="hero__side-phone">
          <span>+609-635-4723</span>
        </div>

        <div className="hero__inner container">

          {/* Left – content */}
          <div className="hero__content">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.65 }}
              >
                <span className="section-label">{slide.tag}</span>

                <h1 className="hero__heading">
                  {slide.heading.map((line, i) => (
                    <motion.span
                      key={i}
                      className="hero__heading-line"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
                    >
                      {line}
                    </motion.span>
                  ))}
                </h1>

                <motion.p
                  className="hero__sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {slide.sub}
                </motion.p>

                <motion.div
                  className="hero__ctas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  {slide.cta === 'Book a Table' || slide.cta === 'Reserve a Table' ? (
                    <button className="btn-filled hero__cta-main" onClick={() => navigate('/reservation')}>
                      {slide.cta}
                    </button>
                  ) : slide.cta === 'Order Now' ? (
                    <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="btn-filled hero__cta-main">
                      {slide.cta}
                    </Link>
                  ) : (
                    <Link to="/indian-restaurant-menu" className="btn-filled hero__cta-main">
                      {slide.cta}
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <div className="hero__dots">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`hero__dot${i === heroSlide ? ' active' : ''}`}
                  onClick={() => setHeroSlide(i)}
                />
              ))}
            </div>
          </div>

          {/* Right – images */}
          <div className="hero__visual">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlide + '-v'}
                className="hero__images"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.7 }}
              >
                <motion.div
                  className="hero__img-main"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img src={slide.img2} alt="restaurant" loading="lazy" />
                </motion.div>

                <motion.div
                  className="hero__img-blob"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <img src={slide.img1} alt="food" loading="lazy" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ABOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="about" id="about" ref={aboutRef}>

        <div className="container about__inner">

          {/* Image */}
          <motion.div
            className="about__image-wrap"
            initial={{ opacity: 0, x: -50 }}
            animate={aboutInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="about__image-frame">
              <img src={aboutImg} alt="Chef cooking" loading="lazy" />
            </div>

            <motion.div
              className="about__stats glass"
              initial={{ opacity: 0, y: 30 }}
              animate={aboutInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {ABOUT_STATS.map(s => (
                <div key={s.label} className="about__stat">
                  <span className="about__stat-num">{s.num}</span>
                  <span className="about__stat-label">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="about__content"
            initial={{ opacity: 0, x: 50 }}
            animate={aboutInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="section-label">Welcome to Amudham</span>
            <h2 className="section-title">FLAVORS OF HOME,<br />REIMAGINED</h2>

            <div className="ornament">
              <img src={amudhamDesign} alt="" aria-hidden="true" />
              <img src={amudhamDesign} alt="" aria-hidden="true" />
              <img src={amudhamDesign} alt="" aria-hidden="true" />
            </div>

            <p className="section-desc" style={{ marginBottom: '1rem' }}>
              Enjoy soul-satisfying South Indian classics, Indo-Chinese favorites, and North Indian
              staples — all crafted with reverence for tradition and served with speed.
            </p>
            <p className="section-desc" style={{ marginBottom: '2rem' }}>
              Each meal is a celebration of legacy, honoring heritage, and crafted to nourish both
              hunger and spirit. Savor warmth in every spoonful, discover timeless recipes made modern,
              and experience the essence of home, wherever you are.
            </p>

            <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="btn-filled">Order Now</Link>
          </motion.div>

        </div>
      </section>


 {/* ═══════════════════════════════════════════════════════════════════
          TODAY'S SPECIALS  –  live menu data
      ═══════════════════════════════════════════════════════════════════ */}
      {specialGroups.length > 0 && (
        <section id="menu" className="todays-specials">
          <div className="container">
            <div className="ts-head">
              <div>
                <span className="section-label">Explore Menu</span>
                <h2 className="section-title">CHEF'S PICKS</h2>
                <p className="ts-desc">Handpicked favorites, made fresh and served with tradition.</p>
              </div>
              <Link to="/indian-restaurant-menu" className="btn-filled ts-link">
                View Full Menu
              </Link>
            </div>

            <div className="ts-cards">
              {specialGroups.flatMap(group =>
                group.content.map(entry => (
                  <div key={entry.menuData.id || entry.dishName} className="ts-slide">
                    <ExclusiveItemCard item={entry.menuData} />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          OPENING HOURS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="hours" ref={hoursRef}>
        <div className="container hours__inner">

          {/* LEFT — content + infinite marquee */}
          <motion.div
            className="hours__left"
            initial={{ opacity: 0, x: -40 }}
            animate={hoursInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="section-label">Time to Savor</span>
            <h2 className="section-title">BUSINESS<br />HOURS</h2>

            <div className="hours__list">
              {OPENING_HOURS.map(item => (
                <div key={item.day} className="hours__row">
                  <span className="hours__day">{item.day}:</span>
                  <span className="hours__time">{item.time}</span>
                </div>
              ))}
            </div>

            {/* Infinite horizontal marquee */}
            <div className="hours__marquee">
              <div className="hours__marquee-track">
                {[...HOURS_IMAGES, ...HOURS_IMAGES].map((src, i) => (
                  <div key={i} className="hours__marquee-slide">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT — static large image + button */}
          <motion.div
            className="hours__right"
            initial={{ opacity: 0, x: 40 }}
            animate={hoursInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="hours__main-frame">
              <img src={HOURS_IMAGES[hoursImgIdx]} alt="Restaurant dining" loading="lazy" />
            </div>
            <Link to="/reservation" className="btn-outline hours__book-btn">
              Book a Table <i className="fas fa-arrow-right" />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="why" ref={whyRef}>
        <div className="container why__inner">

          {/* Image */}
          <motion.div
            className="why__image"
            initial={{ opacity: 0, x: -50 }}
            animate={whyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="why__img-frame">
              <img src={chooseUsImg} alt="Why choose us" loading="lazy" />
              <div className="why__img-overlay" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="why__content"
            initial={{ opacity: 0, x: 50 }}
            animate={whyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="section-label">Why Choose Us</span>
            <h2 className="section-title">
              BOLD, HONEST RECIPES.<br />
              <span className="why__title-sub">STRAIGHT FROM HOME.</span>
            </h2>
            {/* <div className="divider" /> */}
            <p className="section-desc" style={{ marginBottom: '2rem' }}>
              At Amudham Cafe, we bring you the kind of food that stays with you forever — not
              because it's fancy, but because it's memorable.
            </p>

            <div className="why__list">
              {WHY_REASONS.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="why__item"
                  initial={{ opacity: 0, y: 16 }}
                  animate={whyInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                >
                  <span className="why__item-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="why__item-title">{item.title}</h4>
                  <p className="why__item-desc">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <Link to={`/order-online/${LOCATION_SLUG}/pickup`} className="btn-filled" style={{ marginTop: '2rem', display: 'inline-flex' }}>
              Order Now
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OUR FLAVORS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flavors" ref={flavorsRef}>
        <div className="container">

          <motion.div
            className="flavors__header"
            initial={{ opacity: 0, y: 30 }}
            animate={flavorsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Our Flavors</span>
            <h2 className="section-title">TRADITION MEETS TASTE</h2>
            <p className="flavors__sub">From tiffins to meals, we've got it all.</p>
          </motion.div>

          <div className="flavors__grid">
            {FLAVORS.map((item, i) => (
              <motion.div
                key={item.title}
                className="flavors__card"
                style={{ '--card-bg': item.color } as React.CSSProperties}
                initial={{ opacity: 0, y: 40 }}
                animate={flavorsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 + i * 0.15, duration: 0.6 }}
              >
                <h3 className="flavors__card-title">{item.title}</h3>
                <p className="flavors__card-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <a href="/indian-restaurant-menu" className="btn-filled">View Full Menu</a>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LEGACY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="legacy" ref={legacyRef}>

        {/* <motion.div
          className="legacy__hb"
          animate={{ x: [0, 60, 0, -40, 0], y: [0, -30, 20, -10, 0], rotate: [0, 5, -5, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" opacity="0.3">
            <path d="M40 10 C30 25 15 25 5 18 C15 30 15 45 0 55 C15 45 30 45 40 62 C50 45 65 45 80 55 C65 45 65 30 75 18 C65 25 50 25 40 10Z" fill="#e4c4ac"/>
            <circle cx="40" cy="38" r="6" fill="#e4c4ac" opacity="0.5"/>
            <path d="M46 38 Q60 34 72 30" stroke="#e4c4ac" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.div> */}

        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="legacy__particle"
            style={{ '--li': i } as React.CSSProperties}
            animate={{ opacity: [0, 0.6, 0], y: [0, -60] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4 }}
          />
        ))}

        <div className="container legacy__inner">
          <div className="legacy__content-wrap">

            <motion.div
              className="legacy__chef-thumb"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={legacyInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.7 }}
            >
              <img src={ohImg5} alt="Chef" />
            </motion.div>

            <motion.div
              className="legacy__text"
              initial={{ opacity: 0, y: 40 }}
              animate={legacyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="section-label">The Legacy Behind the Ladle</span>
              <h2 className="section-title legacy__title">
                THE NAME AMUDHAM<br />MEANS <em className="legacy__em">ELIXIR</em>
              </h2>
              {/* <div className="divider" style={{ margin: '1.5rem 0' }} /> */}
              <p className="legacy__desc">
                Amudham means "elixir" in Tamil — flavor so irresistible, you keep coming back.
                Just like a hummingbird seeks out the sweetest bloom, our guests return for food
                that nourishes the soul as much as it satisfies hunger.
              </p>
              <p className="legacy__desc" style={{ marginTop: '1rem' }}>
                Every recipe carries a story — whispered across kitchens, passed through hands that
                cooked with love long before restaurants existed. We don't just serve food; we serve
                memories, heritage, and a slice of home.
              </p>
              <Link
                to="/indian-restaurant-menu"
                className="btn-filled legacy__cta"
                style={{ marginTop: '2.5rem', display: 'inline-flex' }}
              >
                Explore Our Menu
              </Link>
            </motion.div>

            <motion.div
              className="legacy__chef-large"
              initial={{ opacity: 0, x: 50 }}
              animate={legacyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <img src={ohImg6} alt="Chef plating" />
              <div className="legacy__chef-overlay" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GALLERY  –  real food photos
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="gallery-section" ref={galleryRef as React.RefObject<HTMLElement>}>

        <div className="container">
          <motion.div
            className="gallery-header"
            initial={{ opacity: 0, y: 24 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="gallery-header__left">
              <span className="section-label">Our Gallery</span>
              <h2 className="section-title">A CLOSER LOOK</h2>
            </div>
            <div className="gallery-header__right">
              <p className="section-desc">
                A glimpse at our vibrant tables, handcrafted dishes, and the warm atmosphere guests return for.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Marquee tracks ── */}
        <motion.div
          className="gallery-tracks-wrapper"
          initial={{ opacity: 0 }}
          animate={galleryInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          {/* Row 1 – scrolls left */}
          <div className="gallery-track gallery-track--fwd">
            <div className="gallery-track__inner">
              {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map(({ src, alt }, idx) => (
                <div
                  key={`fwd-${idx}`}
                  className="gallery-card"
                  onClick={() => openGallery(idx % GALLERY_ITEMS.length)}
                >
                  <img src={src} alt={alt} loading="lazy" />
                  <div className="gallery-card__overlay">
                    <span className="gallery-card__caption">{alt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 – scrolls right */}
          <div className="gallery-track gallery-track--rev">
            <div className="gallery-track__inner">
              {[...GALLERY_ITEMS_REV, ...GALLERY_ITEMS_REV].map(({ src, alt }, idx) => (
                <div
                  key={`rev-${idx}`}
                  className="gallery-card"
                  onClick={() => openGallery(GALLERY_ITEMS.findIndex(i => i.alt === alt))}
                >
                  <img src={src} alt={alt} loading="lazy" />
                  <div className="gallery-card__overlay">
                    <span className="gallery-card__caption">{alt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gallery-fade gallery-fade--left" />
          <div className="gallery-fade gallery-fade--right" />
        </motion.div>

      </section>

      {/* Gallery lightbox */}
      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div
            className="gallery-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeGallery}
          >
            <motion.div
              className="gallery-modal"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="gallery-modal__close" onClick={closeGallery} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <button className="gallery-modal__nav gallery-modal__prev" onClick={prevGallery} aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button className="gallery-modal__nav gallery-modal__next" onClick={nextGallery} aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
              <img src={GALLERY_ITEMS[galleryIndex].src} alt={GALLERY_ITEMS[galleryIndex].alt} />
              <div className="gallery-modal__footer">
                <span className="gallery-modal__caption">{GALLERY_ITEMS[galleryIndex].alt}</span>
                <span className="gallery-modal__counter">{galleryIndex + 1} / {GALLERY_ITEMS.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          LATEST NEWS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="news" id="news" ref={newsRef}>
        <div className="container">

          <motion.div
            className="news__header"
            initial={{ opacity: 0, y: 30 }}
            animate={newsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Our Latest News</span>
            <h2 className="section-title">STRAIGHT FROM<br />THE KITCHEN</h2>
          </motion.div>

          <div className="news__grid">

            {/* Featured */}
            <motion.article
              className="news__featured"
              initial={{ opacity: 0, x: -40 }}
              animate={newsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="news__img-wrap">
                <img src={NEWS_POSTS[0].img} alt={NEWS_POSTS[0].title} loading="lazy" />
                <div className="news__img-overlay" />
              </div>
              <div className="news__body">
                <div className="news__meta">
                  <span>{NEWS_POSTS[0].date}</span>
                  <span>·</span>
                  {/* <span>{NEWS_POSTS[0].comments} Comments</span> */}
                </div>
                <h3 className="news__title">{NEWS_POSTS[0].title}</h3>
                <p className="news__excerpt">{NEWS_POSTS[0].excerpt}</p>
                <a href="#" className="news__link">Read More <i className="fas fa-arrow-right" /></a>
              </div>
            </motion.article>

            {/* Side cards */}
            <div className="news__side">
              {NEWS_POSTS.slice(1).map((post, i) => (
                <motion.article
                  key={post.title}
                  className="news__card"
                  initial={{ opacity: 0, x: 40 }}
                  animate={newsInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.6 }}
                >
                  <div className="news__card-img">
                    <img src={post.img} alt={post.title} loading="lazy" />
                  </div>
                  <div className="news__card-body">
                    <div className="news__meta">
                      <span>{post.date}</span>
                      <span>·</span>
                      {/* <span>{post.comments} Comments</span> */}
                    </div>
                    <h3 className="news__card-title">{post.title}</h3>
                    <a href="#" className="news__link">Read More <i className="fas fa-arrow-right" /></a>
                  </div>
                </motion.article>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <FaqSection
        className="faq-home-section"
        kicker="FAQ"
        title="Questions Guests Ask Most"
        intro="From biryani and tandoori to curries, these are some of the quick answers guests often look for before visiting or ordering from Amudham Cafe."
        items={homeFaqItems}
      />

      <CtaStrip
        overline="Ready to Order?"
        heading="Order Your Favorites Online"
        btnLabel="Order Online"
        btnHref={`/order-online/${LOCATION_SLUG}/pickup`}
        btn2Label="Reserve a Table"
        btn2Href="/reservation"
        btn2RequiresReservation
      />

    </>
  );
}

export default Home;
