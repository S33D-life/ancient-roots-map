import { hasMissingEnvVars, missingEnvVars } from "@/config/env";

const MissingEnvBanner = () => {
  // In production (Lovable Cloud), env vars are always injected — never show the banner
  if (import.meta.env.PROD) return null;
  if (!hasMissingEnvVars) return null;

  return (
    <div className="fixed left-3 right-3 top-3 z-[1200] rounded-xl border border-amber-300/40 bg-black/75 p-3 text-amber-100 shadow-lg backdrop-blur-sm sm:left-6 sm:right-6">
      <p className="text-sm font-semibold">Missing environment variables</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
        The app is running in safe mode. Add these values to your local <code>.env</code> file:
      </p>
      <p className="mt-2 text-xs font-mono text-amber-200">{missingEnvVars.join(", ")}</p>
    </div>
  );
};

export default MissingEnvBanner;
