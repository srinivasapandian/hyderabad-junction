import { useEffect, useRef, useState } from 'react';
import designImg from '../../assets/design.png';
import './PageBg.css';

interface PageBgProps {
  className?: string;
  children: React.ReactNode;
}

const GAP_PX   = 500;
const START_PX = 200;

export default function PageBg({ className = '', children }: PageBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const decoRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const [count, setCount] = useState(8);

  /* Recalculate how many decos we need whenever the container resizes */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      setCount(Math.ceil((h - START_PX) / GAP_PX) + 2);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* Parallax scroll */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      decoRefs.current.forEach((el, i) => {
        if (!el) return;
        const isLeft = i % 2 === 0;
        el.style.transform = isLeft
          ? `translateX(${-y * 0.1}px)`
          : `translateX(${y * 0.1}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={containerRef} className={`pg-bg${className ? ` ${className}` : ''}`}>
      {children}
      {Array.from({ length: count }, (_, i) => {
        const isLeft = i % 2 === 0;
        return (
          <div
            key={i}
            ref={el => { decoRefs.current[i] = el; }}
            className={`pg-deco-wrap pg-deco-wrap--${isLeft ? 'left' : 'right'}`}
            style={{ top: `${START_PX + i * GAP_PX}px` }}
          >
            <img
              src={designImg}
              className="pg-deco"
              aria-hidden="true"
              alt=""
              style={{ animationDelay: `${-(i * 1.2) % 7}s` }}
            />
          </div>
        );
      })}
    </div>
  );
}
