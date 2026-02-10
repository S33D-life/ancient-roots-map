import { useState, useRef, useEffect } from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Show a shimmer placeholder while loading */
  shimmer?: boolean;
}

/**
 * Lazy-loaded image with IntersectionObserver.
 * Only loads the image when it enters the viewport,
 * with an optional shimmer placeholder and fade-in.
 */
const OptimizedImage = ({ src, alt, className = "", shimmer = true, style, ...props }: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Shimmer placeholder */}
      {shimmer && !loaded && (
        <div
          className="absolute inset-0 bg-secondary/30"
          style={{
            background: "linear-gradient(90deg, hsl(var(--secondary) / 0.3) 25%, hsl(var(--secondary) / 0.5) 50%, hsl(var(--secondary) / 0.3) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      )}

      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          {...props}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default OptimizedImage;
