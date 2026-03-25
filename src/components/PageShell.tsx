import { motion } from "framer-motion";

/**
 * PageShell — wraps page content in a unified fade+lift transition.
 * Provides consistent entry/exit animations across all S33D spaces,
 * making the app feel like one organism instead of separate screens.
 */

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Slower, more cinematic entrance for feature pages */
  cinematic?: boolean;
}

const PageShell = ({ children, className = "", style, cinematic = false }: PageShellProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: cinematic ? 16 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: cinematic ? 0.5 : 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default PageShell;
