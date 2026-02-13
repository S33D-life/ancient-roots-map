import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// NOTE: This is a lightweight welcome gate, NOT a security boundary.
// Real access control is enforced server-side via Supabase RLS policies.
// The password is intentionally simple and client-side only.
const PASSWORD = "Love";
const STORAGE_KEY = "af-auth";

export const isAuthenticated = () => sessionStorage.getItem(STORAGE_KEY) === "true";

const PasswordGate = ({ onSuccess }: { onSuccess: () => void }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      onSuccess();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6 px-6">
        <h1
          className="text-4xl md:text-5xl font-serif tracking-wider"
          style={{ color: "hsl(35 80% 55%)", textShadow: "0 0 30px hsl(35 80% 30% / 0.6)" }}
        >
          Ancient Friends
        </h1>
        <p className="text-amber-200/70 font-serif text-sm">Enter the grove</p>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-xs">
          <Input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            aria-label="Grove password"
            className="bg-black/60 border-amber-700/50 text-amber-100 placeholder:text-amber-200/30 h-11"
            autoFocus
          />
          <Button type="submit" variant="secondary" size="default" className="h-11 px-5">
            Enter
          </Button>
        </form>
        {error && <p className="text-red-400 text-sm font-serif">Wrong password</p>}
      </div>
    </div>
  );
};

export default PasswordGate;
