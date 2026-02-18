import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ScrollNavigatorProps {
  children: React.ReactNode;
}

const ScrollNavigator: React.FC<ScrollNavigatorProps> = ({ children }) => {
  const sections = useMemo(
    () => [
      { id: "home", title: "Home", path: "/" },
      { id: "about", title: "About", path: "/about" },
      { id: "services", title: "Services", path: "/services" },
      { id: "sahal-card", title: "Sahal Card", path: "/sahal-card" },
      { id: "contact", title: "Contact", path: "/contact" },
    ],
    []
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Natural scrolling with gentle assistance
    let scrollTimeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section and mark it active
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActive(visible.target.id);
        }
      },
      {
        root: container,
        threshold: [0.3, 0.5, 0.7, 1.0],
        rootMargin: '0px'
      }
    );

    const nodes = Array.from(container.querySelectorAll("section[data-snap-section]"));
    nodes.forEach((n) => observer.observe(n));

    return () => {
      observer.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, [active]);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Scroll container with snap */}
      <main
        ref={containerRef}
        className="h-screen overflow-y-auto scroll-smooth"
        style={{ 
          willChange: 'scroll-position', 
          transform: 'translateZ(0)',
          scrollBehavior: 'smooth'
        }}
      >
        {children}
      </main>

      {/* Side dot nav */}
      <aside className="hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <ul className="flex flex-col gap-3">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`block w-3 h-3 rounded-full ring-2 ring-blue-400/40 transition-all ${
                  active === s.id ? "scale-125 bg-blue-600 ring-blue-600" : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={s.title}
                title={s.title}
              />
            </li>
          ))}
        </ul>
      </aside>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${((sections.findIndex(s => s.id === active) + 1) / sections.length) * 100}%` 
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default ScrollNavigator;
