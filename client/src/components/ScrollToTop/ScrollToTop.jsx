import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Automatically scrolls the window to the top (0, 0)
 * whenever the pathname/route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scrolling prevents visual lag on transition
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
