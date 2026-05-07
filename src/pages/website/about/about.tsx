import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from '../../../hooks/useInView';
import FaqSection from '../../../components/faqSection/FaqSection';
import CtaStrip from '../../../components/ctaStrip/CtaStrip';
import { LOCATION_SLUG } from '../../../utils/branchConfig';
import PageBanner from '../../../components/pageBanner/PageBanner';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';
import amudhamDesign from '../../../assets/svg/amudham-design.svg';
import banner11 from '../../../assets/banner/banner-11.jpg';
import banner21 from '../../../assets/banner/banner-21.jpg';
import banner31 from '../../../assets/banner/banner-31.jpg';
import ohImg1   from '../../../assets/images/openingHours/001.jpg';
import ohImg2   from '../../../assets/images/openingHours/002.jpg';
import ohImg5   from '../../../assets/images/openingHours/005.png';
import ohImg7   from '../../../assets/images/openingHours/007.jpg';
import ohImg8   from '../../../assets/images/openingHours/008.jpg';
import './About.css';

// ─── DATA ────────────────────────────────────────────────────────────────────

const CORE_PRINCIPLES = [
  {
    icon: 'fas fa-heart',
    num: '01',
    title: 'Ancestral Recipes, Faithfully Honored',
    desc: 'Food is served exactly as it emerged from the ancestral kitchen—unaltered, unapologetic, uncompromised.',
  },
  {
    icon: 'fas fa-star',
    num: '02',
    title: 'Quality Abundance',
    desc: 'We use premium Indian spices generously, ensuring every plate carries uncompromised depth, richness, and authenticity.',
  },
  {
    icon: 'fas fa-hourglass-end',
    num: '03',
    title: 'Tradition Meets Modern Efficiency',
    desc: 'Timeless recipes served in a contemporary QSR format—honoring the past while embracing the present.',
  },
  {
    icon: 'fas fa-building',
    num: '04',
    title: 'Spiritual Foundation',
    desc: "Rooted in Vellalar's philosophy: every living being deserves respect, and every meal reflects that equality and care.",
  },
  {
    icon: 'fas fa-leaf',
    num: '05',
    title: 'Soulful Over Trendy',
    desc: 'We serve comfort. We serve memory. We serve the food your grandmother would recognize and approve.',
  },
];

const FAQ = [
  {
    question: 'What makes Amudham Cafe different from other QSRs?',
    answer: "Amudham Cafe blends traditional Indian recipes with a modern, quick-service format. Our menu celebrates soulful, home-style dishes served fast, using authentic recipes passed down through generations. You'll find warmth, ritual, and honest flavor in every meal without ever sacrificing on speed or quality.",
  },
  {
    question: 'Is your food only South Indian?',
    answer: 'Not at all! While South Indian classics are our heart, we also serve Indo-Chinese favorites and North Indian staples—all crafted with the same reverence for tradition.',
  },
  {
    question: 'Who is Amudham Cafe for?',
    answer: 'Anyone who craves authentic Indian home-style cooking—Indian immigrants, second-gen Americans, or curious seekers of real Indian flavor.',
  },
  {
    question: "What's the story behind the name \"Amudham\"?",
    answer: '"Amudham" means elixir in Tamil—something irresistible and life-giving. Just like a hummingbird seeks the sweetest bloom, our guests return for food that nourishes the soul as much as it satisfies hunger.',
  },
  {
    question: 'How fast is your service?',
    answer: "Most dishes are ready within 8–12 minutes. We've perfected speed without sacrificing the slow-cooked soul of our recipes.",
  },
  {
    question: 'Can I make special requests or customize my meal?',
    answer: "Absolutely. Let us know your dietary preferences or spice levels and we'll do our best to accommodate you.",
  },
  {
    question: 'How can I share feedback or reviews?',
    answer: 'We love hearing from you! Leave a Google review, reach out via our contact form, or tell your server directly. Your voice shapes our kitchen.',
  },
];

