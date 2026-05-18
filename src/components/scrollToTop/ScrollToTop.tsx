import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop(): null {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      const id = hash.replace('#', '');
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); return true; }
        return false;
      };
      if (!tryScroll()) {
        const t1 = setTimeout(() => { if (!tryScroll()) setTimeout(tryScroll, 300); }, 100);
        return () => clearTimeout(t1);
      }
    }
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
