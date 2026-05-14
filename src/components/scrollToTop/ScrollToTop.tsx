import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop(): null {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      // Use a small delay to allow the component to render and IDs to be available
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: if element not found immediately, wait a bit
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