const PROMISE_PARAS = [
  <>We promise to honor the legacy and visionary passion of Senthil Kumar Rajasekaran, keeping Amudham faithful to its ancestral roots, <strong>today</strong>, <strong>tomorrow</strong>, and <strong>for generations to come</strong>.</>,
  <>We promise to serve every guest, Indian immigrants, second-gen Americans, or curious seeker with the same unwavering <strong>quality</strong>, <strong>warmth</strong>, and <strong>authenticity</strong> that define our name.</>,
  <>We promise to be a sanctuary of <strong>authentic Indian cuisine across the USA</strong>, where tradition thrives, ancestral recipes are preserved, and the soul of home cooking remains alive and honored.</>,
  <>We promise to remain <strong>uncompromising</strong>, <strong>honest</strong>, and rooted in the belief that great food is never rushed, never diluted, and never forgotten.</>,
  <>Amudham Cafe does not merely serve food. Amudham serves continuity. Amudham serves heritage. <strong>Amudham serves truth.</strong></>,
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [heroRef] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [storyRef,      storyInView]      = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [vmRef,         vmInView]         = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [founderRef,    founderInView]    = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [philosophyRef, philosophyInView] = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [promiseRef,    promiseInView]    = useInView() as [React.RefObject<HTMLElement>, boolean];
  const [principlesRef, principlesInView] = useInView() as [React.RefObject<HTMLElement>, boolean];

  return (
    <main className="about-page">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef}>
        <PageBanner title="About Us" backgroundImage={BANNER_IMAGES.about} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. KITCHEN LEGACY STORY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-story" ref={storyRef}>

        <div className="ap-story__left">
          <motion.div
            className="ap-story__img-frame"
            initial={{ opacity: 0, x: -50 }}
            animate={storyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75 }}
          >
            <img
              src={banner11}
              alt="Restaurant interior"
              loading="lazy"
            />
          </motion.div>
        </div>

        <motion.div
          className="ap-story__content"
          initial={{ opacity: 0, y: 40 }}
          animate={storyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          <span className="section-label">Welcome to Amudham</span>
          <h1 className="ap-story__heading">
            A KITCHEN LEGACY.<br />A HUMMINGBIRD'S<br />JOURNEY.
          </h1>
          <div className="ap-story__ornament">
            <img src={amudhamDesign} alt="" aria-hidden="true" />
            <img src={amudhamDesign} alt="" aria-hidden="true" />
            <img src={amudhamDesign} alt="" aria-hidden="true" />
          </div>
          <p className="ap-story__sub">Our Essence</p>
          <p className="ap-story__body">
            Amudham Cafe is more than a restaurant; it embodies ancestral Indian culinary
            wisdom brought to the USA. Born from the visionary passion of Senthil Kumar Rajasekaran,
            whose decades of culinary mastery transformed family recipes into a living legacy,
            we carry forward the spirit of home kitchens where every spice blend, every curry,
            every tiffin tells a story.
          </p>
          <p className="ap-story__body" style={{ marginTop: '1rem' }}>
            We are custodians of authenticity in a world of shortcuts. In a landscape saturated
            with fusion trends and quick compromises, Amudham remains faithful to the soul of
            Indian cooking—bold, honest, uncompromised.
          </p>
        </motion.div>

        <div className="ap-story__right">
          <motion.div
            className="ap-story__img-frame ap-story__img-frame--sm"
            initial={{ opacity: 0, x: 50 }}
            animate={storyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.75 }}
          >
            <img
              src={banner21}
              alt="Fine dining"
              loading="lazy"
            />
          </motion.div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. VISION & MISSION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-vm" ref={vmRef}>
        <div className="container">
          <div className="ap-vm__grid">

            <motion.div
              className="ap-vm__col"
              initial={{ opacity: 0, x: -40 }}
              animate={vmInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <h2 className="ap-vm__title">VISION</h2>
              <p className="ap-vm__desc">
                To become the keeper of Indian culinary truth across the USA, preserving
                ancestral recipes, honoring Vellalar's philosophy of equality, and making
                soulful, authentic food accessible to every seeker of home.
              </p>
              <div className="ap-vm__img">
                <img
                  src={ohImg1}
                  alt="Vision"
                  loading="lazy"
                />
              </div>
            </motion.div>

            <motion.div
              className="ap-vm__col"
              initial={{ opacity: 0, x: 40 }}
              animate={vmInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <div className="ap-vm__img ap-vm__img--top">
                <img
                  src={ohImg2}
                  alt="Mission"
                  loading="lazy"
                />
              </div>
              <h2 className="ap-vm__title">MISSION</h2>
              <p className="ap-vm__desc">
                To honor the ancestral kitchen by serving bold, flavorful dishes with
                unwavering commitment to quality, authenticity, and care—delivering not
                just food, but memory, warmth, and the familiar comfort of home on every plate.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. THE FOUNDER
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-founder" ref={founderRef}>
        <div className="container">
          <div className="ap-founder__grid">

            <motion.div
              className="ap-founder__info"
              initial={{ opacity: 0, x: -40 }}
              animate={founderInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <div className="ap-founder__avatar">
                <img
                  src={ohImg5}
                  alt="Chef"
                />
              </div>
              <span className="ap-founder__label">Senthil Kumar Rajasekaran</span>
              <span className="ap-founder__sublabel">Culinary Visionary &amp; Recipe Keeper</span>
              <h2 className="ap-founder__title">THE FOUNDER</h2>
              <p className="ap-founder__desc">
                Senthil Kumar Rajasekaran carries within him the language of spices, the rhythm of the
                kitchen, and decades of culinary mastery passed down through generations. Raised
                in kitchens where even something as simple as sambhar held spiritual significance,
                he perfected his craft through patience, precision, and an unshakeable belief in tradition.
              </p>
              <p className="ap-founder__desc">
                His recipes are not inventions—they are inheritances. Every dish served at
                Amudham Cafe reflects his conviction that food must nourish the soul as much
                as it satisfies hunger.
              </p>
              <p className="ap-founder__desc">
                With Amudham Cafe, he brings his ancestral kitchen to the USA, refusing to
                compromise on quality, taste, or authenticity.
              </p>
              <Link to="/indian-restaurant-menu" className="btn-filled ap-founder__cta">
                Explore Our Menu
              </Link>
            </motion.div>

            <motion.div
              className="ap-founder__img"
              initial={{ opacity: 0, x: 40 }}
              animate={founderInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <img
                src={ohImg8}
                alt="Founder chef"
                loading="lazy"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. THE AMUDHAM PHILOSOPHY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-philosophy" ref={philosophyRef}>
        <div className="container">
          <div className="ap-philosophy__grid">

            <motion.div
              className="ap-philosophy__content"
              initial={{ opacity: 0, x: -40 }}
              animate={philosophyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="section-label">Soulful Indian. Designed for Speed. Rooted in Spirit.</span>
              <h2 className="ap-philosophy__title">THE AMUDHAM<br />PHILOSOPHY</h2>
              <ul className="ap-philosophy__list">
                {[
                  ['Authenticity Uncompromised', 'Every recipe honors the ancestral kitchen. No fusion. No trends. Just honest, bold flavors.'],
                  ['Generational Mastery', 'Decades of culinary wisdom distilled into every dish, every spice blend, every sauce.'],
                  ['Quick-Service Excellence', 'Speed without sacrifice. You get warmth in minutes, not hours.'],
                  ['Spices as Sacred Language', 'Each ingredient is individually curated and balanced with reverence and precision.'],
                  ['Modern, Minimal Warmth', 'Deep bottle green. Muted sand. Terracotta accents. The vibe feels calm, confident, and conscious.'],
                ].map(([title, desc]) => (
                  <li key={title}>
                    <i className="fas fa-circle" />
                    <span><strong>{title}</strong> {desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="ap-philosophy__img"
              initial={{ opacity: 0, x: 40 }}
              animate={philosophyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <img
                src={ohImg7}
                alt="Philosophy"
                loading="lazy"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. THE AMUDHAM PROMISE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-promise" ref={promiseRef}>
        <div className="container ap-promise__inner">
          <motion.h2
            className="ap-promise__title"
            initial={{ opacity: 0, y: 30 }}
            animate={promiseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            THE AMUDHAM PROMISE
          </motion.h2>
          <motion.div
            className="ap-promise__body"
            initial={{ opacity: 0, y: 20 }}
            animate={promiseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {PROMISE_PARAS.map((para, i) => <p key={i}>{para}</p>)}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={promiseInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <Link to="/indian-restaurant-menu" className="btn-filled ap-promise__cta">
              View Our Menu
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. CORE PRINCIPLES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="ap-principles" ref={principlesRef}>
        <div className="container">
          <motion.h2
            className="section-title ap-principles__heading"
            initial={{ opacity: 0, y: 30 }}
            animate={principlesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            CORE PRINCIPLES
          </motion.h2>
          <div className="ap-principles__grid">
            {CORE_PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.num}
                className="ap-principles__card"
                initial={{ opacity: 0, y: 30 }}
                animate={principlesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <i className={p.icon} />
                <h4 className="ap-principles__card-title">
                  <span className="ap-principles__num">{p.num}</span>
                  <span className="ap-principles__sep" aria-hidden="true">|</span>
                  <span className="ap-principles__label">{p.title}</span>
                </h4>
                <p className="ap-principles__card-desc">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          8. FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <FaqSection
        layout="stacked"
        kicker="Need Help?"
        title="GENERAL QUESTIONS"
        items={FAQ}
        initialOpenIndex={0}
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

    </main>
  );
}
