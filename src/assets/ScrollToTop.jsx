import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  // Extract the current URL location pathname
  const { pathname } = useLocation();

  useEffect(() => {
    // Force the browser layout engine to snap directly to pixel 0,0 instantly
    window.scrollTo(0, 0);
  }, [pathname]); // Fires every single time the route path updates

  return null; // This component handles operations silently and renders no UI
};

export default ScrollToTop;
