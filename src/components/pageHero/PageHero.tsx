import React from 'react';
import './pageHero.css';

interface PageHeroProps {
  backgroundImage: string;
  overline: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHero({ backgroundImage, overline, title, description, children }: PageHeroProps): React.JSX.Element {
  return (
    <section className="ph-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="ph-hero-gradient" />
      <div className="ph-hero-body">
        <div className="ph-hero-rule"><span /></div>
        <p className="ph-hero-overline">{overline}</p>
        <h1 className="ph-hero-h1">{title}</h1>
        <p className="ph-hero-desc">{description}</p>
      </div>
      {children}
    </section>
  );
}
