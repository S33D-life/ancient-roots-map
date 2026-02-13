import { motion } from "framer-motion";

/**
 * PageShell — wraps page content in a unified fade+lift transition.
 * Provides consistent entry/exit animations across all S33D spaces,
 * making the app feel like one organism instead of separate screens.
 */

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

const PageShell = ({ children, className = "" }: PageShellProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageShell;
