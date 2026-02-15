import { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password: string;
}

const getStrength = (pw: string): { score: number; label: string; color: string } => {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;

  if (s <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
  if (s <= 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (s <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  if (s <= 4) return { score: 4, label: "Strong", color: "bg-primary" };
  return { score: 5, label: "Very strong", color: "bg-green-500" };
};

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const { score, label, color } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
