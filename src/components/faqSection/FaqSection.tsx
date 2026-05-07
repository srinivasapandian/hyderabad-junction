import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqSection.css';

interface FaqAnswerSegment {
  type?: string;
  to?: string;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
  answerSegments?: FaqAnswerSegment[];
}

interface FaqSectionProps {
  kicker?: string;
  title?: string;
  intro?: string;
  items?: FaqItem[];
  className?: string;
  backgroundImage?: string;
  hasBackgroundOverlay?: boolean;
  initialOpenIndex?: number;
  layout?: 'split' | 'stacked';
}

function FaqSection({
  kicker,
  title,
  intro,
  items = [],
  className = '',
  backgroundImage,
  hasBackgroundOverlay = false,
  initialOpenIndex = 0,
  layout,
}: FaqSectionProps) {
  const hasCopy = Boolean(kicker || title || intro);
  const resolvedLayout = layout ?? (hasCopy ? 'split' : 'stacked');
  const isStacked = resolvedLayout === 'stacked';
  const [openIndex, setOpenIndex] = useState<number | null>(
    items?.length ? Math.min(initialOpenIndex, items.length - 1) : null
  );

  useEffect(() => {
    setOpenIndex(items?.length ? Math.min(initialOpenIndex, items.length - 1) : null);
  }, [initialOpenIndex, items]);

  const schemaData = useMemo(() => {
    if (!items?.length) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }, [items]);

  const rootStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined;

  const renderAnswerContent = (item: FaqItem): React.ReactNode => {
    if (!Array.isArray(item.answerSegments) || !item.answerSegments.length) {
      return item.answer;
    }

    return item.answerSegments.map((segment, segmentIndex) => {
      if (segment.type === 'link' && segment.to) {
        return (
          <Link
            key={`${item.question}-segment-${segmentIndex}`}
            to={segment.to}
            className="faq-answer-link"
          >
            {segment.text}
          </Link>
        );
      }

      return (
        <span key={`${item.question}-segment-${segmentIndex}`}>
          {segment.text}
        </span>
      );
    });
  };

  return (
    <section
      className={[
        'faq-section',
        backgroundImage ? 'faq-section--with-bg' : '',
        isStacked ? 'faq-section--full' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {backgroundImage && hasBackgroundOverlay && <div className="faq-section-bg-overlay" />}

      <div className="faq-shell">
        {hasCopy && (
          <div className="faq-copy">
            {kicker && <p className="faq-kicker">{kicker}</p>}
            {title && <h2 className="faq-title">{title}</h2>}
            {intro && <p className="faq-intro">{intro}</p>}
          </div>
        )}

        <div className="faq-list">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}-${item.question
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')}`;

            return (
              <article
                key={item.question}
                className={`faq-item${isOpen ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    <i className={`fa-solid ${isOpen ? 'fa-minus' : 'fa-plus'}`} />
                  </span>
                </button>
                <div
                  id={answerId}
                  className="faq-answer"
                  hidden={!isOpen}
                >
                  <p>{renderAnswerContent(item)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
    </section>
  );
}

export default FaqSection;
